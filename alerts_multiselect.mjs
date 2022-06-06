import "./alerts_multiselect_checkbox.mjs";
import "./alerts_delete_button.mjs";

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
