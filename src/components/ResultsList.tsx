import * as React from "react";
import { SnippetContainer, SnippetRunState } from "./SnippetContainer";
import { Snippet } from "../lib/Snippet";
import { SharedIcon } from "./SharedIcon";
import { PlusIcon } from "./PlusIcon";
import { BenchmarkResult } from "src/lib/SnippetResult";
import * as Platform from "platform";

import classNames from "classnames";

import {
  formatDecimal,
  formatLongDecimal,
  getScore,
  Result,
} from "src/components/ResultCard";

const ResultLongListItem = ({
  result,
  baseline,
}: {
  result: Result;
  baseline: Result;
}) => {
  let percent = getScore(baseline, result) * 100;
  let multiplier = result.multiplier;
  if (!Number.isFinite(percent)) {
    percent = 0;
    multiplier = 0;
  }

  return (
    <div
      className={classNames("ResultLongListItem", {
        "ResultLongListItem--first": result.rank === 1,
        "ResultLongListItem--notFirst": result.rank !== 1,
      })}
    >
      <div className="ResultLongListItem-name">{result.name}</div>

      <div className="ResultLongListItem-line">
        <div className="ResultLongListItem-statGroup">
          <div className="ResultLongListItem-ops">
            {formatLongDecimal(
              result.operationsPerSecond,
              result.operationsPerSecond < 500 ? 3 : 0
            )}{" "}
            ops/s
          </div>

          <div className="ResultLongListItem-multiplier">
            {formatDecimal(multiplier, 1) + "x"}
          </div>
        </div>

        <div className="ResultLongListItem-progressBarContainer">
          <div
            className="ResultLongListItem-progressBar"
            style={{ width: percent + "%" }}
          />
        </div>
      </div>
    </div>
  );
};

export const ResultList = ({
  snippets,
  result,
  resultIndex = 0,
}: {
  snippets: Snippet[];
  result: BenchmarkResult;
  resultIndex: number;
}) => {
  const formatter = React.useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {});
  }, [Intl.DateTimeFormat]);

  const snippetResults = React.useMemo(() => result.toResults(snippets), [
    result,
    snippets,
  ]);

  const baseline = React.useMemo(() => {
    const minOps = Math.max(
      ...result.results[resultIndex].results.map((a) => a.hz)
    );

    for (let i = 0; i < snippetResults.length; i++) {
      if (snippetResults[i].operationsPerSecond === minOps) {
        return snippetResults[i];
      }
    }
    return null;
  }, [result.results, resultIndex, snippetResults]);

  const group = result.results[resultIndex];

  const timeStamp = group.results[0].times.timeStamp;
  const userAgent = group.userAgents[0];
  const platform = Platform.parse(userAgent);

  const renderResultListItem = React.useCallback(
    (result: Result, index: number) => {
      return (
        <ResultLongListItem
          result={result}
          key={result.id}
          baseline={baseline}
        />
      );
    },
    [snippetResults, baseline]
  );

  return (
    <div className="ResultListSection">
      <div className="ResultListSection--subHeading">
        <div className="ResultListSection--subHeading-section">
          {formatter.format(new Date(timeStamp))}
        </div>

        <div className="ResultListSection--subHeading-separator">&middot;</div>

        <div className="ResultListSection--subHeading-section">
          {platform.description}
        </div>
      </div>

      <div className="ResultListSection-results">
        {snippetResults.map(renderResultListItem)}
      </div>
    </div>
  );
};
