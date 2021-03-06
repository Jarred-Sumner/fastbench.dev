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
  results,
  resultIndex = 0,
  githubURL,
  disabled,
}: {
  snippets: Snippet[];
  result: BenchmarkResult;
  results: Result[];
  resultIndex: number;
  disabled: boolean;
}) => {
  const formatter = React.useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {});
  }, [Intl.DateTimeFormat]);

  const baseline = React.useMemo(() => {
    const minOps = Math.max(...results.map((a) => a.operationsPerSecond));

    for (let i = 0; i < results.length; i++) {
      if (results[i].operationsPerSecond === minOps) {
        return results[i];
      }
    }
    return null;
  }, [result?.results, resultIndex, results]);

  const group = result?.results[resultIndex];

  const timeStamp = group?.results[0]?.times?.timeStamp;
  const userAgent = group?.userAgents[0];
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
    [results, baseline]
  );

  return (
    <div
      className={`ResultListSection ${
        disabled ? "ResultListSection--disabled" : ""
      }`}
    >
      <div className="ResultListSection--subHeading">
        {timeStamp && (
          <>
            <div className="ResultListSection--subHeading-section">
              {formatter.format(new Date(timeStamp))}
            </div>

            <div className="ResultListSection--subHeading-separator">
              &middot;
            </div>
          </>
        )}

        {platform?.description && (
          <div className="ResultListSection--subHeading-section">
            {platform.description}
          </div>
        )}

        {!githubURL.includes("undefined") && (
          <>
            <div className="ResultListSection--subHeading-separator">
              &middot;
            </div>

            <a
              href={githubURL}
              target="_blank"
              className="ResultListSection--subHeading-section ResultListSection--subHeading-section--github"
            >
              GitHub
            </a>
          </>
        )}
      </div>

      <div className="ResultListSection-results">
        {results.map(renderResultListItem)}
      </div>
    </div>
  );
};
