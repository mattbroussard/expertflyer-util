import { LitElement, html } from "./lib/lit-all.min.js";
import { ChromeStorageController } from "./chrome_storage_controller.mjs";

export class ExportAlertQueueButton extends LitElement {
  alerts = new ChromeStorageController(this, "alerts-alertQueue", []);

  onClick() {
    const json = JSON.stringify(this.alerts.get(), undefined, 2);
    navigator.clipboard.writeText(json);
  }

  render() {
    return html`<button @click=${this.onClick}>
      Export JSON to Clipboard
    </button>`;
  }
}
customElements.define("ef-export-alert-queue-button", ExportAlertQueueButton);

export class ImportAlertQueueButton extends LitElement {
  alerts = new ChromeStorageController(this, "alerts-alertQueue", []);

  validateJson(json) {
    if (!(json instanceof Array)) {
      return false;
    }

    const requiredKeys = {
      airline: "string",
      alertName: "string",
      arrivingAirport: "string",
      classCode: "string",
      date: "string",
      departingAirport: "string",
      flightNumber: "number",
      id: "string",
      quantity: "number",
      quantityMode: "number",
    };
    const optionalKeys = {
      batchId: "string",
    };

    return json.every(
      (entry) =>
        Object.entries(entry).every(
          ([key, val]) =>
            (key in requiredKeys && typeof val === requiredKeys[key]) ||
            (key in optionalKeys && typeof val === optionalKeys[key])
        ) && Object.keys(requiredKeys).every((key) => key in entry)
    );
  }

  async onClick() {
    const clipboardText = await navigator.clipboard.readText();
    let json;
    try {
      json = JSON.parse(clipboardText);

      if (!this.validateJson(json)) {
        throw new Error("invalid json");
      }
    } catch (err) {
      alert("Invalid JSON in clipboard");
      return;
    }

    const existingEntries = this.alerts.get();
    const existingIds = existingEntries.map((entry) => entry.id);
    const toAdd = json.filter((entry) => existingIds.indexOf(entry.id) == -1);
    const newEntries = [...existingEntries, ...toAdd];
    await this.alerts.set(newEntries);

    alert(
      `Added ${toAdd.length} entries, skipping ${
        json.length - toAdd.length
      } duplicates.`
    );
  }

  render() {
    return html`<button @click=${this.onClick}>
      Import JSON from Clipboard
    </button>`;
  }
}
customElements.define("ef-import-alert-queue-button", ImportAlertQueueButton);
