window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  const msg = event.data;
  if (msg.type === "ef-util-alert-start-queue") {
    chrome.runtime.sendMessage({ type: "ef-alert-start-queue" });
  } else if (msg.type === "ef-util-alert-stop-queue") {
    chrome.runtime.sendMessage({ type: "ef-alert-stop-queue" });
  }
});
