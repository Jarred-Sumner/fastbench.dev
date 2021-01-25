import classNames from "classnames";
import * as React from "react";

export function formatDecimal(num, precision = 1, includeUnit = true) {
  if (!Number.isFinite(num)) {
    return `∞`;
  }

  let unit: string, value: number | string;
  if (Math.abs(num) > 999_999) {
    unit = "m";
    value = (Math.sign(num) * (Math.abs(num) / 1_000_000)).toFixed(precision);
  } else if (Math.abs(num) > 999) {
    unit = "k";
    let formattedValue = (Math.sign(num) * (Math.abs(num) / 1000)).toFixed(
      precision
    );
    if (formattedValue.endsWith(".0")) {
      formattedValue = formattedValue.substring(
        0,
        formattedValue.length - ".0".length
      );
    }
    value = formattedValue;
  } else {
    value = num === Math.trunc(num) ? num : num.toFixed(precision);
    unit = "";
  }

  if (value.toString().endsWith(".0")) {
    value = value.toString();
    value = value.substring(0, value.length - 2);
  }

  if (includeUnit) {
    return `${value}${unit}`;
  } else {
    return value.toString();
  }
}

const numberFormatter = new Intl.NumberFormat();
export function formatLongDecimal(_num: number, precision = 1) {
  if (!Number.isFinite(_num)) {
    return `∞`;
  }
  let num = _num;

  if (num > 10000) {
    num = Math.trunc(num);
  }

  return numberFormatter.format(num);
}

import Link from "next/link";
import { Arrow } from "./Arrow";

export type Result = {
  id: string;
  name: string;
  multiplier: number;
  operationsPerSecond: number;
  rank: number;
  error: boolean;
};

export enum CardColorScheme {
  blue = "blue",
  green = "green",
  dark = "dark",
}

export const getScore = (result: Result, baseline: Result) =>
  baseline.operationsPerSecond / result.operationsPerSecond;

export const getMultiplier = (result: Result, baseline: Result) =>
  (result?.operationsPerSecond ?? 1) / (baseline?.operationsPerSecond ?? 1);

const ResultListItem = ({ name, percent, isFastest, isSlowest }) => (
  <div
    className={classNames("ResultListItem", {
      "ResultListItem--fastest": isFastest,
      "ResultListItem--slowest": isSlowest,
      "ResultListItem--middle": !isFastest && !isSlowest,
    })}
  >
    <div className={"ResultListItem-name"}>{name}</div>

    <div className={"ResultListItem-progressContainer"}>
      <div
        className={"ResultListItem-progressValue"}
        style={{ width: `${percent * 100}%` }}
      />
    </div>
  </div>
);

const ResultCardComponent = ({
  title,
  results,
  fastest,
  baseline,
  href,
  colorScheme,
}: {
  title: string;
  results: Result[];
  href: string;
  baseline: Result;
  fastest: Result;
  colorScheme: CardColorScheme;
}) => {
  const renderResultListItem = React.useCallback(
    (result: Result, index) => {
      return (
        <ResultListItem
          name={result.name}
          percent={getScore(result, baseline)}
          isFastest={index === 0}
          isSlowest={index === results.length - 1}
          key={result.id}
        />
      );
    },
    [baseline, results.length]
  );

  return (
    <Link href={href}>
      <a
        href={href}
        className={classNames("ResultCard", {
          "ResultCard--blue": colorScheme === CardColorScheme.blue,
          "ResultCard--green": colorScheme === CardColorScheme.green,
          "ResultCard--dark": colorScheme === CardColorScheme.dark,
        })}
      >
        <div className={"ResultCard-title"}>{title}</div>

        <div className={"ListContainer"}>
          <div className={"ScoreContainer"}>
            <div className={"Score"}>
              {formatDecimal(getMultiplier(fastest, baseline))}x
            </div>
            <div className={"Operations"}>
              {formatDecimal(fastest.operationsPerSecond)} ops/s
            </div>
          </div>

          <div className={"ResultList"}>
            {results.map(renderResultListItem)}
          </div>
        </div>

        <div className={"ResultCard-link"}>
          View test <Arrow height={"14"} className={"ResultCard-linkArrow"} />
        </div>
      </a>
    </Link>
  );
};

export const resultComparator = (a: Result, b: Result) =>
  b.operationsPerSecond - a.operationsPerSecond;

export const ResultCard = ({
  title,
  results,
  href,
  colorScheme,
}: {
  title: string;
  results: Result[];
  href: string;
  colorScheme: CardColorScheme;
}) => {
  results.sort(resultComparator);
  const fastest = results[0];
  const slowest = results[results.length - 1];

  return (
    <ResultCardComponent
      title={title}
      results={results}
      href={href}
      colorScheme={colorScheme}
      baseline={slowest}
      fastest={fastest}
    />
  );
};
