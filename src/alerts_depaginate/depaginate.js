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

  function buildDepaginatorButton(
    // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.Paginator.html
    paginator
  ) {
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
      // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.Paginator.html
      const paginator = getObject(varName);
      const element = document.querySelector(selector);
      if (!paginator || !element) {
        continue;
      }

      const btn = buildDepaginatorButton(paginator);

      // TODO: this is fragile because the paginator UI rerenders itself sometimes and blows away our
      // UI. This seems especially likely to happen if the table is initially empty (though it could
      // become nonempty by changing filters). We should probably try to inject UI as a sibling rather
      // than child, but it's easier to style this way.
      element.appendChild(btn);
    }
  }

  addDepaginatorButtons();
})();
