import { LitElement, html, css, ref, createRef } from "./lib/lit-all.min.js";
import { ChromeStorageController } from "./chrome_storage_controller.mjs";
import { newRandomId } from "./random_ids.mjs";

function isValidDate(date) {
  return !isNaN(date.getTime());
}

function computeDays(a, b) {
  return Math.abs(a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000) + 1;
}

export class NewAlertForm extends LitElement {
  entries = new ChromeStorageController(this, "dummy_data1", []);
  startDateInput = createRef();
  endDateInput = createRef();

  static properties = {
    validated: {
      type: Boolean,
      state: true,
    },
    days: {
      type: Number,
      state: true,
    },
  };

  static styles = css`
    input {
      font-family: monospace;
    }
  `;

  constructor() {
    super();
    this.validated = false;
    this.days = 1;

    const now = new Date();
    this.today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
  }

  getFlightDetails() {
    const text = this.renderRoot
      .querySelector("#flightNum")
      .value.toUpperCase();
    const matches = /^([A-Z]{2})(\d+) ([A-Z]{3})-([A-Z]{3})$/.exec(text);
    if (!matches) {
      return null;
    }
    return {
      airline: matches[1],
      flightNumber: Number(matches[2]),
      departingAirport: matches[3],
      arrivingAirport: matches[4],
    };
  }

  validate() {
    this.validated =
      !!this.getFlightDetails() &&
      isValidDate(this.startDate) &&
      isValidDate(this.endDate) &&
      this.endDate >= this.startDate &&
      this.renderRoot.querySelector("#classCode").value.length == 1;
  }

  get startDate() {
    return new Date(this.startDateInput.value.value);
  }

  get endDate() {
    return new Date(this.endDateInput.value.value);
  }

  swapDates() {
    const start = this.startDateInput.value.value;
    const end = this.endDateInput.value.value;
    this.startDateInput.value.value = end;
    this.endDateInput.value.value = start;
  }

  dateChanged() {
    if (isValidDate(this.startDate) && isValidDate(this.endDate)) {
      if (this.startDate > this.endDate) {
        this.swapDates();
      }

      this.days = computeDays(this.startDate, this.endDate);
    }

    this.validate();
  }

  submit() {
    if (!this.validated) {
      return;
    }

    const data = {
      ...this.getFlightDetails(),
      classCode: this.renderRoot
        .querySelector("#classCode")
        .value.toUpperCase(),
      quantity: Number(this.renderRoot.querySelector("#quantity").value),
      batchId: newRandomId(),
    };
    const entries = [];

    for (
      let date = this.startDate.getTime();
      date <= this.endDate.getTime();
      date += 24 * 60 * 60 * 1000
    ) {
      const dateObj = new Date(date);
      const shortYear = String(dateObj.getUTCFullYear()).substring(2);
      const dateStr = `${
        dateObj.getUTCMonth() + 1
      }/${dateObj.getUTCDate()}/${shortYear}`;

      const {
        airline,
        flightNumber,
        departingAirport,
        arrivingAirport,
        classCode,
        quantity,
      } = data;
      const quantityStr = quantity > 1 ? ` x${quantity}` : "";
      const alertName = `${airline}${flightNumber} ${departingAirport}-${arrivingAirport} ${
        dateObj.getUTCMonth() + 1
      }/${dateObj.getUTCDate()} ${classCode}${quantityStr}`;

      entries.push({
        ...data,
        date: dateStr,
        alertName,
        id: newRandomId(),
      });
    }

    this.entries.set([...this.entries.get(), ...entries]);
  }

  render() {
    const today = this.today;
    const days = this.days;

    return html`
      Flight number & route:
      <input
        type="text"
        placeholder="NH7 SFO-NRT"
        id="flightNum"
        @input=${this.validate}
      /><br />
      Dates:
      <input
        type="date"
        ${ref(this.startDateInput)}
        required
        min=${today}
        value=${today}
        @input=${this.dateChanged}
      />
      -
      <input
        type="date"
        ${ref(this.endDateInput)}
        required
        min=${today}
        value=${today}
        @input=${this.dateChanged}
      />
      (${days} day${days > 1 ? "s" : ""})<br />
      Class/Qty:
      <input
        type="text"
        placeholder="I"
        maxlength="1"
        size="2"
        id="classCode"
        @input=${this.validate}
      />
      <select disabled>
        <option checked>&ge;</option>
        <option>&lt;</option>
      </select>
      <input
        type="number"
        value="1"
        placeholder="1"
        min="1"
        max="9"
        id="quantity"
        @input=${this.validate}
      /><br />
      <button ?disabled=${!this.validated} @click=${this.submit}>
        Queue Alerts
      </button>
    `;
  }
}
customElements.define("ef-utils-new-alert-form", NewAlertForm);
