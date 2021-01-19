import { PageHeader } from "src/components/PageHeader";
import {
  SnippetContainer,
  SnippetRunState,
} from "src/components/SnippetContainer";
import { TitleInput } from "src/components/TitleInput";
import * as React from "react";
import { FakeLinkButton } from "src/components/LinkButton";
import { Snippet } from "src/lib/Snippet";
import { Benchmark } from "src/lib/Benchmark";
import { BenchmarkRunner } from "src/lib/BenchmarkRunner";

import { SnippetList } from "src/components/SnippetList";
import {
  loadWorkers,
  unloadWorkers,
  WorkerType,
} from "src/lib/BenchmarkRunnerWorker";
import { BenchmarkResult } from "src/lib/SnippetResult";
import { ResultList } from "src/components/ResultsList";
import { useRouter } from "next/router";

export const NewBenchmarkPage = ({
  runState = SnippetRunState.pending,

  workers,

  title,
}) => {
  const [versionKey, setVersionKey] = React.useState(0);

  const [focusedId, setFocusedID] = React.useState(null);

  const router = useRouter();

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
