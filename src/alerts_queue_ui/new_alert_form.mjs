import {
  LitElement,
  html,
  css,
  ref,
  createRef,
  when,
} from "../../lib/lit-all.min.js";
import { ChromeStorageController } from "../util/chrome_storage_controller.mjs";
import { newRandomId } from "../util/random_ids.mjs";

// Th has to be before T in the regex in order to not be matched as T
const weekdayRegex = /M|Th|T|W|F|Sa|Su/gi;
const defaultWeekdays = "MTWThFSaSu";

export function formatDateForDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function isValidDate(date) {
  return !isNaN(date.getTime());
}

function isValidWeekdayString(weekdays) {
  if (!weekdays) {
    return true;
  }
  return Boolean(weekdays.match(weekdayRegex));
}

function getDateObjects(startDate, endDate, weekdays) {
  const matches = Array.from(
    (weekdays || defaultWeekdays).matchAll(weekdayRegex)
  );
  if (!matches.length) {
    return [];
  }

  const weekdaySet = new Set();
  const idxToDay = ["su", "m", "t", "w", "th", "f", "sa"];
  for (const match of matches) {
    // Note: `match` is itself an array of matched capture groups
    const idx = idxToDay.indexOf(match[0].toLowerCase());
    if (idx >= 0) {
      weekdaySet.add(idx);
    }
  }

  const ret = [];

  for (
    let d = startDate.getTime();
    d <= endDate.getTime();
    d += 24 * 60 * 60 * 1000
  ) {
    const dateObj = new Date(d);

    if (weekdaySet.has(dateObj.getUTCDay())) {
      ret.push(dateObj);
    }
  }

  return ret;
}

export class NewAlertForm extends LitElement {
  entries = new ChromeStorageController(this, "alerts-alertQueue", []);
  currentState = new ChromeStorageController(
    this,
    "alerts-currentState",
    "idle"
  );
  startDateInput = createRef();
  endDateInput = createRef();

  static properties = {
    narrow: {
      type: Boolean,
    },
    prefillData: {
      attribute: false,
    },
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
    :host > * {
      font-size: 12px;
    }
    input {
      font-family: monospace;
    }
    #flightNum,
    #classCode {
      text-transform: uppercase;
    }
    div.row {
      margin-bottom: 5px;
    }
  `;

  constructor() {
    super();
    this.validated = false;
    this.days = 1;

    const now = new Date();
    this.today = formatDateForDateInputValue(now);
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
      this.days > 0 &&
      this.renderRoot.querySelector("#classCode").value.length == 1 &&
      this.renderRoot.querySelector("#prefix").value.length <= 6 &&
      isValidWeekdayString(this.renderRoot.querySelector("#weekdays").value) &&
      ["1", "2"].includes(this.renderRoot.querySelector("#quantityMode").value);
  }

  get startDate() {
    return new Date(this.startDateInput.value.value);
  }

  get endDate() {
    return new Date(this.endDateInput.value.value);
  }

  dateChanged() {
    if (isValidDate(this.startDate) && isValidDate(this.endDate)) {
      if (this.startDate > this.endDate) {
        this.endDateInput.value.value = this.startDateInput.value.value;
      }

      const weekdays = this.renderRoot.querySelector("#weekdays").value;
      this.days = getDateObjects(this.startDate, this.endDate, weekdays).length;
    }

    this.validate();
  }

  async submit() {
    if (!this.validated) {
      return;
    }

    const data = {
      ...this.getFlightDetails(),
      classCode: this.renderRoot
        .querySelector("#classCode")
        .value.toUpperCase(),
      quantity: Number(this.renderRoot.querySelector("#quantity").value),
      quantityMode: Number(
        this.renderRoot.querySelector("#quantityMode").value
      ),
      batchId: newRandomId(),
    };
    const entries = [];

    let prefix = this.renderRoot.querySelector("#prefix").value.trim();
    if (prefix.length > 0) {
      prefix += " ";
    }

    const weekdays = this.renderRoot.querySelector("#weekdays").value;

    for (const date of getDateObjects(this.startDate, this.endDate, weekdays)) {
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
        quantityMode,
      } = data;
      const quantityStr =
        quantityMode == 2
          ? `<${quantity}`
          : quantity > 1
          ? ` x${quantity}`
          : "";
      const alertName = `${prefix}${airline}${flightNumber} ${departingAirport}-${arrivingAirport} ${
        dateObj.getUTCMonth() + 1
      }/${dateObj.getUTCDate()} ${classCode}${quantityStr}`;

      entries.push({
        ...data,
        date: dateStr,
        alertName,
        id: newRandomId(),
      });
    }

    await this.entries.set([...this.entries.get(), ...entries]);

    this.dispatchEvent(new CustomEvent("submit", { detail: entries }));
  }

  firstUpdated() {
    super.firstUpdated();

    // This is to allow the queue button to be enabled if the state is valid already from prefillData
    this.validate();
  }

  render() {
    const today = this.today;
    const days = this.days;

    if (this.currentState.get() != "idle") {
      return null;
    }

    const weekdays = html`
      <input
        type="text"
        id="weekdays"
        placeholder=${defaultWeekdays}
        @input=${this.dateChanged}
        value=${this.prefillData?.weekdays}
        size="11"
      />
      (${days} day${days != 1 ? "s" : ""})
    `;
    // TODO: parenthesized days text is confusing, esp in narrow layout

    return html`
      <div class="row">
        Flight number & route:
        <input
          type="text"
          placeholder="NH7 SFO-NRT"
          id="flightNum"
          size="14"
          value=${this.prefillData?.flightNum}
          @input=${this.validate}
        />
      </div>
      <div class="row">
        Dates:
        <input
          type="date"
          ${ref(this.startDateInput)}
          required
          min=${today}
          value=${this.prefillData?.date ?? today}
          @input=${this.dateChanged}
        />
        -
        <input
          type="date"
          ${ref(this.endDateInput)}
          required
          min=${today}
          value=${this.prefillData?.date ?? today}
          @input=${this.dateChanged}
        />
        ${when(!this.narrow, () => weekdays)}
      </div>
      ${when(
        this.narrow,
        () => html`<div class="row">Weekdays: ${weekdays}</div>`
      )}
      <div class="row">
        Class/Qty:
        <input
          type="text"
          placeholder="I"
          maxlength="1"
          size="2"
          id="classCode"
          value=${this.prefillData?.classCode}
          @input=${this.validate}
        />
        <select id="quantityMode">
          <option value="1" checked>&ge;</option>
          <option value="2">&lt;</option>
        </select>
        <input
          type="number"
          value="1"
          placeholder="1"
          min="1"
          max="9"
          id="quantity"
          @input=${this.validate}
        />
      </div>
      <div class="row">
        Alert name prefix (optional):
        <input
          type="text"
          id="prefix"
          @input=${this.validate}
          size="6"
          maxlength="6"
        />
      </div>
      <button ?disabled=${!this.validated} @click=${this.submit}>
        Queue Alerts
      </button>
    `;
  }
}
customElements.define("ef-utils-new-alert-form", NewAlertForm);
