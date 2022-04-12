async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCondition(predicate, timeout = 30000) {
  const start = Date.now();
  while (true) {
    const now = Date.now();

    const result = predicate();
    if (result) {
      return result;
    }

    if (now - start > timeout) {
      throw new Error("waitUntil timed out");
    }

    await wait(100);
  }
}
