import { LitElement, html, css } from "../../lib/lit-all.min.js";
import { ChromeStorageController } from "../util/chrome_storage_controller.mjs";

const DAY = 24 * 60 * 60 * 1000;

export class CalendarNavButtons extends LitElement {
  static get properties() {
    return {
      date: { converter: (val) => new Date(val) },
      rangeWidth: { type: Number },
    };
  }

  static styles = css`
    #container {
      margin-top: 5px;
      margin-bottom: 5px;
    }
  `;

  execDayOffset = new ChromeStorageController(
    this,
    "calendarNav-execDayOffset",
    null
  );

  onClick =
    (direction = 1) =>
    async () => {
      const btn = this.findRefineButton();
      if (!btn) {
        return;
      }

      await this.execDayOffset.set(this.computeDayOffset(direction));
      btn.click();
    };

  findRefineButton() {
    return Array.from(document.querySelectorAll("div.resultsnav a")).find(
      (el) => el.innerText.indexOf("Refine Search") != -1
    );
  }

  computeDayOffset(direction = 1) {
    return direction * (2 * this.rangeWidth + 1);
  }

  computeNextDate(direction = 1) {
    const d = this.date.getTime();

    return new Date(d + this.computeDayOffset(direction) * DAY);
  }

  computeDateRange(date = this.date) {
    const d = date.getTime();

    return [
      new Date(d - this.rangeWidth * DAY),
      new Date(d + this.rangeWidth * DAY),
    ];
  }

  shortDateRangeFormat(range) {
    if (range[0].getTime() == range[1].getTime()) {
      return this.shortDateFormat(range[0]);
    }

    return `${this.shortDateFormat(range[0])}-${this.shortDateFormat(
      range[1]
    )}`;
  }

  shortDateFormat(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  render() {
    const prevDate = this.computeNextDate(-1);
    const nextDate = this.computeNextDate(1);

    const prevRange = this.computeDateRange(prevDate);
    const nextRange = this.computeDateRange(nextDate);

    const nDays = this.rangeWidth * 2 + 1;
    const nDaysString = nDays == 1 ? "day" : `${nDays} days`;

    return html`
      <div id="container">
        <button @click=${this.onClick(-1)}>
          ← Prev ${nDaysString}: ${this.shortDateRangeFormat(prevRange)}
        </button>
        <button @click=${this.onClick(1)}>
          Next ${nDaysString}: ${this.shortDateRangeFormat(nextRange)} →
        </button>
      </div>
    `;
  }
}
customElements.define("ef-utils-calendar-nav-buttons", CalendarNavButtons);

function insertButtons() {
  const header = document.querySelector("div.resultsSummary.resultsheader");
  if (!header) {
    return;
  }

  const matches =
    /Departing [A-Z]{3} on ([\d\/]+ \d+:\d+ [AP]M)( ± (\d+) Day)?/.exec(
      header.innerText
    );
  if (!matches) {
    return;
  }

  const date = matches[1];
  const rangeWidth = matches[3] || 0;

  const el = document.createElement("ef-utils-calendar-nav-buttons");
  el.setAttribute("date", date);
  el.setAttribute("rangeWidth", rangeWidth);
  header.parentNode.insertBefore(el, header.nextSibling);

  const el2 = el.cloneNode();
  header.parentNode.appendChild(el2);
}

insertButtons();
