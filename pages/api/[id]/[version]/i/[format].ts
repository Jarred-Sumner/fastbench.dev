import { NextApiRequest, NextApiResponse } from "next";
import ReactDOM from "react-dom/server";
import * as React from "react";
import fontList from "src/fontList";
import path from "path";
import cheerio from "cheerio";
import * as OpenType from "opentype.js";
import { fetchBenchmark } from "src/lib/fetchBenchmark";
import _svg2img from "svg2img";
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "src/components/ShareCardDimensions";
import fs from "fs";

let ShareCard;

function svg2img(svg, opts) {
  return new Promise((resolve, reject) => {
    _svg2img(svg, opts, (err: Error, res: Buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

let fontMap = new Map<string, OpenType.Font>();

const getAllAttributes = function (node) {
  return (
    node.attributes ||
    Object.keys(node.attribs).map((name) => ({
      name,
      value: node.attribs[name],
    }))
  );
};

const badRequest = (message: string, res: NextApiResponse) => {
  res.statusCode = 400;
  res.send({ error: "Bad Request", message, value: null });
  res.end();
};

const renderShareCardPNG = async (results, baseline, fastest, title) => {
  const svg = await renderShareCardSVG(results, baseline, fastest, title);

  return await svg2img(svg, {
    width: SHARE_CARD_WIDTH * 2,
    height: SHARE_CARD_HEIGHT * 2,
    preserveAspectRatio: true,
  });
};

const renderShareCardSVG = async (results, baseline, fastest, title) => {
  if (!ShareCard) {
    ShareCard = await import("src/components/ShareCard");
  }

  let markup = ReactDOM.renderToStaticMarkup(
    React.createElement(ShareCard.ShareCard, {
      results,
      baseline,
      fastest,
      title,
    })
  );

  const $ = cheerio.load(markup, {});
  const strings = $("text[font-family]")
    .toArray()
    .map((_element) => {
      const $el = $(_element);
      const family = $el.attr("font-family");
      const weight = $el.attr("font-weight");
      const size = parseInt($el.attr("font-size"), 10);

      const obj = {
        family,
        weight,
        size,
        y: parseInt($el.attr("y"), 10),
        x: parseInt($el.attr("x"), 10),
        width: parseInt($el.attr("width"), 10),
        height: parseInt($el.attr("height"), 10),
        text: $el.contents().text(),
        element: $el,
      };

      return obj;
    });

  for (let {
    family,
    weight,
    size,
    x,
    y,
    width,
    height,
    text,
    element,
  } of strings) {
    const fontKey = `${family}-${weight}`;
    if (!fontMap.has(fontKey)) {
      const fontDescriptor = fontList.find((font) => {
        return font.weight === weight && font.family === family;
      });

      const font = await OpenType.parse(fontDescriptor.src.buffer);
      fontMap.set(fontKey, font);
    }

    const font = fontMap.get(fontKey);
    const svg = $(font.getPath(text, x, y, size).toSVG(8));
    for (let { name, value } of getAllAttributes(element.get(0))) {
      svg.attr(name, value);
    }

    // const pathEl = $(svg);
    const $el = $(element).replaceWith(svg);
  }

  return $("svg").parent().html();
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { id, version, format } = req.query;

  const { benchmark, benchmarkResults, results } = await fetchBenchmark(
    version,
    id
  );

  switch (req.method) {
    case "GET": {
      switch (format) {
        case "json": {
          res.setHeader("Content-Type", "application/json");
          res.send({
            benchmark: benchmark.toJSON(),
            results,
            benchmarkResults: JSON.parse(
              JSON.stringify(benchmarkResults, null, 2)
            ),
          });
          res.end();
          break;
        }
        case "png": {
          try {
            const svg = await renderShareCardPNG(
              results,
              results[0],
              results[results.length - 1],
              benchmark.name
            );
            res.setHeader("Content-Type", "image/png");
            res.setHeader("Cache-Control", "");
            res.statusCode = 200;
            res.write(svg);
            res.end();
          } catch (exception) {
            console.error(exception);
            res.statusCode = 500;
            res.send("UH-OH");
            res.setHeader("Content-Type", "text/plain");
            res.setHeader("Cache-Control", "");
          }

          break;
        }
        case "svg": {
          const svg = await renderShareCardSVG(
            results,
            results[0],
            results[results.length - 1],
            benchmark.name
          );
          res.setHeader("Content-Type", "image/svg+xml");
          res.setHeader("Cache-Control", "");
          res.statusCode = 200;
          res.write(svg);
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
