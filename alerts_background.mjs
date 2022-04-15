const formUrl = "https://www.expertflyer.com/flightAlert.do";

// state machine:
//  - idle
//  - waiting_for_form
//  - waiting_for_submit
//  - waiting_for_success
//  - error
let currentState = null;
let tabId = null;
let queue = null;

let inited = (async () => {
  const storageData = await chrome.storage.local.get([
    "alerts-currentState",
    "alerts-tabId",
    "alerts-alertQueue",
  ]);
  currentState = storageData["alerts-currentState"] || "idle";
  tabId = storageData["alerts-tabId"] || null;
  queue = storageData["alerts-alertQueue"] || [];
})();

async function setTabId(id) {
  console.log("setTabId", id, "old:", tabId);
  tabId = id;
  await chrome.storage.local.set({ "alerts-tabId": id });
}

async function setCurrentState(state) {
  console.log("setCurrentState", state, "old:", currentState);
  currentState = state;
  await chrome.storage.local.set({ "alerts-currentState": state });
}

async function onFormReady(tabId_) {
  await setTabId(tabId_);

  if (currentState != "waiting_for_form") {
    console.log("got form ready event in unexpected state", currentState);

    if (currentState == "error") {
      console.log("Resetting from error to idle");
      await setCurrentState("idle");
    }

    return;
  }

  await dispatchFormFill();
}

async function popNextFormData() {
  await inited;
  if (queue.length == 0) {
    return 0;
  }

  const entry = queue.shift();
  await chrome.storage.local.set({ "alerts-alertQueue": queue });

  return entry;
}

async function hasNextFormData() {
  await inited;
  return queue.length > 0;
}

async function dispatchFormFill() {
  if (!tabId || currentState != "waiting_for_form") {
    console.warn("dispatchFormFill called in bad state", currentState, tabId);
    return;
  }

  const data = await popNextFormData();
  if (!data) {
    console.warn("dispatchFormFill found no data to fill, aborting");
    await setCurrentState("idle");
    return;
  }

  await setCurrentState("waiting_for_submit");
  await chrome.tabs.sendMessage(
    tabId,
    { type: "ef-alert-fill-and-submit", data },
    { frameId: 0 /* root frame only */ }
  );
}

async function onSubmitted() {
  if (currentState != "waiting_for_submit") {
    console.warn("onSubmitted in unexpected state", currentState);
    return;
  }
  await setCurrentState("waiting_for_success");
}

async function onAlertSuccess(tabId_, alertName) {
  if (tabId_ != tabId || currentState != "waiting_for_success") {
    console.warn(
      "onAlertSuccess in unexpected state, aborting",
      tabId_,
      tabId,
      currentState,
      alertName
    );
    await setCurrentState("idle");
    return;
  }

  console.log("successfully scheduled alert", alertName);

  const hasNext = await hasNextFormData();
  if (!hasNext) {
    console.log("No more, stopping on success page.");
    await setCurrentState("idle");
    return;
  }

  await setCurrentState("waiting_for_form");

  // Rate limit
  await rateLimit();

  // Navigate back to the form page
  await chrome.tabs.update(tabId, { url: formUrl });
}

async function rateLimit() {
  // Random wait between 2-4 seconds
  const timeout = Math.round(Math.random() * 2000) + 2000;
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

async function onMessage(message, sender) {
  if (!sender.tab) {
    return;
  }
  await inited;

  const type = message.type;

  if (type == "ef-alert-form-ready") {
    await onFormReady(sender.tab.id);
  } else if (type == "ef-alert-form-not-ready") {
    console.warn("got form not ready error, aborting");
    await setCurrentState("error");
  } else if (type == "ef-alert-submitted") {
    await onSubmitted();
  } else if (type == "ef-alert-success") {
    await onAlertSuccess(sender.tab.id, message.alertName);
  } else if (type == "ef-alert-fail") {
    console.warn("got alert scheduling error, aborting");
    await setCurrentState("error");
  } else if (type == "ef-alert-start-queue") {
    console.log("Received call to start queue");
    await setCurrentState("waiting_for_form");
    if (tabId && tabId == sender.tab.id) {
      await onFormReady(tabId);
    }
  } else if (type == "ef-alert-stop-queue") {
    console.log("Received call to stop queue");
    await setCurrentState("idle");
  }
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  onMessage(message, sender);

  // We don't use the reply, but seem to get a console error if there is never any reply
  reply({});
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName != "local") {
    return;
  }
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key == "alerts-alertQueue") {
      queue = newValue;
    }
  }
});

// window.debugGlobals = this;
