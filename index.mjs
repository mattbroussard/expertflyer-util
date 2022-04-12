import { LitElement, html } from "./lib/lit-all.min.js";
// prev "https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js";

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

  render() {
    return html`
      <p>Hello style!</p>
      Dummy: <validated-input .validator=${dummyValidator}></validated-input
      ><br />
      Flight:
      <validated-input
        .validator=${singleFlightSpecValidator}
      ></validated-input>
    `;
  }
}

customElements.define("my-element", MyElement);

window.addEventListener("load", () => {
  document.body.appendChild(document.createElement("my-element"));
});
