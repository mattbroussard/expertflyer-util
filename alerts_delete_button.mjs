import { LitElement, html, css } from "./lib/lit-all.min.js";

export class DeleteAlertsButton extends LitElement {
  static properties = {
    message: { state: true },
  };

  constructor() {
    super();
    this.message = null;
  }

  onClick() {
    const selected = Array.from(
      document.querySelectorAll("ef-utils-alert-multiselect-checkbox")
    ).filter((check) => check.checked);
    if (selected.length == 0) {
      alert("Must have at least one alert selected");
      return;
    }

    const params = selected.map((check) => {
      const record = check.yuiRecord;
      const alertId = record.getData("bean").alertId;
      const alertName = record.getData("bean").name;
      const alertType = "flight";

      // Params for EF's deleteAlert function
      return [alertId, alertName, alertType];
    });

    // Async, not awaited; errors handled internally
    this.processDeletions(params);
  }

  async processDeletions(deletions) {
    for (let i = 0; i < deletions.length; i++) {
      this.message = `Deleting ${i + 1} of ${deletions.length}...`;

      const deletionParams = deletions[i];
      try {
        await this.deleteSingle(deletionParams);
      } catch (err) {
        this.message = `Error: ${err.message}`;
        return;
      }
    }

    this.message = null;
  }

  async deleteSingle(deletionParams) {
    if (!deleteAlert || !GUI?.util?.AsyncRequest) {
      throw new Error("deleteAlert or required YUI functions missing");
    }

    // Random wait between 2-4 seconds for rate limiting
    const timeout = Math.round(Math.random() * 2000) + 2000;
    await wait(timeout);

    let resolvePromise;
    let rejectPromise;
    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    // Prevent confirmation popup from appearing during deleteAlert call
    patchSingleCall(GUI, "confirm", (orig) => (message, onConfirmed) => {
      onConfirmed();
    });

    // Handle return of AJAX call that deleteAlert does
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
              rejectPromise(new Error("deleteAlert AJAX failure"));
              return options.failure.apply(this, failureArgs);
            },
          },
          parameters
        );
      }
    );

    // Call EF's own deleteAlert function now that we've messed with the YUI methods it calls :P
    deleteAlert(...deletionParams);
    await promise;
  }

  static styles = css`
    button {
      margin-left: 5px;
    }
  `;

  render() {
    return html`<button @click=${this.onClick} ?disabled=${!!this.message}>
      ${this.message || "Delete selected"}
    </button>`;
  }
}
customElements.define("ef-utils-alert-delete-button", DeleteAlertsButton);

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
