import { Benchmark } from "./Benchmark";
import { Octokit } from "@octokit/rest";
import createFetch from "@vercel/fetch";

import nanoid from "nanoid";

const generateId = nanoid.customAlphabet(nanoid.urlAlphabet, 6);

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

export async function persistBenchmark(benchmark: Benchmark) {
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
    console.log(result);
    await octokit.repos.createOrUpdateFileContents(result);
  }

  return packageJSON;
}