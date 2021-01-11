// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import generateId from "shortid";
import slugify from "slugify";
import { NextApiRequest, NextApiResponse } from "next";
import { Benchmark } from "src/lib/Benchmark";
import {
  fetchBenchmarkResult,
  persistBenchmark,
  persistBenchmarkResult,
} from "../../src/lib/persistBenchmark";
import { SnippetResult } from "src/lib/SnippetResult";

const badRequest = (message: string, res: NextApiResponse) => {
  res.statusCode = 400;
  res.send({ error: "Bad Request", message, value: null });
  res.end();
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "POST": {
      if (!req.body.results) {
        badRequest("Missing results", res);
        return;
      }
      if (!req.body.id) {
        badRequest("Missing benchmark ID", res);
        return;
      }
      const id = req.body.id;
      const userAgent = req.headers["user-agent"];

      if (!userAgent) {
        badRequest("User agent is required.", res);
        return;
      }

      const benchmarkResult = await fetchBenchmarkResult(
        req.body.slug,
        req.body.version
      );

      if (!benchmarkResult.success) {
        badRequest("Invalid benchmark ID.", res);
        return;
      }

      const result = benchmarkResult.result;

      for (let snippetId in req.body.results) {
        result.appendResult(
          userAgent,
          snippetId,
          SnippetResult.normalize(req.body.results[snippetId])
        );
      }

      try {
        const save = await persistBenchmarkResult(
          req.body.slug,
          req.body.version,
          result.toBlob(),
          benchmarkResult.sha
        );
        res.send(200);
        res.end();
      } catch (exception) {
        console.error(exception);
        badRequest("ERROR", res);
        return;
      }
    }

    default: {
      res.statusCode = 400;
      res.end();
      break;
    }
  }
};
