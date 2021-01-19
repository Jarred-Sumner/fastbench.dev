import type { Fetch } from "@vercel/fetch";
import { getMultiplier, Result } from "src/components/ResultCard";
import {
  Benchmark,
  joinBenchmarkURL,
  RESULTS_FILENAME,
} from "src/lib/Benchmark";
import { BenchmarkResult } from "src/lib/SnippetResult";

let fetch: Fetch = globalThis.fetch;

if (typeof window === "undefined") {
  fetch = require("@vercel/fetch")(require("node-fetch"));
}

function sortResult(a: Result, b: Result) {
  if (a && b && a.operationsPerSecond !== b.operationsPerSecond) {
    return a.operationsPerSecond > b.operationsPerSecond ? 1 : -1;
  } else if (a && b && a.operationsPerSecond === b.operationsPerSecond) {
    return 0;
  } else if (a) {
    return 1;
  } else if (b) {
    return -1;
  } else {
    return 0;
  }
}

export async function fetchBenchmark(version, id) {
  const [benchmarkResp, resultResp] = await Promise.all([
    fetch(joinBenchmarkURL(id, version, "package.json")),
    fetch(joinBenchmarkURL(id, version, RESULTS_FILENAME)),
  ]);

  const benchmark = Benchmark.fromJSON((await benchmarkResp.json()).fastbench);

  const benchmarkResults = BenchmarkResult.fromBlob(
    new Uint8Array(await resultResp.arrayBuffer())
  );

  let maxOps = Infinity;
  const results = benchmarkResults
    .toResults(benchmark.snippets)
    .sort((a, b) => {
      maxOps = Math.min(a.operationsPerSecond, b.operationsPerSecond, maxOps);

      if (a.operationsPerSecond < b.operationsPerSecond) {
        return 1;
      } else if (a.operationsPerSecond > b.operationsPerSecond) {
        return -1;
      } else {
        return 0;
      }
    });

  const maxResult = results.find((a) => a.operationsPerSecond === maxOps);

  for (let i = 0; i < results.length; i++) {
    if (results[i]) {
      results[i].rank = i + 1;
      results[i].multiplier = getMultiplier(results[i], maxResult);
    }
  }

  return { benchmark: benchmark, results, benchmarkResults };
}
