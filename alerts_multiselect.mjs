import { LitElement, html, ref, createRef } from "./lib/lit-all.min.js";

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

addCheckboxes();
