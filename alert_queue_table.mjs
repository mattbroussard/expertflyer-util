import { LitElement, html, css, when } from "./lib/lit-all.min.js";
import { ChromeStorageController } from "./chrome_storage_controller.mjs";

export class AlertQueueTable extends LitElement {
  alerts = new ChromeStorageController(this, "dummy_data1", []);

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
  `;

  render() {
    const alerts = this.alerts.get();
    return html`
      <div id="container">
        <h2 id="queue_heading">Queued to Add (${alerts.length})</h2>
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
                <td>${alert.classCode} &ge; ${alert.quantity}</td>
                <td>
                  <button @click=${this.deleteEntry(alert, i)}>❌</button>
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
}
customElements.define("ef-utils-alert-queue-table", AlertQueueTable);
