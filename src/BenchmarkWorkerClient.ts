import { MessageType, StatusMessageType } from "src/WorkerMessage";
import { transformSync } from "esbuild";
import { Benchmark } from "./lib/Benchmark";
import type { default as BenchmarkType } from "benchmark";
import { DH_NOT_SUITABLE_GENERATOR } from "constants";

let Suite;

let suite: BenchmarkType.Suite;
let postMessage;

export function setPostMessageHandler(
  _postMesasge,
  _Suite: BenchmarkType.Suite
) {
  postMessage = _postMesasge;
  Suite = _Suite;
}

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
  updateObject.value[1] = updateObject.value[0];
  updateObject.value[0] = 1 / (stats.mean + stats.moe);
  updateObject.value[2] = suite[0].hz;
  updateObject.value[3] += now - updateObject.value[4];
  updateObject.value[4] = now;
  postMessage(updateObject);
}

function stopProgressUpdates() {
  if (typeof progressInterval === "number") {
    globalThis.clearInterval(progressInterval);
  }
  progressInterval = null;
}
let statusMessage = {
  status: 0,
  type: MessageType.statusUpdate,
  timestamp: 0,
};

function emitStatusMessage(status: StatusMessageType) {
  statusMessage.status = status;
  statusMessage.timestamp = performance.now();
  postMessage(statusMessage);
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
  let _suite: BenchmarkType.Suite = new Suite(snippet.name, {
    maxTime: 30,
    name: benchmark.name,
  });

  function errorHandler(error) {
    postMessage({ type: MessageType.error, value: error, id });
    stopProgressUpdates();
  }

  _suite.add(snippet.name, snippet.code, {
    setup: benchmark?.shared?.code ?? null,
    onError: errorHandler,
    onCycle: ({ target: { stats, times, hz, cycles, error } }) => {
      if (error) {
        errorHandler(error);
      } else {
        postMessage({
          type: MessageType.cycle,
          value: { stats, times, hz, cycles, error: false },
          id,
        });
      }
    },
    onComplete: function (complete) {
      if (suite === _suite) {
        suite = null;
      }
      _suite = null;
      stopProgressUpdates();
      postMessage({
        type: MessageType.complete,
        // value: complete,
        id,
      });
    },
    onStart: (...complete) => {
      postMessage({ type: MessageType.start, id });
      startSendingProgressUpdates(id);
    },
  });

  suite = _suite;
  try {
    _suite.run({ async: true, defer: false });
  } catch (exception) {
    errorHandler(exception);
    return;
  }
}

export function processMessage(event: MessageEvent) {
  const { type } = event.data;
  switch (type) {
    case MessageType.start: {
      const {
        id,
        value: { benchmark, snippetIndex },
      } = event.data;
      start(Benchmark.fromJSON(benchmark), snippetIndex, id);
      break;
    }
    case MessageType.cancel: {
      if (suite) {
        suite.abort();
        suite = null;
      }
      stopProgressUpdates();
      break;
    }
  }
}
