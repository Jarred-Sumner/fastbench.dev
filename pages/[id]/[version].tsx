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

const scheme = process.env.NODE_ENV === "development" ? "http" : "https";
const domain =
  process.env.NODE_ENV === "development" ? "localhost:3001" : "fastbench.dev";
const getShareURL = ({ id, version }) =>
  `${scheme}://${domain}/${id}/${version}`;

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

  // We'll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return { paths, fallback: "blocking" };
}
let fetch: Fetch = globalThis.fetch;

if (typeof window === "undefined") {
  fetch = require("@vercel/fetch")(require("node-fetch"));
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const { benchmark, results, benchmarkResults } = await fetchBenchmark(
    context.params.version,
    context.params.id
  );

  return {
    revalidate: 5,
    props: {
      benchmark: benchmark.toJSON(),
      results,
      benchmarkResults: JSON.parse(JSON.stringify(benchmarkResults, null, 2)),
    }, // will be passed to the page component as props
  };
}

export const ViewBenchmarkPage = ({
  benchmark: _benchmark,
  results,
  benchmarkResults: _benchmarkResults,
}: {
  results: Result[];
}) => {
  const router = useRouter();
  const benchmark = React.useMemo(() => Benchmark.fromJSON(_benchmark), [
    _benchmark,
  ]);

  const benchmarkResults = React.useMemo(
    () => new BenchmarkResult(_benchmarkResults),
    [_benchmarkResults]
  );

  const [runState, setRunState] = React.useState(SnippetRunState.ran);
  const [runner, setRunner] = React.useState(() => new BenchmarkRunner());

  const onRunTest = React.useCallback(() => {}, [setRunState, runner]);

  return (
    <div className={"Page NewBenchmarkPage"}>
      <PageHeader />
      <ViewBenchmarkSEOTags
        id={router.query.id}
        version={router.query.version}
        title={benchmark.name}
      />

      <div className={"NewBenchmarkPageContent"}>
        <div className={"BenchmarkHeader"}>
          <TitleInput
            href={router.asPath}
            defaultValue={benchmark.name}
            readOnly
          />

          <div className={"RunTestButtonContainer"}>
            <FakeLinkButton onClick={onRunTest}>Re-run test</FakeLinkButton>
          </div>
        </div>

        <ResultList
          snippets={benchmark.snippets}
          result={benchmarkResults}
          resultIndex={0}
        />

        <div className="ShareSheet">
          <div className="ShareHeader">Share scorecard</div>
          <div className="ShareHeader-urlBox">
            <div className="ShareHeader-url">
              [https://fastbench.dev/{router.query.id}/{router.query.version}]
            </div>
          </div>
          <img
            src={`${getShareURL(router.query)}.svg`}
            height={SHARE_CARD_HEIGHT}
            width={SHARE_CARD_WIDTH}
          />
        </div>

        <SnippetList
          runState={runState}
          setRunState={setRunState}
          sharedSnippet={benchmark.shared}
          snippets={benchmark.snippets}
          results={results}
          runner={runner}
        />
      </div>
    </div>
  );
};

export default ViewBenchmarkPage;
