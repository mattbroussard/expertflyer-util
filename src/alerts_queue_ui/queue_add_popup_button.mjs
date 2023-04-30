import { LitElement, html, css } from "../../lib/lit-all.min.js";
import "../util/hover_box.mjs";

export class AddToQueuePopupButton extends LitElement {
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
  `;

  onClick(ev) {
    this.renderRoot.querySelector("ef-utils-hover-box").show(ev);
  }

  render() {
    return html`<a
        href="javascript:void(0);"
        title="Add to EFUtils Queue"
        @click=${this.onClick}
        >🤖</a
      >
      <ef-utils-hover-box title="Add to EFUtils Queue">
        Sorry, not yet implemented.
      </ef-utils-hover-box>`;
  }
}
customElements.define(
  "ef-utils-add-to-queue-popup-button",
  AddToQueuePopupButton
);

function addToTable() {
  const flights = Array.from(
    document.querySelectorAll("div.resultsContainer div.flightContainer")
  );
  if (flights.length == 0) {
    return;
  }

  for (const flight of flights) {
    // Note: opsCell container is td on awards page and span on availability page
    const opsCells = Array.from(flight.querySelectorAll(".col.colOps div.ops"));

    for (const opsCell of opsCells) {
      // Don't add multiple times
      if (opsCell.querySelector("ef-utils-add-to-queue-popup-button")) {
        continue;
      }

      const el = new AddToQueuePopupButton();
      opsCell.appendChild(el);
    }
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
