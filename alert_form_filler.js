const expectedUrl = "https://www.expertflyer.com/flightAlert.do";

function isReady() {
  const form = document.querySelector("form#flightAlertForm");
  return (
    window.location.href == expectedUrl &&
    Boolean(form) &&
    !form.classList.contains("processing") &&
    // Error banner
    !document.querySelector("table.efc") &&
    !document.querySelector("img.errInput")
  );
}

function fillFields(data) {
  const form = document.querySelector("form#flightAlertForm");
  const mapping = {
    alertName: "name",
    departingAirport: "departingAirport",
    arrivingAirport: "arrivingAirport",
    date: "departureDate",
    airline: "airline",
    flightNumber: "flightNumber",
    classCode: "classCode",
  };

  for (const [dataKey, formKey] of Object.entries(mapping)) {
    const field = form.querySelector(`input[name="${formKey}"]`);
    const value = data[dataKey];
    if (field && value) {
      field.value = value;
    } else {
      throw new Error(`error involving field ${dataKey}`);
    }
  }

  const qtyField = form.querySelector('select[name="quantity"]');
  const quantity = data.quantity || 1;
  qtyField.value = quantity;

  // Other fields: lt/gt mode, test email, point of sale
}

function submitForm() {
  const btn = document.querySelector(
    'form#flightAlertForm input[name="btnSave"]'
  );
  btn.click();
}

async function fillAndSubmit(data) {
  fillFields(data);
  await wait(1000);
  submitForm();
}

function onLoad() {
  if (isReady()) {
    chrome.runtime.onMessage.addListener((message, sender, reply) => {
      if (sender.tab) {
        return;
      }
      if (message.type == "ef-alert-fill-and-submit") {
        fillAndSubmit(message.data).then(() =>
          reply({ type: "ef-alert-submitted" })
        );

        // return true signals that we will reply async
        return true;
      }
    });

    chrome.runtime.sendMessage({ type: "ef-alert-form-ready" });
  } else {
    chrome.runtime.sendMessage({
      type: "ef-alert-form-not-ready",
      // TODO: could log more about why
      reason: "unknown",
    });
  }
}

onLoad();
