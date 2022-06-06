import { LitElement, html, ref, createRef, css } from "./lib/lit-all.min.js";

let lastChecked = null;

class AlertMultiselectCheckbox extends LitElement {
  static get properties() {
    return {
      yuiTable: { attribute: false },
      yuiRecord: { attribute: false },
      checked: { type: Boolean, attribute: "checked" },
    };
  }

  checkbox = createRef();

  constructor() {
    super();
    this.checked = false;
  }

  onClick(evt) {
    this.checked = this.checkbox.value.checked;

    const checks = Array.from(
      document.querySelectorAll("ef-utils-alert-multiselect-checkbox")
    );
    if (
      evt.shiftKey &&
      lastChecked &&
      checks.includes(lastChecked) &&
      this.checked == lastChecked.checked
    ) {
      // This approach is inspired by
      // https://codepen.io/danielhoppener/pen/xxKVbey
      let inBetween = false;
      for (const check of checks) {
        if (check === this || check === lastChecked) {
          inBetween = !inBetween;
        }

        if (inBetween) {
          check.checked = this.checked;
        }
      }
    }

    lastChecked = this;

    // Clicking also "focuses" the checkbox, and we preventDefault on all key events, so they don't
    // bubble up to allow things like reloading browser page. We don't want that, so don't let any
    // checkbox remain focused.
    this.blur();
  }

  onKeyDown(evt) {
    // We prevent key events so that the checkbox can only be manipulated with the mouse;
    // This is so that we can use MouseEvent.shiftKey since InputEvent doesn't have modifiers
    evt.preventDefault();
  }

  render() {
    return html`
      <input
        type="checkbox"
        ${ref(this.checkbox)}
        .checked=${this.checked}
        @click=${this.onClick}
        @keydown=${this.onKeyDown}
      />
    `;
  }
}
customElements.define(
  "ef-utils-alert-multiselect-checkbox",
  AlertMultiselectCheckbox
);

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

class AlertDeleteButton extends LitElement {
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
customElements.define("ef-utils-alert-delete-button", AlertDeleteButton);

function addCheckboxes() {
  // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.DataTable.html
  const table = window["flightAlertDatatable"];
  if (!table) {
    return;
  }

  // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.Column.html
  const colSpec = {
    key: "ef-util-checkbox",
    label: "&nbsp;",
    sortable: false,
    formatter: function (
      elCell, // DOM node
      oRecord, // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.Record.html
      oColumn // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.Column.html
    ) {
      const chk = document.createElement("ef-utils-alert-multiselect-checkbox");
      chk.yuiTable = table;
      chk.yuiRecord = oRecord;
      elCell.innerHTML = "";
      elCell.appendChild(chk);
    },
  };

  // Would look nicer at the left edge, but there is EF code that references columns by index
  table.insertColumn(colSpec, 7);
  table.refreshView();
}

function addDeleteButton() {
  const container = document.querySelector("#flightAlertListPaginator");
  if (container) {
    const btn = document.createElement("ef-utils-alert-delete-button");
    container.appendChild(btn);
  }
}

addCheckboxes();
addDeleteButton();
