const DAY = 24 * 60 * 60 * 1000;

async function loadExecDayOffset() {
  return new Promise((resolve) => {
    chrome.storage.local.get("calendarNav-execDayOffset", (data) => {
      const val = parseInt(data["calendarNav-execDayOffset"], 10);
      resolve(isNaN(val) ? null : val);
    });
  });
}

async function clearExecDayOffset() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ "calendarNav-execDayOffset": null }, () =>
      resolve()
    );
  });
}

function formatDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${String(
    date.getFullYear()
  ).substring(2)}`;
}

async function execDayOffsetIfNeeded() {
  const submitBtn = document.querySelector("input[name=btnSearch]");
  if (!submitBtn) {
    return;
  }
  if (window.location.href.indexOf("flagRefine=true") == -1) {
    return;
  }

  const offset = await loadExecDayOffset();
  if (!offset) {
    return;
  }
  await clearExecDayOffset();

  const fieldNames = ["departDate", "returnDate"];
  for (const fieldName of fieldNames) {
    const field = document.querySelector(`input[name=${fieldName}]`);
    if (!field || !field.value) {
      continue;
    }

    const oldDate = new Date(field.value);
    const newDate = new Date(oldDate.getTime() + offset * DAY);
    const newDateStr = formatDate(newDate);

    field.value = newDateStr;
  }

  submitBtn.click();
}

execDayOffsetIfNeeded();
