// TODO: remove when iframe is gone
function insertIframe() {
  const container = document.querySelector("div#centerwell");
  if (!container) {
    console.warn("could not inject ef-utils iframe");
    return;
  }

  const url =
    chrome.runtime.getURL("src/alerts_queue_ui/index.html") +
    `?parent=${encodeURIComponent(window.location.pathname)}`;
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.className = "ef-util-alert-iframe";
  iframe.allow = "clipboard-read; clipboard-write";
  container.appendChild(iframe);

  iFrameResize(
    {
      autoResize: true,
      minHeight: 500,
      resizeFrom: "child",
      checkOrigin: false,
      scrolling: "omit",
    },
    iframe
  );
}

// insertIframe();
injectScripts([
  "src/util/disable_lit_warning.js",
  "src/alerts_queue_ui/alerts_queue_ui.mjs",
]);
