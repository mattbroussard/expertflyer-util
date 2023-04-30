import { LitElement, html, css, styleMap } from "../../lib/lit-all.min.js";

// Imitates the styling and behavior of EF's popups
export class HoverBox extends LitElement {
  static properties = {
    title: {
      type: String,
    },
    width: {
      type: Number,
    },
    visible: {
      type: Boolean,
      state: true,
    },
    top: {
      type: Number,
      state: true,
    },
    left: {
      type: Number,
      state: true,
    },
  };

  static styles = css`
    .hoverBoxContainer {
      font: 11px "Verdana", Arial, Helvetica, sans-serif;
      border: 2px solid #327cc5;
      float: left;
      position: absolute;
      visibility: hidden;
      background-color: #fff;
      cursor: auto;
      z-index: 10000;
      text-align: left;
    }

    .hoverBoxHeader {
      background-color: #eee;
      font-weight: bold;
      padding: 2px 2px 4px 4px;
      margin-bottom: 5px;
    }

    .hoverBoxClose {
      width: 12px;
      float: right;
    }

    .hoverBoxRow {
      padding: 2px 2px 2px 2px;
      margin-bottom: 4px;
    }
  `;

  constructor() {
    super();
    this.visible = false;
    this.top = 0;
    this.left = 0;

    // Can be overridden with attributes
    this.title = "Alert";
    this.width = 250;
  }

  hide() {
    this.visible = false;
  }

  // heavily inspired by EF's showHoverBox function
  show(ev = this.lastMouseMoveEvent) {
    const container = this.renderRoot.querySelector(".hoverBoxContainer");
    let mousePosX = 0;
    let mousePosY = 0;
    if (ev?.pageX) {
      mousePosX = ev.pageX;
      mousePosY = ev.pageY;
    }

    if (
      mousePosY + container.offsetHeight >
      getWindowSizeClientHeight() + getWindowSizeScrollTop()
    ) {
      this.top =
        getWindowSizeClientHeight() +
        getWindowSizeScrollTop() -
        container.offsetHeight;
    } else {
      this.top = mousePosY;
    }

    if (
      mousePosX + container.offsetWidth >
      getWindowSizeClientWidth() + getWindowSizeScrollLeft()
    ) {
      this.left =
        getWindowSizeClientWidth() +
        getWindowSizeScrollLeft() -
        container.offsetWidth;
    } else {
      this.left = mousePosX;
    }

    this.visible = true;
  }

  lastMouseMoveEvent = null;
  onMouseMove = (ev) => {
    this.lastMouseMoveEvent = ev;
  };

  connectedCallback() {
    super.connectedCallback();
    document.body.addEventListener("mousemove", this.onMouseMove);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.body.removeEventListener("mousemove", this.onMouseMove);
  }

  render() {
    return html`
      <div
        class="hoverBoxContainer"
        style=${styleMap({
          top: this.top + "px",
          left: this.left + "px",
          width: this.width + "px",
          visibility: this.visible ? "visible" : "hidden",
        })}
      >
        <div class="hoverBoxHeader">
          <div class="hoverBoxClose">
            <a href="javascript:void(0)" @click=${this.hide}>
              <img
                src="https://www.expertflyer.com/include/images/lbclosebutton.gif"
              />
            </a>
          </div>
          ${this.title}
        </div>
        <div class="hoverBoxRow">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
customElements.define("ef-utils-hover-box", HoverBox);

// These functions copied from EF
function getWindowSizeClientWidth() {
  return getWindowSizeFilterResults(
    window.innerWidth ? window.innerWidth : 0,
    document.documentElement ? document.documentElement.clientWidth : 0,
    document.body ? document.body.clientWidth : 0
  );
}
function getWindowSizeClientHeight() {
  return getWindowSizeFilterResults(
    window.innerHeight ? window.innerHeight : 0,
    document.documentElement ? document.documentElement.clientHeight : 0,
    document.body ? document.body.clientHeight : 0
  );
}
function getWindowSizeScrollLeft() {
  return getWindowSizeFilterResults(
    window.pageXOffset ? window.pageXOffset : 0,
    document.documentElement ? document.documentElement.scrollLeft : 0,
    document.body ? document.body.scrollLeft : 0
  );
}
function getWindowSizeScrollTop() {
  return getWindowSizeFilterResults(
    window.pageYOffset ? window.pageYOffset : 0,
    document.documentElement ? document.documentElement.scrollTop : 0,
    document.body ? document.body.scrollTop : 0
  );
}
function getWindowSizeFilterResults(D, B, A) {
  var C = D ? D : 0;
  if (B && (!C || C > B)) {
    C = B;
  }
  return A && (!C || C > A) ? A : C;
}
