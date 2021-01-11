import { processMessage, setPostMessageHandler } from "./BenchmarkWorkerClient";

setPostMessageHandler(globalThis.postMessage);
self.addEventListener("message", processMessage);
