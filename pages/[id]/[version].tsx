import type { Fetch } from "@vercel/fetch";
import * as React from "react";
import { GetStaticPropsContext } from "next";
import {
  Benchmark,
  benchmarkGithubPackagePath,
  BenchmarkUpdateType,
  joinBenchmarkURL,
  RESULTS_FILENAME,
  TransformType,
} from "src/lib/Benchmark";
import { BenchmarkResult } from "src/lib/SnippetResult";
import { getMultiplier, Result } from "src/components/ResultCard";
import { SnippetRunState } from "src/components/SnippetContainer";
import { PageHeader } from "src/components/PageHeader";
import { SnippetList } from "src/components/SnippetList";
import { BenchmarkRunner } from "src/lib/BenchmarkRunner";
import { FakeLinkButton } from "src/components/LinkButton";
import { TitleInput } from "src/components/TitleInput";
import { useRouter } from "next/router";
import { ResultList } from "src/components/ResultsList";
import { fetchBenchmark } from "src/lib/fetchBenchmark";
import DefaultErrorPage from "next/error";
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "src/components/ShareCardDimensions";
import { ImageSEOTag, TitleSEOTag, URLSEOTag } from "src/components/SEOTags";
import Head from "next/head";
import copy from "copy-to-clipboard";
import dynamic from "next/dynamic";

import { getShareURL, ShareSheet } from "src/components/ShareSheet";
import NewBenchmarkPage from "src/components/NewBenchmarkPage";
import { Snippet } from "src/lib/Snippet";
import {
  loadWorkers,
  unloadWorkers,
  WorkerType,
} from "src/lib/BenchmarkRunnerWorker";
import smoothscroll from "smoothscroll-polyfill";

if (typeof window !== "undefined") {
  smoothscroll.polyfill();
}

let SAMPLE_DATA;

if (process.env.NODE_ENV === "production") {
  SAMPLE_DATA = [[], [], []];
} else {
  SAMPLE_DATA = [
    [
      `import _ from "https://cdn.skypack.dev/lodash";\nimport {fill, sample} from "https://cdn.skypack.dev/lodash";\nimport * as lodash from "https://cdn.skypack.dev/lodash";var a = new Array(100)\nvar b = new Array();`,
    ],
    ["a.fill(100);", "[].fill"],
    [`_.fill(a, 100);`, "_.fill"],
    [`for (let i = 0; i  < 100; i++) { b.push(100); }`, "[].push"],
  ];
}

async function uploadBenchmark(
  benchmark: Benchmark,
  results,
  updateType: BenchmarkUpdateType
) {
  for (let result of results) {
    if (result.result?.statsSamples?.buffer) {
      result.result.statsSamples = Array.from(result.result.statsSamples);
    }

    if (result.result?.stats?.samples?.buffer) {
      result.result.stats.samples = Array.from(result.result.stats.samples);
    }
  }
  return globalThis
    .fetch(`/api/snippets`, {
      method: "POST",
      body: JSON.stringify({
        benchmark: benchmark.toJSON(),
        results,
        updateType,
        slug: benchmark.parentDirectory,
        version: benchmark.version,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((resp) => resp.json());
}

async function uploadResults(benchmark: Benchmark, results) {
  for (let result of results) {
    if (result.result?.statsSamples?.buffer) {
      result.result.statsSamples = Array.from(result.result.statsSamples);
    }

    if (result.result?.stats?.samples?.buffer) {
      result.result.stats.samples = Array.from(result.result.stats.samples);
    }
  }

  return globalThis
    .fetch(`/api/results`, {
      method: "POST",
      body: JSON.stringify({
        benchmark: benchmark.toJSON(),
        id: benchmark.id,
        slug: benchmark.parentDirectory,
        version: benchmark.version,
        results,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((resp) => resp.json());
}

const ViewBenchmarkSEOTags = ({ id, version, title }) => {
  const tags = [
    ...ImageSEOTag({
      url: getShareURL({ id, version }) + ".png",
      width: SHARE_CARD_WIDTH * 2,
      height: SHARE_CARD_HEIGHT * 2,
    }),
    ...TitleSEOTag({ title }),
    ...URLSEOTag({ url: getShareURL({ id, version }) }),
  ].flat(2);

  return <Head>{tags}</Head>;
};

const NewBenchmarkSEOTags = ({ id, version, title: _title, isDirty }) => {
  let title = _title || `New benchmark`;
  if (isDirty) {
    title = `* ${title}`;
  }

  const tags = [
    ...TitleSEOTag({ title }),
    ...URLSEOTag({
      url:
        id && version
          ? getShareURL({ id, version })
          : getShareURL({ id: "benches", version: "new" }),
    }),
  ].flat(2);

  return <Head>{tags}</Head>;
};

export type IndexFileType = {
  timestamp: string;
  benchmarks: {
    [key: string]: string[];
  };
};
async function fetchIndexFile(): Promise<IndexFileType> {
  const resp = await fetch(
    `https://cdn.jsdelivr.net/gh/Jarred-Sumner/fastbench@master/index.json?t=${Math.floor(
      Date.now() / 5
    )}`
  );

  return resp.json();
}

export async function getStaticPaths() {
  // Call an external API endpoint to get posts
  const indexFile = await fetchIndexFile();
  if (!indexFile?.benchmarks) {
    return { paths: [], fallback: "blocking" };
  }

  // Get the paths we want to pre-render based on posts
  const paths = Object.keys(indexFile.benchmarks)
    .map((id) => indexFile.benchmarks[id].map((version) => `/${id}/${version}`))
    .flat(1);

  paths.push("/benches/new");
  // We'll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return { paths, fallback: "blocking" };
}
let fetch: Fetch = globalThis.fetch;

if (typeof window === "undefined") {
  fetch = require("@vercel/fetch")(require("node-fetch"));
}

enum PageType {
  results,
  new,
  notFound,
}

export async function getStaticProps(context: GetStaticPropsContext) {
  if (context.params.id === "benches" && context.params.version === "new") {
    return {
      revalidate: Number.MAX_SAFE_INTEGER,
      props: {
        benchmark: null,
        runState: SnippetRunState.pending,
        results: [],
        type: PageType.new,
        benchmarkResults: [],
      }, // will be passed to the page component as props
    };
  } else {
    try {
      const { benchmark, results, benchmarkResults } = await fetchBenchmark(
        context.params.version,
        context.params.id
      );

      return {
        revalidate: 5,
        props: {
          benchmark: benchmark.toJSON(),
          runState: SnippetRunState.ran,
          results,
          type: PageType.results,
          benchmarkResults: JSON.parse(
            JSON.stringify(benchmarkResults, null, 2)
          ),
        }, // will be passed to the page component as props
      };
    } catch (exception) {
      console.error(exception);
      return {
        revalidate: false,
        props: {
          benchmark: null,
          runState: SnippetRunState.pending,
          results: [],
          type: PageType.notFound,
          benchmarkResults: [],
        }, // will be passed to the page component as props
      };
    }
  }
}

const RunBenchmarkButton = ({ runState, onRunTest, onCancel }) => {
  switch (runState) {
    case SnippetRunState.pending: {
      return <FakeLinkButton onClick={onRunTest}>Run benchmark</FakeLinkButton>;
    }

    case SnippetRunState.ran: {
      return (
        <FakeLinkButton onClick={onRunTest}>Re-run benchmark</FakeLinkButton>
      );
    }

    case SnippetRunState.running: {
      return (
        <FakeLinkButton gray onClick={onCancel}>
          Cancel benchmark
        </FakeLinkButton>
      );
    }
    default:
      throw "Invalid runState";
  }
};

export const ShowBenchmarkPage = ({
  results,
  benchmarkResult,
  benchmark,
  runner,
  onRunTest,
  runState,
  setRunState,
  errors,
  setErrors,
  snippets,
  setTransform,
  sharedSnippet,
  setSnippets,
  sharedSnippetError,
  setSharedSnippetError,
  onCancelTest,
  setTitle,
  isDirty,
  setDirty: _setDirty,
}: {
  results: Result[];
  benchmark: Benchmark;
}) => {
  const router = useRouter();

  const [focusedId, setFocusedID] = React.useState();

  const setDirty = React.useCallback(() => {
    _setDirty(true);
  }, [_setDirty]);

  const handleTitleChangeEvent = React.useCallback(
    (event: React.SyntheticEvent<InputEvent, HTMLInputElement>) => {
      setTitle(event.target.value);
      _setDirty(true);
    },
    [setTitle, _setDirty]
  );

  React.useEffect(() => {
    _setDirty(false);
  }, [runState, _setDirty]);

  React.useEffect(() => {
    setErrors(() => {
      const errors = new Array(snippets.length);
      errors.fill(null);
      setSharedSnippetError(null);
    });
  }, [setErrors, snippets, snippets.length, setSharedSnippetError]);

  const prevResults = React.useRef<Result[]>();
  React.useEffect(() => {
    prevResults.current = results.slice();
  }, [results, results.length, prevResults]);

  const showPreviousResults = !benchmarkResult?.results?.length;

  const canShowResultList = !!(
    runState === SnippetRunState.ran || prevResults?.current?.length
  );

  return (
    <div className={"Page NewBenchmarkPage"}>
      <PageHeader>
        <div className={"BenchmarkHeader BenchmarkHeader--desktop"}>
          <TitleInput
            href={router.asPath}
            defaultValue={benchmark.name}
            placeholder="Untitled benchmark"
            onInput={handleTitleChangeEvent}
          />

          <div className={"RunTestButtonContainer"}>
            <RunBenchmarkButton
              onCancel={onCancelTest}
              onRunTest={onRunTest}
              runState={runState}
            />
          </div>
        </div>
      </PageHeader>

      <div className={"BenchmarkHeader BenchmarkHeader--mobile"}>
        <TitleInput
          href={router.asPath}
          defaultValue={benchmark.name}
          placeholder="Untitled benchmark"
          onInput={handleTitleChangeEvent}
        />

        <div className={"RunTestButtonContainer"}>
          <RunBenchmarkButton
            onCancel={onCancelTest}
            onRunTest={onRunTest}
            runState={runState}
          />
        </div>
      </div>

      {runState === SnippetRunState.ran ? (
        <ViewBenchmarkSEOTags
          id={router.query.id}
          version={router.query.version}
          title={benchmark.name}
        />
      ) : (
        <NewBenchmarkSEOTags
          id={router.query.id}
          version={router.query.version}
          title={benchmark.name}
          isDirty={isDirty}
        />
      )}

      <div className={"NewBenchmarkPageContent"}>
        {canShowResultList && (
          <ResultList
            disabled={showPreviousResults || runState !== SnippetRunState.ran}
            snippets={benchmark.snippets}
            result={benchmarkResult}
            githubURL={benchmark.githubURL}
            results={showPreviousResults ? prevResults.current : results}
            resultIndex={0}
          />
        )}

        {runState === SnippetRunState.ran ? (
          <ShareSheet key={benchmark.githubURL} benchmark={benchmark} />
        ) : undefined}

        <SnippetList
          runState={runState}
          setRunState={setRunState}
          sharedSnippet={benchmark.shared}
          snippets={benchmark.snippets}
          results={results}
          setDirty={setDirty}
          setSnippets={setSnippets}
          sharedSnippetError={sharedSnippetError}
          errors={errors}
          runner={runner}
          focusedId={focusedId}
          setFocusedID={setFocusedID}
          transform={benchmark.transform}
          setTransform={setTransform}
        />
      </div>
    </div>
  );
};

const BenchmarkPage = ({
  benchmark: _defaultBenchmark,
  results: defaultResults,
  benchmarkResults: defaultBenchmarkResults,
  runState: defaultRunState,
}) => {
  const [isDirty, setDirty] = React.useState(false);
  const router = useRouter();
  const [runState, setRunState] = React.useState<SnippetRunState>(
    defaultRunState
  );
  const [runner, setRunner] = React.useState<BenchmarkRunner>(
    () => new BenchmarkRunner()
  );

  const [results, setResults] = React.useState(defaultResults);

  const [benchmarkResult, setBenchmarkResult] = React.useState<BenchmarkResult>(
    defaultBenchmarkResults
      ? () => new BenchmarkResult(defaultBenchmarkResults)
      : null
  );

  const workers = React.useRef<Worker[]>();

  const [benchmark, setBenchmark] = React.useState<Benchmark>(
    _defaultBenchmark
      ? () => Benchmark.fromJSON(_defaultBenchmark)
      : new Benchmark(
          [
            Snippet.create(SAMPLE_DATA[1][0], SAMPLE_DATA[1][1]),
            Snippet.create(SAMPLE_DATA[2][0], SAMPLE_DATA[2][1]),
          ],
          Snippet.shared(SAMPLE_DATA[0][0]),
          "",
          Math.random().toString(),
          0,
          WorkerType.inline
        )
  );

  const originalName = _defaultBenchmark?.name;

  const workerType = benchmark.workerType;
  const onCancelTest = React.useCallback(() => {
    runner.cancel();
  }, [runner]);

  React.useEffect(() => {
    if (workers?.current?.length) {
      unloadWorkers(workers.current);
    }
    workers.current = loadWorkers(
      workerType === WorkerType.worker ? 6 : 1,
      workerType
    );
  }, [workers, workerType]);

  const setWorkerType = React.useCallback(
    (workerType) => {
      benchmark.workerType = workerType;
      setBenchmark(benchmark.clone());
    },
    [benchmark, setBenchmark]
  );
  const setSnippets = React.useCallback(
    (snippets) => {
      if (typeof snippets === "function") {
        benchmark.snippets = snippets(benchmark.snippets);
      } else {
        benchmark.snippets = snippets;
      }

      setBenchmark(benchmark.clone());
      setDirty(true);
    },
    [benchmark, setBenchmark, setDirty]
  );

  const setTitle = React.useCallback(
    (title) => {
      benchmark.name = title;
      setBenchmark(benchmark.clone());
      setDirty(true);
    },
    [benchmark, setBenchmark, setDirty]
  );

  const setTransform = React.useCallback(
    (transform) => {
      benchmark.transform = transform;
      if (
        transform === TransformType.jsx &&
        !benchmark.shared.code.includes("React")
      ) {
        benchmark.shared.code =
          `import React from "https://cdn.skypack.dev/react@17.0.1";\n` +
          benchmark.shared.code;
      }
      setBenchmark(benchmark.clone());
      setDirty(true);
    },
    [benchmark, setBenchmark, setDirty]
  );

  const snippets = benchmark.snippets;
  const title = benchmark.name;
  const sharedSnippet = benchmark.shared;

  const [errors, setErrors] = React.useState(() => new Array(snippets.length));
  const [sharedSnippetError, setSharedSnippetError] = React.useState<Error>(
    null
  );

  React.useEffect(() => {
    setErrors(() => {
      const errors = new Array(snippets.length);
      errors.fill(null);
      setSharedSnippetError(null);
    });
  }, [setErrors, snippets, snippets.length, setSharedSnippetError]);

  const isNewBenchmark =
    router.query.version === "new" || originalName !== benchmark.name;

  const onRunTest = React.useCallback(() => {
    let _benchmark: Benchmark = benchmark;
    setRunState(SnippetRunState.running);
    document?.querySelector(".SnippetList")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    let updateType: BenchmarkUpdateType;

    if (isNewBenchmark) {
      updateType = BenchmarkUpdateType.create;
    } else if (!isNewBenchmark && isDirty) {
      updateType = BenchmarkUpdateType.fork;
    } else {
      updateType = BenchmarkUpdateType.results;
    }

    if (updateType !== BenchmarkUpdateType.results) {
      const filteredSnippets = snippets.slice();
      for (let i = 0; i < filteredSnippets.length; i++) {
        const snippet = filteredSnippets[i];

        if (!snippet.hasCode()) {
          filteredSnippets.splice(i, 1);
        } else if (!snippet.name.trim().length) {
          snippet.name = snippet.code.substring(0, 12);
        }
      }

      if (updateType === BenchmarkUpdateType.fork) {
        _benchmark = _benchmark.clone();
      }

      if (!_benchmark.name.trim().length) {
        _benchmark.name = _benchmark.snippets.map((s) => s.name).join(" vs ");
      }

      _benchmark.workerType = workerType;
    }

    console.log(_benchmark);

    console.time("Completed test run");

    runner.run(_benchmark, workers.current).then(
      (results) => {
        setErrors(runner.errorData.slice());
        console.timeEnd("Completed test run");
        if (runner.canSave) {
          const benchmarkResults = BenchmarkResult.createFromJSON(
            _benchmark.id,
            navigator.userAgent,
            results
          );
          setBenchmarkResult(benchmarkResults);
          setResults(benchmarkResults.toResults(_benchmark.snippets));
          setBenchmark(_benchmark);
          runner.cleanup();
          setRunState(SnippetRunState.ran);

          if (updateType < BenchmarkUpdateType.results) {
            uploadBenchmark(_benchmark, results, updateType).then(
              ({ value: benchmark, error, message }) => {
                if (error) {
                  alert(message);
                  return;
                }
                setBenchmark(Benchmark.fromJSON(benchmark.fastbench));

                router.replace(
                  "/[id]/[version]",
                  benchmark.url.replace("https://fastbench.dev", ""),
                  { shallow: true }
                );
              }
            );
          } else {
            uploadResults(_benchmark, results).then(() => {
              console.log("Uploaded results.");
            });
          }
        } else {
          setRunState(SnippetRunState.pending);
          runner.cleanup();
        }

        setDirty(false);
      },
      (err) => {
        console.timeEnd("Completed test run");
        console.error(err);
        globalThis.onerror = null;
        setErrors(runner.errorData);
        setSharedSnippetError(runner.sharedSnippetError);
        debugger;
        setBenchmarkResult(null);
        setRunState(SnippetRunState.pending);
        console.error(err);
        runner.cleanup();
        setDirty(false);
      }
    );
  }, [
    snippets,
    sharedSnippet,
    setResults,
    setErrors,
    setSharedSnippetError,

    router,
    isNewBenchmark,
    title,
    setBenchmarkResult,
    workers,
    isDirty,
    setDirty,
    runner,
    setRunState,
    workerType,

    setBenchmark,
  ]);

  return (
    <ShowBenchmarkPage
      workers={workers}
      runner={runner}
      setDirty={setDirty}
      isDirty={isDirty}
      benchmark={benchmark}
      results={results}
      onRunTest={onRunTest}
      benchmarkResult={benchmarkResult}
      onCancelTest={onCancelTest}
      setTitle={setTitle}
      title={title}
      errors={errors}
      setErrors={setErrors}
      sharedSnippetError={sharedSnippetError}
      setSharedSnippetError={setSharedSnippetError}
      snippets={snippets}
      sharedSnippet={sharedSnippet}
      setTransform={setTransform}
      setSnippets={setSnippets}
      runState={runState}
      setRunState={setRunState}
    />
  );
};

const BenchmarkPageContainer = ({
  benchmark,
  results,
  benchmarkResults,
  runState,
  type,
}) => {
  switch (type) {
    case PageType.new:
    case PageType.results: {
      return (
        <BenchmarkPage
          benchmark={benchmark}
          results={results}
          benchmarkResults={benchmarkResults}
          runState={runState}
        />
      );
    }
    case PageType.notFound: {
      return (
        <>
          <Head>
            <meta name="robots" content="noindex" />
          </Head>
          <DefaultErrorPage statusCode={404} />
        </>
      );
    }
  }
};

export default BenchmarkPageContainer;
