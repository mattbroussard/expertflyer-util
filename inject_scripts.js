function injectScripts(scripts) {
  for (const fname of scripts) {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(fname);
    script.async = false;
    if (fname.endsWith(".mjs")) {
      script.type = "module";
    } else {
      script.type = "text/javascript";
    }
    document.body.appendChild(script);
  }
}
