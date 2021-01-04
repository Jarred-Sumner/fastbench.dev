import { processMessage } from "./BenchmarkWorkerClient";

self.addEventListener("message", processMessage);