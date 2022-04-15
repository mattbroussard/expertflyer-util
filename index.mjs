import { LitElement, html, css } from "./lib/lit-all.min.js";
import { ChromeStorageController } from "./chrome_storage_controller.mjs";
// prev "https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js";

const testData = {
  alertName: "test alert",
  departingAirport: "SFO",
  arrivingAirport: "NRT",
  date: "5/1/22",
  airline: "UA",
  flightNumber: 837,
  quantity: 1,
  classCode: "I",
};

class ValidatedInput extends LitElement {
  static properties = {
    validator: {
      type: Function, // (input: string) => ({data: any; displayMsg: string; isValid: boolean})
    },
    displayMsg: {
      type: String,
      state: true,
    },
  };

  constructor() {
    super();

    this.validator = () => ({
      data: null,
      displayMsg: "no validator",
      isValid: false,
    });
    this.displayMsg = "";
  }

  onChange(event) {
    const val = event.target.value;
    const obj = this.validator(val);
    this.displayMsg = obj.displayMsg;
    console.log("onChange", val, obj);
  }

  render() {
    return html`
      <input type="text" @change=${this.onChange} @keyup=${this.onChange} />
      <span>${this.displayMsg}</span>
    `;
  }
}
customElements.define("validated-input", ValidatedInput);

function dummyValidator() {
  return {
    isValid: false,
    data: null,
    displayMsg: "invalid input",
  };
}

function singleFlightSpecValidator(input) {
  const re = /([A-Z]{2})(\d+) ([A-Z]{3})-([A-Z]{3})/;
  const matches = re.exec(input.toUpperCase());
  if (!matches) {
    return {
      isValid: false,
      data: null,
      displayMsg: 'invalid; enter a flight like "NH7 SFO-NRT"',
    };
  }

  const [, airline, flightNumber, origin, destination] = matches;
  const data = { airline, flightNumber, origin, destination };

  return {
    isValid: true,
    data,
    displayMsg: `${airline} flight ${flightNumber} from ${origin} to ${destination}`,
  };
}

// @customElement("my-element")
class MyElement extends LitElement {
  // @property({type: Boolean})
  // enabled = false;

  entries = new ChromeStorageController(this, "dummy_data1", []);
  addNewData() {
    this.entries.set([...this.entries.get(), testData]);
  }

  static styles = css`
    #storage-test {
      border: 1px solid black;
    }
  `;

  render() {
    return html`
      <p>Hello style!</p>
      Dummy: <validated-input .validator=${dummyValidator}></validated-input
      ><br />
      Flight:
      <validated-input
        .validator=${singleFlightSpecValidator}
      ></validated-input>
      <div id="storage-test">
        <button @click=${this.addNewData}>add row</button>
        entry count: ${this.entries.get().length}
        <ul>
          ${this.entries
            .get()
            .map(
              (entry) =>
                html`<li><pre>${JSON.stringify(entry, undefined, 2)}</pre></li>`
            )}
        </ul>
      </div>
    `;
  }
}

customElements.define("my-element", MyElement);

window.addEventListener("load", () => {
  document.body.appendChild(document.createElement("my-element"));
});
