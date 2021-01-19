import type { Fetch } from "@vercel/fetch";
import * as React from "react";
import { GetStaticPropsContext } from "next";
import {
  Benchmark,
  benchmarkGithubPackagePath,
  joinBenchmarkURL,
  RESULTS_FILENAME,
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

let SAMPLE_DATA;

if (process.env.NODE_ENV === "production") {
  SAMPLE_DATA = [[], [], []];
} else {
  SAMPLE_DATA = [
    ["var a = new Array(100)\nvar b = new Array();"],
    ["a.fill(100);", "[].fill"],
    [`for (let i = 0; i  < 100; i++) { b.push(100); }`, "[].push"],
  ];
}

async function uploadBenchmark(benchmark: Benchmark, results) {
  return globalThis
    .fetch(`/api/snippets`, {
      method: "POST",
      body: JSON.stringify({ benchmark: benchmark.toJSON(), results }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((resp) => resp.json());
}

const ViewBenchmarkSEOTags = ({ id, version, title }) => {
  return (
    <>
      <Head>
        <ImageSEOTag
          url={getShareURL({ id, version }) + ".png"}
          width={SHARE_CARD_WIDTH * 2}
          height={SHARE_CARD_HEIGHT * 2}
        />
        <TitleSEOTag title={title} />
        <URLSEOTag url={getShareURL({ id, version })} />
      </Head>
    </>
  );
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

export async function getStaticProps(context: GetStaticPropsContext) {
  if (context.params.id === "benches" && context.params.version === "new") {
    return {
      revalidate: Number.MAX_SAFE_INTEGER,
      props: {
        benchmark: null,
        runState: SnippetRunState.pending,
        results: [],
        benchmarkResults: [],
      }, // will be passed to the page component as props
    };
  } else {
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
        benchmarkResults: JSON.parse(JSON.stringify(benchmarkResults, null, 2)),
      }, // will be passed to the page component as props
    };
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
  sharedSnippet,
  setSnippets,
  onCancelTest,
  setTitle,
}: {
  results: Result[];
  benchmark: Benchmark;
}) => {
  const router = useRouter();

  const [focusedId, setFocusedID] = React.useState();

  const handleTitleChangeEvent = React.useCallback(
    (event: React.SyntheticEvent<InputEvent, HTMLInputElement>) => {
      setTitle(event.target.value);
    },
    [setTitle]
  );

  React.useEffect(() => {
    setErrors(() => {
      const errors = new Array(snippets.length);
      errors.fill(null);
    });
  }, [setErrors, snippets, snippets.length]);

  const prevResults = React.useRef<Result[]>();
  React.useEffect(() => {
    prevResults.current = results.slice();
  }, [results, results.length, prevResults]);

  const showPreviousResults = !benchmarkResult?.results?.length;

  const canShowResultList =
    runState === SnippetRunState.ran || prevResults?.current?.length;
  return (
    <div className={"Page NewBenchmarkPage"}>
      <PageHeader>
        <div className={"BenchmarkHeader"}>
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
      {runState === SnippetRunState.ran && (
        <ViewBenchmarkSEOTags
          id={router.query.id}
          version={router.query.version}
          title={benchmark.name}
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

        {runState === SnippetRunState.ran && (
          <ShareSheet benchmark={benchmark} />
        )}

        <SnippetList
          runState={runState}
          setRunState={setRunState}
          sharedSnippet={benchmark.shared}
          snippets={benchmark.snippets}
          results={results}
          setSnippets={setSnippets}
          errors={errors}
          runner={runner}
          focusedId={focusedId}
          setFocusedID={setFocusedID}
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

  debugger;
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
      benchmark.snippets = snippets;
      setBenchmark(benchmark.clone());
    },
    [benchmark, setBenchmark]
  );

  const setTitle = React.useCallback(
    (title) => {
      benchmark.name = title;
      setBenchmark(benchmark.clone());
    },
    [benchmark, setBenchmark]
  );

  const snippets = benchmark.snippets;
  const title = benchmark.name;
  const sharedSnippet = benchmark.shared;

  const [errors, setErrors] = React.useState(() => new Array(snippets.length));

  React.useEffect(() => {
    setErrors(() => {
      const errors = new Array(snippets.length);
      errors.fill(null);
    });
  }, [setErrors, snippets, snippets.length]);

  const onRunTest = React.useCallback(() => {
    setRunState(SnippetRunState.running);
    const _benchmark = new Benchmark(snippets, sharedSnippet, title, null);

    if (!_benchmark.name.length) {
      _benchmark.name = _benchmark.snippets.map((s) => s.name).join(" vs ");
    }
    console.time("Completed test run");
    _benchmark.workerType = workerType;

    runner.run(_benchmark, workers.current).then(
      (results) => {
        setErrors(runner.errorData.slice());
        console.timeEnd("Completed test run");
        if (runner.canSave) {
          const benchmarkResults = BenchmarkResult.createFromJSON(
            _benchmark.id || Math.random().toString(10),
            navigator.userAgent,
            results
          );
          setBenchmarkResult(benchmarkResults);
          setResults(benchmarkResults.toResults(_benchmark.snippets));
          setBenchmark(_benchmark);
          runner.cleanup();
          setRunState(SnippetRunState.ran);
          uploadBenchmark(_benchmark, results).then(
            ({ value: benchmark, error, message }) => {
              if (error) {
                alert(message);
                return;
              }
              router.replace(
                "/[id]/[version]",
                benchmark.url.replace("https://fastbench.dev", ""),
                { shallow: true }
              );
            }
          );
        } else {
          setRunState(SnippetRunState.pending);
          runner.cleanup();
        }
      },
      (err) => {
        console.timeEnd("Completed test run");
        for (let [id, isFinished] of runner.finishedSnippets.entries()) {
          if (!isFinished) {
            runner.errorData[id] = err;
            break;
          }
        }
        console.error(err);
        globalThis.onerror = null;
        setErrors(runner.errorData);
        setBenchmarkResult(null);
        setRunState(SnippetRunState.pending);
        console.error(err);
        runner.cleanup();
      }
    );
  }, [
    snippets,
    sharedSnippet,
    setResults,
    setErrors,
    router,
    title,
    setBenchmarkResult,
    workers,
    runner,
    setRunState,
    workerType,

    setBenchmark,
  ]);

  return (
    <ShowBenchmarkPage
      workers={workers}
      runner={runner}
      benchmark={benchmark}
      results={results}
      onRunTest={onRunTest}
      benchmarkResult={benchmarkResult}
      onCancelTest={onCancelTest}
      setTitle={setTitle}
      title={title}
      errors={errors}
      setErrors={setErrors}
      snippets={snippets}
      sharedSnippet={sharedSnippet}
      setSnippets={setSnippets}
      runState={runState}
      setRunState={setRunState}
    />
  );
};

export default BenchmarkPage;
