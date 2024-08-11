import { LitElement, html } from "../../lib/lit-all.min.js";
import "../../lib/lodash.min.js";

const fieldDefinitions = [
  {
    name: "departCountry",
    title: "Departure countries:",
    segmentKey: "departAirportLocation",
    parser: parseCountry,
  },
  {
    name: "departState",
    title: "Departure states:",
    segmentKey: "departAirportLocation",
    parser: parseState,
  },
  {
    name: "arriveCountry",
    title: "Arrival countries:",
    segmentKey: "arriveAirportLocation",
    parser: parseCountry,
  },
  {
    name: "arriveState",
    title: "Arrival states:",
    segmentKey: "arriveAirportLocation",
    parser: parseState,
  },
  {
    name: "equipment",
    title: "Aircraft:",
    segmentKey: "equipment",
    parser: parseEquipment,
  },
];

export class ExtraTimetableFilters extends LitElement {
  onInput() {
    // Call EF's filterFlights function
    filterFlights();
  }

  getPossibleFieldValues(segmentKey, parser) {
    const flights = window.myDataSource?.liveData;
    if (!flights) {
      return [];
    }

    let ret = _.chain(flights)
      .map("segmentList")
      .flatten()
      .map(segmentKey)
      .map(parser)
      .uniq()
      .sortBy()
      .value();

    // move "Unspecified" to the end if it exists
    const unspecIdx = ret.indexOf("Unspecified");
    if (unspecIdx != -1) {
      ret = ret.concat(ret.splice(unspecIdx, 1));
    }

    return ret;
  }

  selectAll = (name, checked) => () => {
    Array.from(
      document.querySelectorAll(
        `#filterPanel input[type=checkbox][name=showBucket].${name}`
      )
    ).forEach((check) => {
      check.checked = checked;
    });

    // Call EF's filterFlights function
    filterFlights();
  };

  render() {
    const fieldFilterSections = fieldDefinitions.map(
      ({ name, title, segmentKey, parser }) => {
        const values = this.getPossibleFieldValues(segmentKey, parser);
        return html`<div class="ef-utils-field-filter-section">
          ${title}
          <ul>
            ${values.map(
              (value) => html`<li>
                <input
                  type="checkbox"
                  name="showBucket"
                  id="showBucket"
                  class=${name}
                  value=${value}
                  checked
                  @input=${this.onInput}
                />${value}
              </li>`
            )}
          </ul>
          <a @click=${this.selectAll(name, true)}>Select All</a>
          <a @click=${this.selectAll(name, false)} style="margin-left: 10px;"
            >Deselect All</a
          >
        </div>`;
      }
    );

    return html`
      <td class="fe">&nbsp;</td>
      <td valign="top" class="fl"><label>EFUtils Options:</label></td>
      <td valign="top" class="fd">
        <ul>
          <li>
            <input
              type="checkbox"
              name="requireNonstop"
              id="requireNonstop"
              @input=${this.onInput}
            />
            Only show nonstops
          </li>
          <li>
            <input
              type="checkbox"
              name="requireDaily"
              id="requireDaily"
              @input=${this.onInput}
            />
            Only show daily flights
          </li>
        </ul>
        ${fieldFilterSections}
      </td>
    `;
  }

  // We use EF's markup and styling, so can't use shadow dom.
  // Also, inputs need to be visible to selectors in filterResults and saved_filters.mjs
  createRenderRoot() {
    return this;
  }
}
customElements.define(
  "ef-utils-extra-timetable-filters",
  ExtraTimetableFilters
);

function parseCountry(locationStr) {
  const parts = locationStr.split(",");
  return parts[parts.length - 1].trim();
}

function parseState(locationStr) {
  const parts = locationStr.split(",");
  if (parts.length <= 2) {
    return "Unspecified";
  }

  return parts[parts.length - 2].trim();
}

function parseEquipment(equipmentList) {
  if (!equipmentList || equipmentList.length == 0) {
    return "Unspecified";
  }

  return equipmentList[0].equipmentCode;
}

function filterResults(results) {
  const requireNonstops = document.querySelector(
    "div.filterPanel input#requireNonstop"
  ).checked;
  const requireDaily = document.querySelector(
    "div.filterPanel input#requireDaily"
  ).checked;

  const fields = fieldDefinitions.map((sec) => ({
    ...sec,
    exceptedValues: Array.from(
      document
        .querySelector("div.filterPanel")
        .querySelectorAll(`input#showBucket.${sec.name}`)
    )
      .filter((check) => !check.checked)
      .map((check) => check.value),
  }));

  return results.filter((res) => {
    if (requireNonstops) {
      if (res.segmentList.length > 1) {
        return false;
      }
      if (res.segmentList[0].numStops > 0) {
        return false;
      }
    }

    if (requireDaily && res.operatingDays != "Daily") {
      return false;
    }

    for (const { segmentKey, parser, exceptedValues } of fields) {
      for (const segment of res.segmentList) {
        if (exceptedValues.includes(parser(segment[segmentKey]))) {
          return false;
        }
      }
    }

    return true;
  });
}

function insertExtraFiltersUI() {
  const lastOptionsRow = document.querySelector(
    "div.filterPanel tr[rowtype=container]:nth-last-child(2)"
  );
  if (!lastOptionsRow) {
    return;
  }

  const el = new ExtraTimetableFilters();
  lastOptionsRow.parentNode.insertBefore(el, lastOptionsRow.nextSibling);
}

function hookFilterFunction() {
  const ds = window.myDataSource;
  if (!ds || !ds.doBeforeCallback) {
    return false;
  }

  const origDoBeforeCallback = ds.doBeforeCallback;
  ds.doBeforeCallback = function efutil_doBeforeCallback(req, raw, res, cb) {
    let ret = origDoBeforeCallback(req, raw, res, cb);
    ret.results = filterResults(res.results);
    return ret;
  };

  return true;
}

if (hookFilterFunction()) {
  insertExtraFiltersUI();
}
