function addHighlights() {
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

addHighlights();
