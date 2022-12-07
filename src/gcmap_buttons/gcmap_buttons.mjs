import {
  LitElement,
  html,
  ref,
  createRef,
  css,
} from "../../lib/lit-all.min.js";

function buildGCMapURL(query) {
  const base = "http://www.gcmap.com/mapui";
  const url = new URL(base);
  url.searchParams.set("P", query);
  return url.toString();
}

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
    return buildGCMapURL(this.segmentString);
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

function addRowButtons() {
  // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.DataTable.html
  const table = window["flightTimetablesResultsDatatable"];
  if (!table) {
    return;
  }

  const detailsCol = table.getColumn("flightDetails");
  const detailsColSpec = detailsCol.getDefinition();
  // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.Column.html
  const newColSpec = {
    ...detailsColSpec,
    formatter: function (
      elCell, // DOM node
      oRecord, // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.Record.html
      oColumn // https://yui.github.io/yui2/docs/yui_2.9.0_full/docs/YAHOO.widget.Column.html
    ) {
      // Call default EF formatter
      detailsColSpec.formatter(elCell, oRecord, oColumn);

      const button = document.createElement("ef-utils-gcmap-button");
      button.yuiTable = table;
      button.yuiRecord = oRecord;

      const innerLiner = elCell.querySelector(".inner-liner");
      innerLiner.appendChild(button);
    },
  };

  table.removeColumn(detailsCol);
  table.insertColumn(newColSpec, 9);
  table.refreshView();
}

function mapAll() {
  const buttons = document.querySelectorAll("ef-utils-gcmap-button");
  const segments = Array.from(buttons).map((btn) => btn.segmentString);
  const uniqSegments = Array.from(new Set(segments));
  const query = uniqSegments.join(",");
  const url = buildGCMapURL(query);
  window.open(url, "_blank");
}

function addMapAllButton() {
  const button = document.createElement("a");
  button.innerText = "GCMap All";
  button.href = "javascript:void(0);";
  button.onclick = mapAll;
  button.id = "ef-util-gcmap-all-button";

  const filterSearchButton = document.querySelector("#filterSearchButton");
  filterSearchButton.parentNode.insertBefore(
    button,
    filterSearchButton.nextSibling
  );
}

addRowButtons();
addMapAllButton();
