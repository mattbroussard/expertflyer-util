import {
  LitElement,
  html,
  ref,
  createRef,
  css,
} from "../../lib/lit-all.min.js";

export class GCMapButton extends LitElement {
  static get properties() {
    return {
      yuiTable: { attribute: false },
      yuiRecord: { attribute: false },
    };
  }

  get segmentString() {
    const segments = this.yuiRecord.getData("segmentList");
    return segments.reduce(
      (str, seg) => `${str}-${seg.arriveAirportCode}`,
      segments[0].departAirportCode
    );
  }

  get imageUrl() {
    const script = document.getElementById("ef-util-gcmap-icon-url");
    const data = JSON.parse(script.innerHTML);
    return data.gcmapIcon;
  }

  get linkUrl() {
    const base = "http://www.gcmap.com/mapui";
    const url = new URL(base);
    url.searchParams.set("P", this.segmentString);
    return url.toString();
  }

  render() {
    return html`<a target="_blank" href=${
      this.linkUrl
    } title=${`GCMap: ${this.segmentString}`}><img src=${
      this.imageUrl
    }></img></a>`;
  }
}
customElements.define("ef-utils-gcmap-button", GCMapButton);

function addButtons() {
  // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.DataTable.html
  const table = window["flightTimetablesResultsDatatable"];
  if (!table) {
    return;
  }

  const detailsCol = table.getColumn("flightDetails");
  const detailsColSpec = detailsCol.getDefinition();
  const newColSpec = {
    ...detailsColSpec,
    formatter: function (elCell, oRecord, oColumn) {
      // Call default EF formatter
      detailsColSpec.formatter(elCell, oRecord, oColumn);

      const button = document.createElement("ef-utils-gcmap-button");
      button.yuiTable = table;
      button.yuiRecord = oRecord;
      elCell.appendChild(button);
    },
  };

  table.removeColumn(detailsCol);
  table.insertColumn(newColSpec, 9);
  table.refreshView();
}

addButtons();
