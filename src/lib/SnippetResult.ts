import { getMultiplier, getScore, Result } from "src/components/ResultCard";
import { benchmarkResultsURL } from "src/lib/Benchmark";
import Schema, {
  SnippetResult as SchemaSnippetResult,
  Schema as SchemaType,
  BenchmarkResults as SchemaBenchmarkResults,
  SnippetResultList,
} from "src/lib/schema";
import { Snippet } from "src/lib/Snippet";

export class SnippetResult {
  ops: number;
  userAgent: string;

  static normalize(json: Partial<SchemaSnippetResult>) {
    let sample = json.stats.samples || json.stats.sample;
    if (sample) {
      json.statsSamples = Float64Array.from(sample);
      json.stats.sample = json.stats.samples = null;
    }

    return json;
  }
}

export class BenchmarkResult implements SchemaBenchmarkResults {
  benchmarkId: string;
  results: SnippetResultList[];

  toResults(snippets: Snippet[]): Result[] {
    const results = new Array<Result>(snippets.length);
    results.fill(null);
    let slowest: Result,
      minOps = Infinity;

    let resultI = 0;
    for (resultI = 0; resultI < results.length; resultI++) {
      const snippet = snippets[resultI];

      let snippetResult: SchemaSnippetResult;
      let snippetResultI = 0;
      for (; snippetResultI < this.results.length; snippetResultI++) {
        const result = this.results[snippetResultI];
        if (result.id === snippet.id) {
          snippetResult = result.results[result.results.length - 1];
          break;
        }
      }

      if (!snippetResult) {
        results[resultI] = {
          id: snippet.id,
          name: snippet.name,
          operationsPerSecond: 0,
          rank: 0,
          error: true,
        };
        continue;
      } else {
        results[resultI] = {
          id: snippet.id,
          name: snippet.name,
          operationsPerSecond: snippetResult.hz,
          rank: 0,
          error: false,
        };
      }

      if (results[resultI].operationsPerSecond < minOps) {
        minOps = results[resultI].operationsPerSecond;
        slowest = results[resultI];
      }
    }

    for (let i = 0; i < results.length; i++) {
      if (results[i].error) {
        results[i].multiplier = -Infinity;
        continue;
      }
    }
    results.sort((a, b) => a.operationsPerSecond - b.operationsPerSecond);

    for (let i = 0; i < results.length; i++) {
      results[i].multiplier = getMultiplier(results[i], slowest);
      results[i].rank = results.length - (i + 1) + 1;
    }

    return results;
  }

  static createFromJSON(
    benchmarkId: string,
    userAgent: string,
    results: Partial<SnippetResultList>[]
  ) {
    const benchmarkResult = new BenchmarkResult({
      benchmarkId,
      results: [],
    });

    for (let i = 0; i < results.length; i++) {
      benchmarkResult.appendResult(
        userAgent,
        results[i].id,
        SnippetResult.normalize(results[i].result)
      );
    }

    return benchmarkResult;
  }

  static async fetch(slug: string, version: string) {
    const resp = await fetch(benchmarkResultsURL(slug, version), {
      credentials: "omit",
    });

    if (resp.ok) {
      return BenchmarkResult.fromBlob(new Uint8Array(await resp.arrayBuffer()));
    } else {
      return Promise.reject(resp);
    }
  }

  constructor(benchmarkList: SchemaBenchmarkResults) {
    this.benchmarkId = benchmarkList.benchmarkId;
    this.results = benchmarkList.results || [];
  }

  appendResult(userAgent: string, id: string, result: SchemaSnippetResult) {
    let hasResult = false;

    if (this.results.length) {
      for (let resultList of this.results) {
        if (resultList.id === id) {
          resultList.userAgents.push(userAgent);
          resultList.results.push(result);
          hasResult = true;
        }
      }
    }

    if (!hasResult) {
      this.results.push({
        id,
        userAgents: [userAgent],
        results: [result],
      });
    }
  }

  static fromBlob(blob: Uint8Array) {
    const list = Schema.decodeBenchmarkResults(blob);

    return new BenchmarkResult(list);
  }

  toBlob() {
    return Schema.encodeBenchmarkResults(this);
  }
}
