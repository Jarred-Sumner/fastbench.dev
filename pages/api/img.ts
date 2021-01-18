import { NextApiRequest, NextApiResponse } from "next";
import ReactDOM from "react-dom/server";
import fixture from "src/components/fixture";
import * as React from "react";

let ShareCard;

const badRequest = (message: string, res: NextApiResponse) => {
  res.statusCode = 400;
  res.send({ error: "Bad Request", message, value: null });
  res.end();
};

const renderShareCardSVG = async (results, baseline, fastest, title) => {
  if (!ShareCard) {
    ShareCard = (await import("../../src/components/ShareCard")).default;
  }

  return ReactDOM.renderToStaticMarkup(
    React.createElement(ShareCard, {
      results,
      baseline,
      fastest,
      title,
    })
  );
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "GET": {
      switch (req.query.format) {
        case "png": {
        }
        case "svg": {
          const results = fixture.result.toResults(fixture.snippets);
          const svg = renderShareCardSVG(
            results,
            results[0],
            results[1],
            "Array loops"
          );
          res.setHeader("Content-Type", "image/svg+xml");
          res.statusCode = 200;
          res.send(svg);
          res.end();
          break;
        }
        default: {
          badRequest("Not implemented yet", res);
          break;
        }
      }
      // res.setHeader("Cache-Control", value)
      break;
    }
  }
};
