const { parentPort, workerData } = require("worker_threads");

// workerData: { vehicleId, orderIds, delayMs }
const { vehicleId, orderIds, delayMs } = workerData;

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

(async function main() {
  try {
    console.log(`Worker for vehicle ${vehicleId} sleeping ${delayMs}ms`);
    await wait(delayMs);
    console.log(`Worker for vehicle ${vehicleId} waking up`);
    // Notify parent to perform completion
    parentPort &&
      parentPort.postMessage({ vehicleId, orderIds, status: "ready" });
  } catch (e) {
    console.error("Worker error", e);
    parentPort && parentPort.postMessage({ vehicleId, error: String(e) });
  }
})();
