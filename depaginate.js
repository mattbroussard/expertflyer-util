(() => {
  const paginators = [
    {
      varName: "flightAlertDatatable.configs.paginator",
      selector: "#flightAlertListPaginator",
    },
    {
      varName: "flightScheduleAlertDatatable.configs.paginator",
      selector: "#flightScheduleAlertListPaginator",
    },
    {
      varName: "seatAlertDatatable.configs.paginator",
      selector: "#seatAlertListPaginator",
    },
    {
      varName: "aircraftChangeAlertDatatable.configs.paginator",
      selector: "#aircraftChangeAlertListPaginator",
    },
  ];

  function getObject(varName) {
    const path = varName.split(".");
    let obj = window;
    for (const el of path) {
      obj = obj ? obj[el] : obj;
    }
    return obj;
  }

  function buildDepaginatorButton(paginator) {
    const btn = document.createElement("button");
    btn.innerText = "Depaginate";
    btn.className = "ef-utils-depaginate-button";
    btn.onclick = function () {
      paginator.setRowsPerPage(500);
      btn.disabled = true;
    };
    return btn;
  }

  function addDepaginatorButtons() {
    for (const { varName, selector } of paginators) {
      const paginator = getObject(varName);
      const element = document.querySelector(selector);
      if (!paginator || !element) {
        continue;
      }

      const btn = buildDepaginatorButton(paginator);
      element.appendChild(btn);
    }
  }

  addDepaginatorButtons();
})();
