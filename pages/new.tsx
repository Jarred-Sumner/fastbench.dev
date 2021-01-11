import { PageHeader } from "../src/components/PageHeader";
import {
  SnippetContainer,
  SnippetRunState,
} from "../src/components/SnippetContainer";
import { TitleInput } from "../src/components/TitleInput";
import * as React from "react";
import { FakeLinkButton } from "../src/components/LinkButton";
import { Snippet } from "../src/lib/Snippet";
import { Benchmark } from "../src/lib/Benchmark";
import { BenchmarkRunner } from "../src/lib/BenchmarkRunner";

import { SnippetList } from "src/components/SnippetList";
import {
  loadWorkers,
  unloadWorkers,
  WorkerType,
} from "src/lib/BenchmarkRunnerWorker";
import { BenchmarkResult } from "src/lib/SnippetResult";
import { ResultList } from "src/components/ResultsList";
import { useRouter } from "next/router";

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

export const NewBenchmarkPage = () => {
  const [title, setTitle] = React.useState("");
  const [versionKey, setVersionKey] = React.useState(0);
  const [workerType, setWorkerType] = React.useState<WorkerType>(
    WorkerType.inline
  );

  const [focusedId, setFocusedID] = React.useState(null);

  const workers = React.useRef<Worker[]>(null);
  React.useEffect(() => {
    if (workers?.current?.length) {
      unloadWorkers(workers.current);
    }
    workers.current = loadWorkers(
      workerType === WorkerType.worker ? 6 : 1,
      workerType
    );
  }, [workers, workerType]);

  const [runState, setRunState] = React.useState(SnippetRunState.pending);
  const [
    benchmarkResult,
    setBenchmarkResult,
  ] = React.useState<BenchmarkResult>();

  const [runner, setRunner] = React.useState<BenchmarkRunner>(
    () => new BenchmarkRunner()
  );

  const handleTitleChangeEvent = React.useCallback(
    (event: React.SyntheticEvent<InputEvent, HTMLInputElement>) => {
      setTitle(event.target.value);
    },
    [setTitle]
  );

  const [sharedSnippet, setSharedSnippet] = React.useState(() =>
    Snippet.shared(...SAMPLE_DATA[0])
  );

  const [snippets, setSnippets] = React.useState(() => [
    Snippet.create(...SAMPLE_DATA[1]),
    Snippet.create(...SAMPLE_DATA[2]),
  ]);

  const [errors, setErrors] = React.useState(() => new Array(snippets.length));

  React.useEffect(() => {
    setErrors(() => {
      const errors = new Array(snippets.length);
      errors.fill(null);
    });
  }, [setErrors, snippets, snippets.length]);

  const results = React.useMemo(() => {
    return snippets.length && benchmarkResult
      ? benchmarkResult.toResults(snippets)
      : [];
  }, [benchmarkResult, snippets, snippets.length]);

  const onCancelTest = React.useCallback(() => {
    runner.cancel();
  }, [runner]);

  const router = useRouter();

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
          setBenchmarkResult(
            BenchmarkResult.createFromJSON(
              _benchmark.id || Math.random().toString(10),
              navigator.userAgent,
              results
            )
          );
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
                benchmark.url.replace("https://fastbench.dev", "")
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
    setErrors,
    router,
    title,
    setBenchmarkResult,
    workers,
    runner,
    setRunState,
    workerType,
  ]);

  return (
    <div className={"Page NewBenchmarkPage"}>
      <PageHeader />

      <div className={"NewBenchmarkPageContent"}>
        <div className={"BenchmarkHeader"}>
          <TitleInput
            placeholder={"UNTITLED BENCHMARK"}
            defaultValue={""}
            onInput={handleTitleChangeEvent}
          />

          <div className={"RunTestButtonContainer"}>
            {runState !== SnippetRunState.running ? (
              <FakeLinkButton onClick={onRunTest}>Run test</FakeLinkButton>
            ) : (
              <FakeLinkButton gray onClick={onCancelTest}>
                Cancel
              </FakeLinkButton>
            )}
          </div>
        </div>

        {benchmarkResult && (
          <ResultList
            snippets={snippets}
            resultIndex={0}
            result={benchmarkResult}
          />
        )}

        <SnippetList
          runState={runState}
          setRunState={setRunState}
          results={results}
          errors={errors}
          sharedSnippet={sharedSnippet}
          focusedId={focusedId}
          setFocusedID={setFocusedID}
          snippets={snippets}
          setSnippets={setSnippets}
          runner={runner}
        />
      </div>
    </div>
  );
};

export default NewBenchmarkPage;
