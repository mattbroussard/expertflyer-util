import { LitElement, html } from "../../lib/lit-all.min.js";
import { ChromeStorageController } from "../util/chrome_storage_controller.mjs";

// Note: currently this code assumes the Flight Timetables page only, but it could be adjusted to work
// for Awards and Availability pages.
// Those have different callback methods when something changes and use IDs instead of classes.

const defaultOffChecks = ["requireNonstop"];

function getFiltersFromDOM() {
  const filterPanel = document.querySelector("#filterPanel");

  const bucketSel = "input[type=checkbox][name=showBucket]";
  const bucketChecks = Array.from(filterPanel.querySelectorAll(bucketSel));
  const types = Array.from(new Set(bucketChecks.map((chk) => chk.className)));

  const entries = [];
  for (const type of types) {
    const typeChecks = Array.from(
      filterPanel.querySelectorAll(`${bucketSel}.${type}`)
    );
    const checked = typeChecks.filter((chk) => chk.checked);
    const unchecked = typeChecks.filter((chk) => !chk.checked);

    const mode = checked.length < unchecked.length ? "only" : "except";
    const values = (mode == "only" ? checked : unchecked).map(
      (chk) => chk.value
    );

    entries.push({ name: "showBucket", className: type, mode, values });
  }

  const oneOffChecks = filterPanel.querySelectorAll(
    "input[type=checkbox]:not([name=showBucket])"
  );
  for (const check of oneOffChecks) {
    const checkedByDefault = defaultOffChecks.indexOf(check.name) == -1;
    if (check.checked == checkedByDefault) {
      continue;
    }

    entries.push({
      name: check.name,
      className: "",
      mode: check.checked ? "only" : "except",
      values: [],
    });
  }

  return entries;
}

function applyFilters(filterData) {
  const filterPanel = document.querySelector("#filterPanel");

  // Set all one-off checkboxes not specified by saved rules
  Array.from(
    filterPanel.querySelectorAll("input[type=checkbox]:not([name=showBucket])")
  ).forEach((check) => {
    const checkedByDefault = defaultOffChecks.indexOf(check.name) == -1;
    check.checked = checkedByDefault;
  });

  for (const { name, className, mode, values } of filterData) {
    if (name !== "showBucket") {
      const check = filterPanel.querySelector(
        `input[type=checkbox][name=${name}]`
      );
      if (!check) {
        continue;
      }
      check.checked = mode == "only";
    } else {
      const checks = Array.from(
        filterPanel.querySelectorAll(
          `input[type=checkbox][name=showBucket].${className}`
        )
      );
      for (const check of checks) {
        const listed = values.includes(check.value);
        const enabled = mode == "only" ? listed : !listed;
        check.checked = enabled;
      }
    }
  }

  // Call EF's filterFlights function (ordinarily called when toggling a checkbox)
  filterFlights();
}

function filterDataToString(filterData) {
  if (!filterData || filterData.length === 0) {
    return "(no filter settings)";
  }

  return filterData
    .filter(({ name, values }) => name != "showBucket" || values.length > 0)
    .map(({ name, className, mode, values }) => {
      if (name == "showBucket") {
        return `${className}: ${mode} ${values.join(",")}`;
      }

      return `${name}: ${mode == "only" ? "YES" : "NO"}`;
    })
    .join("\n");
}

export class SaveFilterButton extends LitElement {
  constructor(namespace) {
    super();
    this.namespace = namespace;

    // Note: namespace passed as constructor arg because attributes are not yet
    // populated in properties by constructor time; see convo with Elliott on
    // 12/6/2022.
    this.data = new ChromeStorageController(
      this,
      `savedFilter-${namespace}`,
      null
    );
  }

  onClick(event) {
    // Button is nested in a form element that we don't want to accidentally submit.
    event.preventDefault();
    event.stopPropagation();

    const filterData = getFiltersFromDOM();
    this.data.set(filterData);
  }

  render() {
    return html` <button @click=${this.onClick}>Save Filter</button> `;
  }
}
customElements.define("ef-utils-save-filter-button", SaveFilterButton);

export class RestoreFilterButton extends LitElement {
  constructor(namespace) {
    super();
    this.namespace = namespace;

    // Note: namespace passed as constructor arg because attributes are not yet
    // populated in properties by constructor time; see convo with Elliott on
    // 12/6/2022.
    this.data = new ChromeStorageController(
      this,
      `savedFilter-${namespace}`,
      null
    );
  }

  onClick() {
    const filterData = this.data.get();
    if (filterData === null) {
      return;
    }

    applyFilters(filterData);
  }

  render() {
    const filterData = this.data.get();
    if (filterData === null) {
      return null;
    }

    return html`<a
      href="javascript:void(0);"
      @click=${this.onClick}
      title=${`Restore Saved Filter:\n\n${filterDataToString(filterData)}`}
      >Restore Saved Filter</a
    >`;
  }

  // Don't use shadow DOM; we want our button to be styled the same as EF's button adjacent to it.
  createRenderRoot() {
    return this;
  }
}
customElements.define("ef-utils-restore-filter-button", RestoreFilterButton);

function addSavedFilterButtons() {
  const namespace = window.location.pathname;

  const saveButton = new SaveFilterButton(namespace);
  document
    .querySelector("#filterPanel tr[rowtype=control]:last-child td.fd")
    .appendChild(saveButton);

  const restoreButton = new RestoreFilterButton(namespace);
  const filterSearchButton = document.querySelector("#filterSearchButton");
  filterSearchButton.parentNode.insertBefore(
    restoreButton,
    filterSearchButton.nextSibling
  );
}

addSavedFilterButtons();
