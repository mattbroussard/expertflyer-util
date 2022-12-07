function onChange(changes, areaName) {
  if (areaName !== "local") {
    return;
  }
  window.postMessage({ type: "ef-util-chrome-storage-changed", changes }, "*");
}
chrome.storage.onChanged.addListener(onChange);

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg.type === "ef-util-chrome-storage-get") {
    const { key, replyId } = msg;
    chrome.storage.local.get([key], (data) => {
      let value = data[key];
      if (value === undefined) {
        value = "___UNDEFINED_VALUE_SENTINEL___";
      }

      window.postMessage({
        type: "ef-util-chrome-storage-get-reply",
        replyId,
        value,
      });
    });
  } else if (msg.type === "ef-util-chrome-storage-set") {
    const { key, value, replyId } = msg;
    chrome.storage.local.set({ [key]: value }, () => {
      window.postMessage({
        type: "ef-util-chrome-storage-set-reply",
        replyId,
        value,
      });
    });
  }
});
