function insertIframe() {
  const container = document.querySelector("div#centerwell");
  if (!container) {
    console.warn("could not inject ef-utils iframe");
    return;
  }

  const url = chrome.runtime.getURL("index.html");
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.className = "ef-util-alert-iframe";
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

insertIframe();
