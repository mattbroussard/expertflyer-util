window.addEventListener("message", async (evt) => {
  if (evt.origin !== window.location.origin) {
    return;
  }

  // TODO: probably need a more generalized approach for non-privileged code to access storage?
  if (evt.data.type == "ef-util-add-alerts-to-queue") {
    const key = "alerts-alertQueue";
    const { [key]: queue } = await chrome.storage.local.get([key]);
    await chrome.storage.local.set({
      [key]: [...(queue || []), ...evt.data.alerts],
    });
  }
});

injectScripts([
  "disable_lit_warning.js",
  "depaginate.js",
  "alerts_multiselect.mjs",
]);
