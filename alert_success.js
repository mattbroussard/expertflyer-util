const expectedUrl =
  "https://www.expertflyer.com/flightAlertSaveVerification.do";

function checkSuccess() {
  const element = document.querySelector(
    'form[name="flightAlertSaveVerificationForm"] input[name="name"]'
  );
  if (!element) {
    return null;
  }

  return element.value;
}

function onLoad() {
  const alertName = checkSuccess();
  if (alertName) {
    chrome.runtime.sendMessage({ type: "ef-alert-success", alertName });
  } else {
    chrome.runtime.sendMessage({ type: "ef-alert-fail", reason: "unknown" });
  }
}

onLoad();
