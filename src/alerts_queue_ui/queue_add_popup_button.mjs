import { LitElement, html, css } from "../../lib/lit-all.min.js";
import "../util/hover_box.mjs";
import "./new_alert_form.mjs";
import { formatDateForDateInputValue } from "./new_alert_form.mjs";

export class AddToQueuePopupButton extends LitElement {
  static properties = {
    prefillData: {
      attribute: false,
    },
  };

  static styles = css`
    a {
      width: 16px;
      height: 16px;
      font-size: 14px;
      position: relative;
      bottom: 1px;
      left: 1px;
      text-decoration: none;
    }

    ef-utils-new-alert-form {
      margin: 4px;
      display: block;
    }
  `;

  get hoverBox() {
    return this.renderRoot.querySelector("ef-utils-hover-box");
  }

  onClick(ev) {
    this.hoverBox.show(ev);
  }

  onSubmit() {
    this.hoverBox.hide();
  }

  render() {
    return html`<a
        href="javascript:void(0);"
        title="Add to EFUtils Queue"
        @click=${this.onClick}
        >🤖</a
      >
      <ef-utils-hover-box title="Add to EFUtils Queue" width="350">
        <ef-utils-new-alert-form
          narrow="true"
          .prefillData=${this.prefillData}
          @submit=${this.onSubmit}
        ></ef-utils-new-alert-form>
      </ef-utils-hover-box>`;
  }
}
customElements.define(
  "ef-utils-add-to-queue-popup-button",
  AddToQueuePopupButton
);

function extractPrefillDataFromRow(flightRow) {
  const src = flightRow
    .querySelector(".colDepart a")
    .innerText.trim()
    .toUpperCase();
  const dst = flightRow
    .querySelector(".colArrive a")
    .innerText.trim()
    .toUpperCase();
  const flightNum = flightRow
    .querySelector(".colFlight")
    .innerText.replace(/\s/g, "")
    .replace(/\(.*\)/g, "")
    .toUpperCase();

  const classCode =
    flightRow
      .querySelector("tr.rowAvailClasses td.colCode, .colClasses .classCode")
      ?.innerText?.trim() ?? undefined;

  const freqStr = flightRow
    .querySelector(".colFrequency")
    .innerText.split("\n")[0];
  const weekdays = freqStr.indexOf("Daily") != -1 ? "" : freqStr.trim();

  const departStr = flightRow.querySelector(".colDepart").innerText;
  const dateMatches = departStr.match(/\d{2}\/\d{2}\/\d{2}/);
  let date = undefined;
  if (dateMatches.length) {
    date = formatDateForDateInputValue(new Date(dateMatches[0]));
  }

  return {
    flightNum: `${flightNum} ${src}-${dst}`,
    classCode,
    weekdays,
    date,
  };
}

function addToTable() {
  const flights = Array.from(
    document.querySelectorAll(
      [
        // availability page
        "div.resultsContainer div.flightContainer div.rowSegment",
        // awards page
        "div.resultsContainer div.flightContainer table.rowFinal tr.row:not(.rowFlight)",
      ].join(", ")
    )
  );
  if (flights.length == 0) {
    return;
  }

  for (const flight of flights) {
    // Note: opsCell container is td on awards page and span on availability page
    const opsCell = flight.querySelector(".col.colOps div.ops");
    if (!opsCell) {
      continue;
    }

    // Don't add multiple times
    if (opsCell.querySelector("ef-utils-add-to-queue-popup-button")) {
      continue;
    }

    const prefill = extractPrefillDataFromRow(flight);

    const el = new AddToQueuePopupButton();
    el.prefillData = prefill;
    opsCell.appendChild(el);
  }
}

// Since the availability page has a "Get more results" button that adds more rows to the page,
// this monkey patches EF's insertFlights function that gets called when that is clicked to add
// our UI to the new rows.
function hookInsertFlights() {
  if (!window.insertFlights || window.efUtilsAlreadyHookedInsertFlights) {
    return;
  }

  window.efUtilsAlreadyHookedInsertFlights = true;
  const origInsertFlights = window.insertFlights;

  window.insertFlights = function (...args) {
    try {
      return origInsertFlights(...args);
    } finally {
      addToTable();
    }
  };
}

addToTable();
hookInsertFlights();
