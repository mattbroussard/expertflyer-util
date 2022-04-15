const formUrl = "https://www.expertflyer.com/flightAlert.do";

const testData = {
  alertName: "test alert",
  departingAirport: "SFO",
  arrivingAirport: "NRT",
  date: "5/1/22",
  airline: "UA",
  flightNumber: 837,
  quantity: 1,
  classCode: "I",
};

// state machine:
//  - idle
//  - waiting_for_form
//  - waiting_for_submit
//  - waiting_for_success
let currentState = null;
let tabId = null;

let inited = (async () => {
  const storageData = await chrome.storage.local.get([
    "alerts-currentState",
    "alerts-tabId",
  ]);
  currentState = storageData["alerts-currentState"] || "idle";
  tabId = storageData["alerts-tabId"] || null;
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
    return;
  }

  await dispatchFormFill();
}

let popCounter = 0;
async function popNextFormData() {
  popCounter++;
  if (popCounter > 3) {
    return null;
  }

  return { ...testData, alertName: `${testData.alertName} ${popCounter}` };
}

async function hasNextFormData() {
  return popCounter < 3;
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
  const timeout = 5000;
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

chrome.runtime.onMessage.addListener(async (message, sender, reply) => {
  if (!sender.tab) {
    return;
  }
  await inited;

  const type = message.type;

  if (type == "ef-alert-form-ready") {
    await onFormReady(sender.tab.id);
  } else if (type == "ef-alert-form-not-ready") {
    console.warn("got form not ready error, aborting");
    await setCurrentState("idle");
  } else if (type == "ef-alert-success") {
    await onAlertSuccess(sender.tab.id, message.alertName);
  } else if (type == "ef-alert-fail") {
    console.warn("got alert scheduling error, aborting");
    await setCurrentState("idle");
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
});

// window.debugGlobals = this;
