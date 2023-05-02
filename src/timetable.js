// unprivileged scripts cannot call this API so we have to do it here and store the result in the DOM
const gcmapIcon = chrome.runtime.getURL("images/gcmap.ico");
injectDataScriptTag("ef-util-gcmap-icon-url", { gcmapIcon });

injectScripts([
  "src/util/disable_lit_warning.js",
  "src/gcmap_buttons/gcmap_buttons.mjs",
  "src/extra_filters/extra_timetable_filters.mjs",
  "src/saved_filters/saved_filters.mjs",
]);
