import { MessageType, StatusMessageType } from "src/WorkerMessage";
import { transformSync } from "esbuild";
import * as Benchmark from "benchmark";

function emitStatusMessage(status: StatusMessageType) {
  globalThis.postMessage({
    status,
    type: MessageType.statusUpdate,
    timestamp: performance.now(),
  });
}

function start(
  name: string,
  prepareCode: string,
  runCode: string,
  maxTime: number = 60_000
) {
  emitStatusMessage(StatusMessageType.aboutToStart);
  const suite = new Benchmark.Suite(name, {
    maxTime,
    name,
  })
    .add(name, runCode, {
      setup: prepareCode,
    })
    .run({
      onError: (error) => {
        postMessage({ type: MessageType.error, value: error, name });
      },
      onCycle: (cycle) => {
        postMessage({ type: MessageType.cycle, value: cycle, name });
      },
      onComplete: function (...complete) {
        postMessage({ type: MessageType.complete, value: complete, name });
      },
      onStart: (...complete) => {
        postMessage({ type: MessageType.start, value: complete, name });
      },
    });
}

function processMessage({
  data: { type, name, prepareCode, runCode, maxTime },
}) {
  switch (event.data.type) {
    case MessageType.start: {
      start(name, prepareCode, runCode, maxTime);
    }
  }
}

self.addEventListener("message", processMessage);
