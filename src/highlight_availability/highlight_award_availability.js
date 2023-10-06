function highlightAvailabilityCells() {
  Array.from(
    document.querySelectorAll("tr.rowAvailClasses td.colSeats")
  ).forEach((td) => {
    const text = td.innerText.trim().toLowerCase();
    const n = parseInt(text, 10);

    let cls;
    if (!isNaN(n) && n > 0) {
      cls = `ef-utils-award-avail-${n > 4 ? 4 : n}`;
    } else if (text == "yes") {
      cls = "ef-utils-award-avail-yes";
    } else {
      return;
    }

    td.classList.add(cls);
    td.classList.add("ef-utils-award-avail-highlight");
  });
}

function highlightTabs() {
  const tabs = Array.from(document.querySelectorAll("ul.tabset li[id^=tab]"));

  for (const tab of tabs) {
    const name = tab.id.substring("tab".length);
    const containerId = "container" + name;
    const container = document.getElementById(containerId);
    if (!container) {
      continue;
    }

    const anyAvailable =
      container.querySelectorAll(".ef-utils-award-avail-highlight").length > 0;
    if (anyAvailable) {
      // Can't use a CSS class because EF's showTab function called when switching tabs
      // completely overwrites className on every tab
      tab.dataset.efUtilsAwardAvailTabHighlight = true;
    }
  }
}

highlightAvailabilityCells();
highlightTabs();
