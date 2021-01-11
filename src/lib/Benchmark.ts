import { Snippet } from "./Snippet";
import slugify from "slugify";
import path from "path";
import fetch from "node-fetch";
import { WorkerType } from "src/lib/BenchmarkRunnerWorker";

const committer = {
  name: "Fastbench",
  email: "example@example.com",
};

export const atob = (a) =>
  globalThis.atob || Buffer.from(a, "base64").toString("binary");
export const btoa = (b) => globalThis.btoa || Buffer.from(b).toString("base64");

export const RESULTS_FILENAME = "results.kiwib";

export function benchmarkResultsURL(slug: string, version: string) {
  return `https://cdn.jsdelivr.net/gh/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO}@master/${slug}/${version}/${RESULTS_FILENAME}`;
}

export function joinBenchmarkURL(slug: string, version: string, ...parts) {
  return `https://cdn.jsdelivr.net/gh/${process.env.GITHUB_REPO_OWNER}/${
    process.env.GITHUB_REPO
  }@master/${slug}/${version}/${path.join(...parts)}`;
}

export function benchmarkGithubPackagePath(slug: string, version: string) {
  return path.join(slug, String(version), "package.json");
}

export class Benchmark {
  snippets: Snippet[];
  shared: Snippet;
  name: string;
  id?: string;
  version: number;
  workerType: WorkerType;
  constructor(
    snippets: Snippet[],
    shared: Snippet,
    name: string,
    id?: string,
    version: number = 0,
    workerType: WorkerType = WorkerType.inline
  ) {
    this.snippets = snippets;
    this.shared = shared;
    this.name = name;
    this.id = id;
    this.version = parseInt(version, 10) || 0;
    this.workerType = workerType;
  }

  get parentDirectory() {
    return slugify(`${this.name}-${this.id}`.replace(/\./gm, ""));
  }

  get basepath() {
    return path.join(this.parentDirectory, this.version.toString(10));
  }

  get url() {
    return `https://fastbench.dev/${this.basepath}`;
  }

  get githubURL() {
    return `https://github.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO}/${this.basepath}`;
  }

  get githubResultsURL() {
    return benchmarkResultsURL(this.parentDirectory, String(this.version));
  }

  get resultsPath() {
    return path.join(this.basepath, "results.kiwib");
  }

  isEmpty() {
    return this.snippets.filter(Snippet.hasCode).length === 0;
  }

  toDirectoryMap() {
    const fileNames = new Array(this.snippets.length);
    const codeMap = {};
    for (let i = 0; i < this.snippets.length; i++) {
      if (this.snippets[i].isEmpty) {
        continue;
      }

      fileNames[i] = this.snippets[i].filename;
      codeMap[this.snippets[i].filename] = this.snippets[i].code;
    }

    if (!this.shared?.isEmpty) {
      codeMap["shared.js"] = this.shared.code;
    }

    const packageFile = {
      name: `@fastbench/${this.parentDirectory}`,
      version: `0.0.0`,
      url: this.url,
      fastbench: this.toJSON(),
      files: fileNames,
    };

    return [
      {
        ...codeMap,
        "package.json": JSON.stringify(packageFile, null, 2),
      },
      packageFile,
    ];
  }

  toGithubDirectory() {
    const [files, packageJSON] = this.toDirectoryMap();
    const entries = Object.entries(files);
    const githubDirectories = new Array(entries.length);

    for (let i = 0; i < entries.length; i++) {
      const [fileName, value] = entries[i];
      githubDirectories[i] = {
        path: path.join(this.basepath, fileName),
        content: btoa(value),
        message: "New benchmark",
        committer,
      };
    }

    return [githubDirectories, packageJSON];
  }

  toJSON(): Benchmark {
    return {
      snippets: this.snippets.filter(Snippet.hasCode).map(Snippet.toJSON),
      shared: this.shared.hasCode() ? this.shared.toJSON() : null,
      name: this.name,
      id: this.id,
      version: this.version,
      workerType: this.workerType,
    };
  }

  static fromJSON({ snippets, shared, name, id, version, workerType }) {
    return new Benchmark(
      snippets.map(Snippet.fromJSON),
      Snippet.fromJSON(shared),
      name,
      id,
      version,
      workerType
    );
  }
}
