import { newRandomId } from "./random_ids.mjs";

// Stub that decides which of the other two controllers to use based on whether
// we're running in a privileged environment that can use the chrome.storage API
// or not. If not, we have to proxy calls through postMessage to chrome_storage_proxy.js
export class ChromeStorageController {
  inner = null;

  constructor(host, key, defaultValue = null) {
    if (chrome?.storage && false) {
      this.inner = new PrivilegedChromeStorageController(
        host,
        key,
        defaultValue
      );
    } else {
      this.inner = new UnprivilegedChromeStorageController(
        host,
        key,
        defaultValue
      );
    }
  }

  get() {
    return this.inner.get();
  }

  set(val) {
    return this.inner.set(val);
  }
}

// Lit reactive controller that syncs data from Chrome extension storage API
// and updates the host element when data changes
// This class uses Chrome APIs directly so it can only run in an extension page.
export class PrivilegedChromeStorageController {
  host = null;
  key = null;
  value = null;

  constructor(host, key, defaultValue = null) {
    this.host = host;
    this.key = key;
    this.value = defaultValue;
    host.addController(this);
  }

  hostConnected() {
    chrome.storage.local.get([this.key], (data) => {
      const val = data[this.key];
      if (val === undefined) {
        return;
      }

      this.value = val;
      this.host.requestUpdate();
    });
    chrome.storage.onChanged.addListener(this.onChange);
  }

  hostDisconnected() {
    chrome.storage.onChanged.removeListener(this.onChange);
  }

  onChange = (changes, areaName) => {
    if (areaName != "local") {
      return;
    }
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key == this.key) {
        this.value = newValue;
        this.host.requestUpdate();
      }
    }
  };

  get() {
    return this.value;
  }

  async set(val) {
    this.value = val;
    await chrome.storage.local.set({ [this.key]: val });
  }
}

// This is like ChromeStorageController, but it proxies requests through postMessage to the
// chrome_storage_proxy.js content script so that it can be used in unprivileged JS context.
export class UnprivilegedChromeStorageController {
  host = null;
  key = null;
  value = null;
  replyFns = {};

  constructor(host, key, defaultValue = null) {
    this.host = host;
    this.key = key;
    this.value = defaultValue;
    host.addController(this);
  }

  hostConnected() {
    window.addEventListener("message", this.onPostMessage);
    this.postMessageWithReply(
      { type: "ef-util-chrome-storage-get", key: this.key },
      ({ value }) => {
        if (value === "___UNDEFINED_VALUE_SENTINEL___") {
          return;
        }

        this.value = value;
        this.host.requestUpdate();
      }
    );
  }

  hostDisconnected() {
    window.removeEventListener("message", this.onPostMessage);
    this.replyFns = {};
    this.host = null;
  }

  onChange(changes) {
    if (!this.host) {
      return;
    }

    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key == this.key) {
        this.value = newValue;
        this.host.requestUpdate();
      }
    }
  }

  onPostMessage = (event) => {
    if (!this.host) {
      return;
    }

    const msg = event.data;
    const { type } = msg;
    if (
      type === "ef-util-chrome-storage-get-reply" ||
      type === "ef-util-chrome-storage-set"
    ) {
      const { replyId } = msg;
      if (replyId in this.replyFns) {
        this.replyFns[replyId](msg);
        delete this.replyFns[replyId];
      }
    } else if (type === "ef-util-chrome-storage-changed") {
      this.onChange(msg.changes);
    }
  };

  postMessageWithReply(msg, callback) {
    const replyId = newRandomId();
    this.replyFns[replyId] = callback;
    window.postMessage({ ...msg, replyId }, "*");
  }

  get() {
    return this.value;
  }

  set(val) {
    return new Promise((resolve) => {
      this.value = val;
      this.postMessageWithReply(
        { type: "ef-util-chrome-storage-set", key: this.key, value: val },
        () => resolve()
      );
    });
  }
}
