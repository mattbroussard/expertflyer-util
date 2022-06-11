import { LitElement, html, css, when } from "./lib/lit-all.min.js";
import { ChromeStorageController } from "./chrome_storage_controller.mjs";
import "./alert_queue_import_export_buttons.mjs";

export class AlertQueueTable extends LitElement {
  alerts = new ChromeStorageController(this, "alerts-alertQueue", []);

  static styles = css`
    th {
      text-align: left;
    }
    table,
    th,
    td {
      border: 1px solid black;
      padding: 2px;
    }
    th,
    td {
      padding-right: 10px;
    }
    #buttons {
      margin-bottom: 5px;
    }
    #buttons > * {
      margin-right: 5px;
    }
  `;

  render() {
    const alerts = this.alerts.get();
    return html`
      <div id="container">
        <h2 id="queue_heading">Queued to Add (${alerts.length})</h2>
        <div id="buttons">
          <ef-export-alert-queue-button></ef-export-alert-queue-button>
          <ef-import-alert-queue-button></ef-import-alert-queue-button>
          <button @click=${this.clearQueue}>Clear Queue</button>
        </div>
        <table>
          <tbody>
            <tr>
              <th>Alert name</th>
              <th>Flight</th>
              <th>Date</th>
              <th>Class/Qty</th>
              <th>Actions</th>
            </tr>
            ${alerts.map(
              (alert, i) => html`<tr>
                <td>${alert.alertName}</td>
                <td>
                  ${alert.airline}${alert.flightNumber}
                  ${alert.departingAirport}-${alert.arrivingAirport}
                </td>
                <td>${alert.date}</td>
                <td>
                  ${alert.classCode} ${alert.quantityMode == 2 ? "<" : "≥"}
                  ${alert.quantity}
                </td>
                <td>
                  <button @click=${this.deleteEntry(alert, i)}>❌</button>
                  <button @click=${this.copyJson(alert)}>Copy JSON</button>
                  ${when(
                    alert.batchId,
                    () => html`<button
                      @click=${this.deleteBatch(alert.batchId)}
                    >
                      Delete batch
                    </button>`
                  )}
                </td>
              </tr>`
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  deleteEntry = (alert, idx) => () => {
    if (alert !== undefined) {
      this.alerts.set(this.alerts.get().filter((a) => a.id != alert.id));
    } else {
      const alerts = [...this.alerts.get()];
      alerts.splice(idx, 1);
      this.alerts.set(alerts);
    }
  };

  deleteBatch = (batchId) => () => {
    this.alerts.set(
      this.alerts.get().filter((alert) => alert.batchId != batchId)
    );
  };

  copyJson = (alert) => () => {
    navigator.clipboard.writeText(
      JSON.stringify(
        // We wrap in an array so same JSON can be used with "import json" button that expects a list
        [alert],
        undefined,
        2
      )
    );
  };

  clearQueue() {
    this.alerts.set([]);
  }
}
customElements.define("ef-utils-alert-queue-table", AlertQueueTable);
