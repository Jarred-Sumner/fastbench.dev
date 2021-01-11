import { Benchmark, RESULTS_FILENAME } from "./Benchmark";
import { Octokit } from "@octokit/rest";
import createFetch from "@vercel/fetch";
import path from "path";

import nanoid from "nanoid";
import { BenchmarkResult } from "src/lib/SnippetResult";
import { SnippetResult } from "src/lib/schema";

const generateId = nanoid.customAlphabet(nanoid.urlAlphabet, 6);

const committer = {
  name: "Fastbench",
  email: "example@example.com",
};

// const fetch = createFetch(require("node-fetch"));

const fetch = require("node-fetch");

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
  userAgent: `Fastbench ${process.env.NODE_ENV}`,
  timeZone: "America/Los_Angeles",
  request: {
    fetch,
  },
});

export async function persistBenchmark(
  benchmark: Benchmark,
  results: SnippetResult[],
  userAgent: string
) {
  if (benchmark.id) {
    benchmark.version++;
  } else {
    benchmark.id = generateId();
    benchmark.version = 0;
  }

  const [files, packageJSON] = benchmark.toGithubDirectory();

  for (let file of files) {
    const result = {
      ...file,
      repo: process.env.GITHUB_REPO,
      owner: process.env.GITHUB_REPO_OWNER,
      committer: {
        ...file.committer,
        date: new Date().toISOString(),
      },
    };

    await octokit.repos.createOrUpdateFileContents(result);
  }

  const benchmarkResult = BenchmarkResult.createFromJSON(
    benchmark.id,
    userAgent,
    results
  ).toBlob();

  await persistBenchmarkResult(
    benchmark.parentDirectory,
    benchmark.version,
    benchmarkResult
  );

  return packageJSON;
}

export async function fetchBenchmarkResult(slug: string, version: string) {
  const content = await octokit.repos.getContent({
    repo: process.env.GITHUB_REPO,
    owner: process.env.GITHUB_REPO_OWNER,
    path: path.join(slug, String(version), RESULTS_FILENAME),
  });

  if (content.status === 200) {
    return {
      status: 200,
      sha: content.data.sha,
      result: BenchmarkResult.fromBlob(
        new Uint8Array(
          Buffer.from(content.data.content as String, "base64").buffer
        )
      ),
      success: true,
    };
  } else {
    content.success = false;
    return content as typeof content & { success: false };
  }
}

export async function persistBenchmarkResult(
  slug: string,
  version: string,
  blob: Uint8Array,
  sha?: string
) {
  return await octokit.repos.createOrUpdateFileContents({
    repo: process.env.GITHUB_REPO,
    owner: process.env.GITHUB_REPO_OWNER,
    path: path.join(slug, String(version), RESULTS_FILENAME),
    content: new Buffer(blob.buffer).toString("base64"),
    message: "New result",
    committer: {
      ...committer,
      date: new Date().toISOString(),
    },
    sha,
  });
}
