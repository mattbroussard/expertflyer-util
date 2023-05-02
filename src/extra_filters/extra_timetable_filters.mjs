import { LitElement, html } from "../../lib/lit-all.min.js";

export class ExtraTimetableFilters extends LitElement {
  onInput() {
    filterFlights();
  }

  render() {
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
        </ul>
      </td>
    `;
  }

  // We use EF's markup and styling, so can't use shadow dom
  createRenderRoot() {
    return this;
  }
}
customElements.define(
  "ef-utils-extra-timetable-filters",
  ExtraTimetableFilters
);

function filterResults(results) {
  console.log(results);
  const requireNonstops = document.querySelector(
    "div.filterPanel input#requireNonstop"
  ).checked;

  return results.filter((res) => {
    if (requireNonstops) {
      if (res.segmentList.length > 1) {
        return false;
      }
      if (res.segmentList[0].numStops > 0) {
        return false;
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
