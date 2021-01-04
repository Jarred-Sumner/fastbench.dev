import { MessageType, StatusMessageType } from "src/WorkerMessage";
import { transformSync } from "esbuild";
import { Suite } from "benchmark";
import { Benchmark } from "./lib/Benchmark";

let suite: Suite;

let updateLength = Float64Array.BYTES_PER_ELEMENT * 5;
const updateObject = {
  id: 0,
  type: MessageType.progressUpdate,
  value: new Float64Array(
    typeof SharedArrayBuffer !== "undefined"
      ? new SharedArrayBuffer(updateLength)
      : new ArrayBuffer(updateLength)
  ),
};
let progressInterval: number = null;

function startSendingProgressUpdates(id) {
  if (typeof progressInterval === "number") {
    globalThis.clearInterval(progressInterval);
  }

  updateObject.id = id;
  updateObject.value.fill(0);
  updateObject.value[4] = performance.now();
  progressInterval = globalThis.setInterval(sendProgressUpdate, 100);
}

function sendProgressUpdate() {
  const now = performance.now();
  const stats = suite[0].stats;
  const elapsed = suite[0].times.elapsed;
  updateObject.value[1] = updateObject.value[0];
  updateObject.value[0] = 1 / (stats.mean + stats.moe);
  updateObject.value[2] = suite[0].hz;
  updateObject.value[3] += now - updateObject.value[4];
  updateObject.value[4] = now;
  globalThis.postMessage(updateObject);
}

function stopProgressUpdates() {
  if (typeof progressInterval === "number") {
    globalThis.clearInterval(progressInterval);
  }
  progressInterval = null;
}

function emitStatusMessage(status: StatusMessageType) {
  globalThis.postMessage({
    status,
    type: MessageType.statusUpdate,
    timestamp: performance.now(),
  });
}

function start(
  benchmark: Benchmark,
  snippetIndex: number,
  id: string | number
) {
  const snippet = benchmark.snippets[snippetIndex];

  if (suite) {
    suite.abort();
  }

  emitStatusMessage(StatusMessageType.aboutToStart);
  let _suite: Suite = new Suite(snippet.name, {
    maxTime: 30,
    name: benchmark.name,

    onError: (error) => {
      globalThis.postMessage({ type: MessageType.error, value: error, id });
      stopProgressUpdates();
    },
    onCycle: ({ target: { stats, times, hz, cycles, error } }) => {
      globalThis.postMessage({
        type: MessageType.cycle,
        value: { stats, times, hz, cycles, error: !!error },
        id,
      });
    },
    onComplete: function (complete) {
      if (suite === _suite) {
        suite = null;
      }
      _suite = null;
      stopProgressUpdates();
      globalThis.postMessage({
        type: MessageType.complete,
        // value: complete,
        id,
      });
    },
    onStart: (...complete) => {
      globalThis.postMessage({ type: MessageType.start, id });
      startSendingProgressUpdates(id);
    },
  }).add(snippet.name, snippet.code, {
    setup: benchmark?.shared?.code ?? null,
  });

  suite = _suite;
  _suite.run({ async: true, defer: false });
}

export function processMessage({
  data: {
    type,
    id,
    value: { benchmark, snippetIndex },
  },
}) {
  switch (type) {
    case MessageType.start: {
      start(Benchmark.fromJSON(benchmark), snippetIndex, id);
    }
  }
}