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
  if (a && b) {
    return a.operationsPerSecond - b.operationsPerSecond;
  } else if (a) {
    return 1;
  } else if (b) {
    return -1;
  } else {
    return -1;
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

  const results = benchmarkResults
    .toResults(benchmark.snippets)
    .filter(Boolean)
    .sort(sortResult);

  for (let i = 0; i < results.length; i++) {
    if (results[i]) {
      results[i].rank = i + 1;
      results[i].multiplier = getMultiplier(
        results[i],
        results[results.length - 1]
      );
    }
  }
  return { benchmark: benchmark, results, benchmarkResults };
}
