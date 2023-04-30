import { LitElement, html, css } from "../../lib/lit-all.min.js";
import "./alert_queue_table.mjs";
import "./new_alert_form.mjs";
import "../alerts_form_filler/alert_filler_status_display.mjs";

export class AlertsQueueUI extends LitElement {
  static styles = css`
    ef-utils-new-alert-form,
    ef-utils-alert-queue-table,
    ef-utils-alert-filler-status-display {
      display: block;
    }

    ef-utils-new-alert-form {
      margin-bottom: 32px;
    }

    #container {
      padding-top: 24px;
    }
  `;

  render() {
    return html`
      <div id="container">
        <ef-utils-alert-filler-status-display></ef-utils-alert-filler-status-display>
        <ef-utils-new-alert-form></ef-utils-new-alert-form>
        <ef-utils-alert-queue-table></ef-utils-alert-queue-table>
      </div>
    `;
  }
}
customElements.define("ef-utils-alerts-queue-ui", AlertsQueueUI);

function insertAlertsQueueUI() {
  const container = document.querySelector("div#centerwell");
  if (!container) {
    console.warn("could not inject ef-utils iframe");
    return;
  }

  const el = new AlertsQueueUI();
  container.appendChild(el);
}

insertAlertsQueueUI();
