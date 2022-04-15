// Lit reactive controller that syncs data from Chrome extension storage API
// and updates the host element when data changes
export class ChromeStorageController {
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
