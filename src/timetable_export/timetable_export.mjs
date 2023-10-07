function exportJSON() {
  const data = getData();
  const json = JSON.stringify(data, undefined, 2);
  navigator.clipboard.writeText(json);
}

function getData() {
  // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.DataTable.html
  const table = window["flightTimetablesResultsDatatable"];
  if (!table) {
    return [];
  }

  // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.DataTable.html#method_getRecordSet
  // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.RecordSet.html#method_getRecords
  // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.Record.html#method_getData
  return table
    .getRecordSet()
    .getRecords()
    .map((rec) => rec.getData().json);
}

function addExportButton() {
  const jsonButton = document.createElement("a");
  jsonButton.innerText = "Copy JSON";
  jsonButton.href = "javascript:void(0);";
  jsonButton.onclick = exportJSON;
  jsonButton.id = "ef-util-export-json-button";

  const filterSearchButton = document.querySelector("#filterSearchButton");
  filterSearchButton.parentNode.insertBefore(
    jsonButton,
    filterSearchButton.nextSibling
  );
}

addExportButton();
