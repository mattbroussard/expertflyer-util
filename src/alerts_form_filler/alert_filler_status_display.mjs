import { LitElement, html, css, when } from "../../lib/lit-all.min.js";
import { ChromeStorageController } from "../util/chrome_storage_controller.mjs";

export class AlertFillerStatusDisplay extends LitElement {
  entries = new ChromeStorageController(this, "alerts-alertQueue", []);
  currentState = new ChromeStorageController(
    this,
    "alerts-currentState",
    "idle"
  );
  kickHintTimer = new TimeoutFlag(this, 5000);

  static styles = css`
    #container {
      margin-bottom: 10px;
      font-size: 16px;
    }
    h2 {
      font-size: 18px;
    }
  `;

  get displayStatus() {
    switch (this.currentState.get()) {
      case "idle":
        return "Idle";
      case "waiting_for_form":
        return "Waiting for form to load";
      case "waiting_for_submit":
        return "Filled form, waiting to submit";
      case "waiting_for_success":
        return "Submitted, waiting for result";
      case "error":
        return "Some error occurred; check extension ServiceWorker log + load new alert page again";
      default:
        return this.currentState.get();
    }
  }

  get isOnSuccessPage() {
    const successPath = "/flightAlertSaveVerification.do";
    return window.location.pathname == successPath;
  }

  start(evt) {
    if (this.entries.get().length < 1) {
      alert("Can't start with an empty queue.");
      return;
    }
    evt.target.disabled = true;

    window.postMessage({ type: "ef-util-alert-start-queue" }, "*");
  }

  stop(evt) {
    evt.target.disabled = true;
    window.postMessage({ type: "ef-util-alert-stop-queue" }, "*");
  }

  render() {
    const state = this.currentState.get();
    let kickHint = undefined;
    if (
      // state == "waiting_for_form" &&
      this.isOnSuccessPage &&
      this.kickHintTimer.hasWaited
    ) {
      kickHint = html`
        <h3>
          Been stuck on this page for too long? Chrome has a bug;
          <a href="https://www.expertflyer.com/flightAlert.do" target="_parent"
            >try this</a
          >.
        </h3>
      `;
    }

    return html`
      <div id="container">
        <h2 id="status">
          Current runner status: ${this.displayStatus}
          ${when(
            this.currentState.get() == "idle",
            () => html`<button @click=${this.start}>Start</button>`,
            () => html`<button @click=${this.stop}>Stop</button>`
          )}
        </h2>
        ${kickHint}
      </div>
    `;
  }
}
customElements.define(
  "ef-utils-alert-filler-status-display",
  AlertFillerStatusDisplay
);

class TimeoutFlag {
  hasWaited = false;
  host = null;
  timeoutDuration = 0;
  timeout = null;

  constructor(host, timeoutDuration) {
    this.host = host;
    this.timeoutDuration = timeoutDuration;
    host.addController(this);
  }

  hostConnected() {
    this.timeout = setTimeout(() => {
      this.hasWaited = true;
      this.host.requestUpdate();
    }, this.timeoutDuration);
  }

  hostDisconnected() {
    clearTimeout(this.timeout);
  }
}
