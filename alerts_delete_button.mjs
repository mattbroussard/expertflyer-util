import {
  LitElement,
  html,
  css,
  createRef,
  ref,
  when,
} from "./lib/lit-all.min.js";
import { newRandomId } from "./random_ids.mjs";

export class BulkActionButtons extends LitElement {
  static properties = {
    message: { state: true },
  };

  queueCheckbox = createRef();

  constructor() {
    super();
    this.message = null;
  }

  onClickDelete() {
    const selected = Array.from(
      document.querySelectorAll("ef-utils-alert-multiselect-checkbox")
    ).filter((check) => check.checked);
    if (selected.length == 0) {
      alert("Must have at least one alert selected");
      return;
    }

    const params = selected.map((check) => {
      // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.Record.html
      const record = check.yuiRecord;
      const alertId = record.getData("bean").alertId;
      const alertName = record.getData("bean").name;
      const alertType = "flight";

      // Params for EF's deleteAlert function
      return [alertId, alertName, alertType];
    });

    if (this.queueCheckbox.value.checked) {
      const batchId = newRandomId();
      const queueEntries = selected.map((check) => {
        // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.Record.html
        const record = check.yuiRecord;
        const bean = record.getData("bean");
        return {
          airline: bean.airlineCode,
          flightNumber: Number(bean.flightNumber),
          departingAirport: record.getData("departAirportCode"),
          arrivingAirport: record.getData("arriveAirportCode"),
          classCode: bean.classCode,
          quantity: bean.quantity,
          quantityMode: bean.quantityOperator.code,
          date: record.getData("departureDate"),
          alertName: bean.name,
          id: newRandomId(),
          batchId,
        };
      });

      window.postMessage(
        { type: "ef-util-add-alerts-to-queue", alerts: queueEntries },
        "*"
      );
    }

    // Async, not awaited; errors handled internally
    this.processDeletions(params);
  }

  onClickResubmit() {
    const selected = Array.from(
      document.querySelectorAll("ef-utils-alert-multiselect-checkbox")
    ).filter(
      (check) =>
        check.checked && check.yuiRecord.getData("flagFlightShowResubmit")
    );
    if (selected.length == 0) {
      alert("Must have at least one resubmittable alert selected");
      return;
    }

    const params = selected.map((check) => {
      // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.Record.html
      const record = check.yuiRecord;
      const alertId = record.getData("bean").alertId;
      const alertType = "flight";

      // Params for EF's resubmitAlert function
      return [alertId, alertType];
    });

    // Async, not awaited; errors handled internally
    this.processResubmissions(params);
  }

  async processMultiple(params, singleMethodName, verb) {
    for (let i = 0; i < params.length; i++) {
      this.message = `${verb} ${i + 1} of ${params.length}...`;

      const singleParams = params[i];
      try {
        await this[singleMethodName](singleParams);
      } catch (err) {
        this.message = `Error: ${err.message}`;
        return;
      }
    }

    this.message = null;
  }

  async processDeletions(deletions) {
    await this.processMultiple(deletions, "deleteSingle", "Deleting");
  }

  async processResubmissions(resubmissions) {
    await this.processMultiple(resubmissions, "resubmitSingle", "Resubmitting");
  }

  async rateLimit() {
    // Random wait between 2-4 seconds for rate limiting
    const timeout = Math.round(Math.random() * 2000) + 2000;
    await wait(timeout);
  }

  promisifyEFAsyncRequest(memo) {
    let resolvePromise;
    let rejectPromise;
    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    // Handle return of AJAX call that deleteAlert/resubmitAlert does
    patchSingleCall(
      GUI.util,
      "AsyncRequest",
      (orig) => (method, url, options, parameters) => {
        return orig.call(
          GUI.util,
          method,
          url,
          {
            ...options,
            success: function (...successArgs) {
              resolvePromise();
              return options.success.apply(this, successArgs);
            },
            failure: function (...failureArgs) {
              rejectPromise(new Error(`${memo} AJAX failure`));
              return options.failure.apply(this, failureArgs);
            },
          },
          parameters
        );
      }
    );

    return promise;
  }

  async deleteSingle(deletionParams) {
    if (!deleteAlert || !GUI?.util?.AsyncRequest) {
      throw new Error("deleteAlert or required YUI functions missing");
    }

    await this.rateLimit();

    // Prevent confirmation popup from appearing during deleteAlert call
    patchSingleCall(GUI, "confirm", (orig) => (message, onConfirmed) => {
      onConfirmed();
    });

    // Handle return of AJAX call that deleteAlert does
    const promise = this.promisifyEFAsyncRequest("deleteAlert");

    // Call EF's own deleteAlert function now that we've messed with the YUI methods it calls :P
    deleteAlert(...deletionParams);
    await promise;
  }

  async resubmitSingle(resubmitParams) {
    if (!resubmitAlert || !GUI?.util?.AsyncRequest) {
      throw new Error("deleteAlert or required YUI functions missing");
    }

    await this.rateLimit();

    // Handle return of AJAX call that resubmitAlert does
    const promise = this.promisifyEFAsyncRequest("resubmitAlert");

    // Call EF's own resubmitAlert function now that we've messed with the YUI methods it calls :P
    resubmitAlert(...resubmitParams);
    await promise;
  }

  static styles = css`
    button {
      margin-left: 5px;
    }
    label {
      user-select: none;
    }
    :host(*) {
      position: relative;
      top: 2em;
      margin-top: -2em;
      margin-bottom: 2.5em;
      margin-left: 5px;
      display: inline-block;
    }
  `;

  render() {
    return html`
      <button @click=${this.onClickDelete} ?disabled=${!!this.message}>
        ${this.message || "Delete selected"}
      </button>
      ${when(
        !this.message,
        () => html`
          <button @click=${this.onClickResubmit}>Resubmit selected</button>
        `
      )}
      <br />
      <input type="checkbox" id="queueCheck" ${ref(this.queueCheckbox)} />
      <label for="queueCheck">When deleting, add back to EFUtils queue</label>
    `;
  }
}
customElements.define("ef-utils-alert-bulk-action-buttons", BulkActionButtons);

// TODO: figure out how to share this from content_script_utils in an ESM context
async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO: figure out how to share this from content_script_utils in an ESM context
function patchSingleCall(obj, key, replacementFactory) {
  if (!obj || !obj[key]) {
    throw new Error("invalid args to withPatchSingle");
  }

  const orig = obj[key];
  const replacement = replacementFactory(orig);

  const patched = function (...args) {
    obj[key] = orig;
    return replacement.apply(this, args);
  };

  obj[key] = patched;
}
