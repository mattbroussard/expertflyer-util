import "./alerts_multiselect_checkbox.mjs";
import "./alerts_bulk_action_buttons.mjs";

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

function addBulkActionButtons() {
  const container = document.querySelector("#flightAlertListPaginator");
  if (container) {
    const btn = document.createElement("ef-utils-alert-bulk-action-buttons");

    // TODO: this is fragile because the paginator UI rerenders itself sometimes and blows away our
    // UI. This seems especially likely to happen if the table is initially empty (though it could
    // become nonempty by changing filters). We should probably try to inject UI as a sibling rather
    // than child, but it's easier to style this way.
    container.appendChild(btn);
  }
}

addCheckboxes();
addBulkActionButtons();
