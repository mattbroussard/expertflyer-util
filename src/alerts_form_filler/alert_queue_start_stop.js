window.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg.type === "ef-util-alert-start-queue") {
    chrome.runtime.sendMessage({ type: "ef-alert-start-queue" });
  } else if (msg.type === "ef-util-alert-stop-queue") {
    chrome.runtime.sendMessage({ type: "ef-alert-stop-queue" });
  }
});
