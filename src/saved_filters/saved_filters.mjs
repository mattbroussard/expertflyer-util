import { LitElement, html } from "../../lib/lit-all.min.js";
import { ChromeStorageController } from "../util/chrome_storage_controller.mjs";
import "../../lib/lodash.min.js";
import "../util/hover_box.mjs";

// Note: currently this code assumes the Flight Timetables page only, but it could be adjusted to work
// for Awards and Availability pages.
// Those have different callback methods when something changes and use IDs instead of classes.

const defaultOffChecks = ["requireNonstop", "requireDaily"];

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

    // Don't add entries that say "except []" because they don't do anything
    if (mode == "except" && values.length == 0) {
      continue;
    }

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

  // Enable all bucket checkboxes (to clear any previously set filter)
  Array.from(
    filterPanel.querySelectorAll("input[type=checkbox][name=showBucket]")
  ).forEach((check) => {
    check.checked = true;
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

// Since filters are displayed in two columns, this allows 3 rows of them
const mruLength = 6;

function loadFiltersMRU(storageController) {
  let filterData = storageController.get();
  if (!filterData || filterData.length == 0) {
    return [];
  }

  // Each filterData is an array, but the top-level storage field is also an array. Since there could
  // be old data stored from when we supported only one filter, we need to look down into the array to tell
  // if we're in that old case.
  if (!(filterData[0] instanceof Array)) {
    filterData = [filterData];
  }

  return filterData;
}

function pushFiltersMRU(storageController, newFilterData) {
  let filterData = [...loadFiltersMRU(storageController)];

  // If the item already exists, we're just bumping it to the most-recently used spot, so remove
  // it here and it'll be prepended again below
  const existingIdx = _.findIndex(filterData, (fd) =>
    _.isEqual(newFilterData, fd)
  );
  if (existingIdx != -1) {
    filterData.splice(existingIdx, 1);
  }

  // Prepend new item
  filterData.unshift(newFilterData);

  // Trim to max length
  if (filterData.length > mruLength) {
    filterData.splice(mruLength, filterData.length - mruLength);
  }

  return storageController.set(filterData);
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
    pushFiltersMRU(this.data, filterData);
  }

  render() {
    return html`
      <button @click=${this.onClick}>Save Filter for Later</button>
    `;
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

  onClick = (filterData) => () => {
    this.hoverBox.hide();
    applyFilters(filterData);
    pushFiltersMRU(this.data, filterData);
  };

  openMenu(ev) {
    this.hoverBox.show(ev);
  }

  get hoverBox() {
    return this.renderRoot.querySelector("ef-utils-hover-box");
  }

  render() {
    const filters = loadFiltersMRU(this.data);
    if (filters.length == 0) {
      return null;
    }

    return html`<a href="javascript:void(0);" @click=${this.openMenu}
        >Restore Saved Filter</a
      ><ef-utils-hover-box boxtitle="Choose filter to restore" width="400">
        <div class="ef-utils-restore-filter-menu">
          ${filters.map(
            (filterData) =>
              // Note: have to specify type=button because this ends up nested inside an EF form that
              // we don't want to submit
              html`<button
                type="button"
                class="ef-utils-restore-filter-menu-button"
                @click=${this.onClick(filterData)}
              >
                <pre>${filterDataToString(filterData)}</pre>
              </button>`
          )}
        </div>
      </ef-utils-hover-box>`;
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
