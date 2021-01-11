import { processMessage, setPostMessageHandler } from "./BenchmarkWorkerClient";

globalThis.BenchmarkPort.addEventListener(
  "message",
  ({ data: { port } }) => {
    setPostMessageHandler(
      (data) => port.postMessage(data),
      globalThis.Benchmark.Suite
    );
    port.addEventListener("message", processMessage);
    port.start();
  },
  { once: true }
);
