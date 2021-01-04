import { PageHeader } from "../src/components/PageHeader";
import {
  SnippetContainer,
  SnippetRunState,
} from "../src/components/SnippetContainer";
import { TitleInput } from "../src/components/TitleInput";
import * as React from "react";
import { FakeLinkButton } from "../src/components/LinkButton";
import { SharedIcon } from "../src/components/SharedIcon";
import { PlusIcon } from "../src/components/PlusIcon";
import { Snippet } from "../src/lib/Snippet";
import { Benchmark } from "../src/lib/Benchmark";
import { BenchmarkRunner } from "../src/lib/BenchmarkRunner";
import BenchmarkWorker from "../src/BenchmarkWorker.worker";

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

const SnippetIndexIcon = ({ children }) => (
  <div className={"SnippetIcon SnippetIndexIcon"}>{children}</div>
);

const NewSnippetButton = ({ onClick }) => (
  <div onClick={onClick} className={"NewSnippetContainer"}>
    <PlusIcon className={"SnippetIcon NewSnippetContainer-icon"} />

    <div className={"NewSnippetContainer-label"}>ADD SNIPPET</div>
  </div>
);

async function uploadBenchmark(benchmark: Benchmark) {
  return globalThis
    .fetch(`/api/snippets`, {
      method: "POST",
      body: JSON.stringify({ benchmark: benchmark.toJSON() }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((resp) => resp.json());
}

const loadWorkers = () => {
  if (typeof window === "undefined") {
    return null;
  }

  let pool;
  if (typeof navigator.hardwareConcurrency === "number") {
    pool = new Array(Math.ceil(navigator.hardwareConcurrency / 2));
  } else {
    pool = new Array(3);
  }

  for (let i = 0; i < pool.length; i++) {
    pool[i] = new BenchmarkWorker({
      type: "module",
    });
    pool[i].name = `Benchmarker #${i}`;
  }
  return pool;
};

export const NewBenchmarkPage = () => {
  const [title, setTitle] = React.useState("");
  const [versionKey, setVersionKey] = React.useState(0);
  const [focusedId, setFocusedID] = React.useState(null);
  const workers = React.useRef<Worker[]>(loadWorkers());
  const [runState, setRunState] = React.useState(SnippetRunState.pending);

  const [runner, setRunner] = React.useState<BenchmarkRunner>(
    () => new BenchmarkRunner()
  );

  const handleTitleChangeEvent = React.useCallback(
    (event: React.SyntheticEvent<InputEvent, HTMLInputElement>) => {
      setTitle(event.target.value);
    },
    [setTitle]
  );

  const incrementVersionKey = () =>
    setVersionKey((id) => {
      id++;
      return id;
    });

  const [sharedSnippet, setSharedSnippet] = React.useState(() =>
    Snippet.shared(...SAMPLE_DATA[0])
  );

  const [snippets, setSnippets] = React.useState(() => [
    Snippet.create(...SAMPLE_DATA[1]),
    Snippet.create(...SAMPLE_DATA[2]),
  ]);

  const updateCode = React.useCallback(
    (code: string, id: string) => {
      let snippet: Snippet;
      for (let _snippet of snippets) {
        if (_snippet.id === id) {
          snippet = _snippet;
          break;
        }
      }

      if (!snippet) {
        throw `Missing snippet for id ${id}`;
      }

      snippet.code = code;
      setRunState(SnippetRunState.pending);
    },
    [snippets, setRunState]
  );

  const progressUpdateRefs = React.useMemo(() => {
    return [
      snippets.map(() => React.createRef()),
      snippets.map(() => React.createRef()),
    ];
  }, [snippets, snippets.length]);

  React.useEffect(() => {
    runner.progressBarRefs = progressUpdateRefs[0];
    runner.opsRefs = progressUpdateRefs[1];
  }, [progressUpdateRefs, runner]);

  const updateTitle = React.useCallback(
    (title: string, id: string) => {
      let snippet: Snippet;
      for (let _snippet of snippets) {
        if (_snippet.id === id) {
          snippet = _snippet;
          break;
        }
      }

      if (!snippet) {
        throw `Missing snippet for id ${id}`;
      }

      snippet.name = title;
    },
    [snippets]
  );

  const addSnippet = React.useCallback(() => {
    setSnippets((snippets) => {
      const _snippets = snippets.slice();

      _snippets.push(Snippet.create());
      return _snippets;
    });
    setRunState(SnippetRunState.pending);
  }, [setSnippets, Snippet.create, setRunState]);

  const renderSnippetContainer = React.useCallback(
    (snippet: Snippet, index: number) => {
      return (
        <SnippetContainer
          key={snippet.id + "-" + focusedId}
          title={snippet.name}
          placeholder={"Untitled snippet"}
          progressUpdateRef={progressUpdateRefs[0][index]}
          overlayRef={progressUpdateRefs[1][index]}
          onChangeTitle={updateTitle}
          focusedId={focusedId}
          onFocus={setFocusedID}
          onBlur={setFocusedID}
          code={snippet.code}
          runState={runState}
          codePlaceholder={"Insert JavaScript benchmark code in here."}
          onChangeCode={updateCode}
          id={snippet.id}
          icon={
            <SnippetIndexIcon>
              {String.fromCharCode((index % 26) + 65)}
            </SnippetIndexIcon>
          }
        />
      );
    },
    [
      snippets.length,
      snippets,
      focusedId,
      updateCode,
      setFocusedID,
      updateTitle,
      progressUpdateRefs,
      runState,
    ]
  );

  const onChangeSharedSnippet = React.useCallback(
    (code) => (sharedSnippet.code = code),
    [sharedSnippet]
  );

  const onRunTest = React.useCallback(() => {
    setRunState(SnippetRunState.running);
    const _benchmark = new Benchmark(snippets, sharedSnippet, title, null);

    if (!_benchmark.name.length) {
      _benchmark.name = _benchmark.snippets.map((s) => s.name).join(" vs ");
    }
    console.time("Completed test run");
    runner.run(_benchmark, workers.current).then(
      (results) => {
        console.timeEnd("Completed test run");
        runner.cleanup();
        setRunState(SnippetRunState.ran);
        uploadBenchmark(_benchmark).then(
          ({ value: benchmark, error, message }) => {
            if (error) {
              alert(message);
              return;
            }
            console.log(benchmark);
            debugger;
          }
        );
      },
      (err) => {
        setRunState(SnippetRunState.pending);
        console.error(err);
        runner.cleanup();
      }
    );

    // debugger;
    //
    // uploadBenchmark(_benchmark).then(({ value: benchmark, error, message }) => {
    //   if (error) {
    //     alert(message);
    //     return;
    //   }
    //   console.log(benchmark);
    //   debugger;
    // });
  }, [snippets, sharedSnippet, title, workers, runner, setRunState]);

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
            <FakeLinkButton onClick={onRunTest}>Run test</FakeLinkButton>
          </div>
        </div>

        <div className={"SnippetList"}>
          <SnippetContainer
            disableTitle
            icon={<SharedIcon className={"SnippetIcon"} />}
            placeholder={"Shared code"}
            code={sharedSnippet.code}
            onChangeCode={onChangeSharedSnippet}
            codePlaceholder={
              "Insert JavaScript code that runs before all benchmarks in here"
            }
          />

          {snippets.map(renderSnippetContainer)}

          <NewSnippetButton onClick={addSnippet} />
        </div>
      </div>
    </div>
  );
};

export default NewBenchmarkPage;