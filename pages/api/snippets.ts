// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import generateId from "shortid";
import slugify from "slugify";
import { NextApiRequest, NextApiResponse } from "next";
import { Benchmark } from "src/lib/Benchmark";
import { persistBenchmark } from "../../src/lib/persistBenchmark";

const badRequest = (message: string, res: NextApiResponse) => {
  res.statusCode = 400;
  res.send({ error: "Bad Request", message, value: null });
  res.end();
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "POST": {
      if (!req.body.benchmark) {
        badRequest("Missing benchmark", res);
        return;
      }
      let benchmark: Benchmark;
      try {
        benchmark = Benchmark.fromJSON(req.body.benchmark);
      } catch (exception) {
        badRequest("Error while processing benchmark", res);
        console.error(exception);
        return;
      }

      if (benchmark.isEmpty()) {
        badRequest("Empty benchmark", res);
        return;
      }

      let resp;
      try {
        resp = await persistBenchmark(
          benchmark,
          req.body.results,
          req.headers["user-agent"],
          req.body.updateType,
          req.body.slug,
          req.body.version
        );
      } catch (error) {
        badRequest("Error while saving benchmark", res);
        console.error(error);
        return;
      }

      res.statusCode = 201;
      res.send({
        value: resp,
        error: null,
      });
      res.end();

      break;
    }

    default: {
      res.statusCode = 400;
      res.end();
      break;
    }
  }
};
