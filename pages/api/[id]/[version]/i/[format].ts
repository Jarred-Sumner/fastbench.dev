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

function fetchFont(family, weight) {
  const fontKey = `${family}-${weight}`;
  if (!fontMap.has(fontKey)) {
    const fontDescriptor = fontList.find((font) => {
      return font.weight === weight && font.family === family;
    });

    const font = OpenType.parse(fontDescriptor.src.buffer);
    fontMap.set(fontKey, font);
  }

  return fontMap.get(fontKey);
}

const MAX_SIZE_THAT_FITS_COUNT = 10;

enum SizeThatFitsType {
  width,
  height,
  widthAndHeight,
}

function sizeThatFits(
  font: OpenType.Font,
  text: string,
  size: number,
  desiredWidth: number,
  desiredHeight: number
) {
  let width = Infinity,
    height = Infinity,
    path: OpenType.Path = null,
    roundedHeight = Infinity,
    roundedWidth = Infinity;
  let fontSize = size,
    i = 0;
  let sizeCheckType: SizeThatFitsType;

  if (
    Number.isFinite(desiredWidth) &&
    Number.isFinite(desiredHeight) &&
    desiredWidth > 0 &&
    desiredHeight > 0
  ) {
    sizeCheckType = SizeThatFitsType.widthAndHeight;
  } else if (Number.isFinite(desiredHeight) && desiredHeight > 0) {
    sizeCheckType = SizeThatFitsType.height;
  } else if (Number.isFinite(desiredWidth) && desiredWidth > 0) {
    sizeCheckType = SizeThatFitsType.width;
  } else {
    return size;
  }

  do {
    path = font.getPath(text, fontSize, fontSize, fontSize);
    const { x1, x2, y1, y2 } = path.getBoundingBox();
    width = Math.abs(x2 - x1);
    height = Math.abs(y2 - y1);

    i++;

    switch (sizeCheckType) {
      case SizeThatFitsType.height: {
        roundedHeight = Math.fround(height);
        if (roundedHeight === desiredHeight) {
          return fontSize;
        } else if (roundedHeight > height) {
          fontSize -= 0.2;
        } else if (roundedHeight < height) {
          fontSize += 0.2;
        }

        break;
      }

      case SizeThatFitsType.width: {
        roundedWidth = Math.fround(width);
        if (roundedWidth === desiredWidth) {
          return fontSize;
        } else if (roundedWidth > width) {
          fontSize -= 0.2;
        } else if (roundedWidth < width) {
          fontSize += 0.2;
        }

        break;
      }

      case SizeThatFitsType.widthAndHeight: {
        roundedHeight = Math.fround(height);
        roundedWidth = Math.fround(width);

        if (roundedHeight === desiredHeight && roundedWidth === desiredWidth) {
          return fontSize;
        }

        if (roundedHeight > height) {
          fontSize -= 0.2;
          continue;
        } else if (roundedHeight < height) {
          fontSize += 0.2;
          continue;
        }

        if (roundedWidth > width) {
          fontSize -= 0.2;
          continue;
        } else if (roundedWidth < width) {
          fontSize += 0.2;
          continue;
        }

        break;
      }
    }
  } while (i < MAX_SIZE_THAT_FITS_COUNT);

  return fontSize;
}

function onMeasureText(
  { fontFamily, fontSize, children, fontWeight, sizeToFit = true },
  desiredWidth: number,
  desiredHeight: number
) {
  const font = fetchFont(fontFamily, fontWeight);
  let size = parseInt(fontSize, 10);
  const text = String(children);

  if (sizeToFit) {
    size = sizeThatFits(font, text, size, desiredWidth, desiredHeight);
  }

  const path = font.getPath(text, size, size, size);
  const { x1, x2, y1, y2 } = path.getBoundingBox();

  const res = {
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };

  return res;
}

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
      onMeasure: onMeasureText,
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
    const font = await fetchFont(family, weight);
    let _size = sizeThatFits(font, text, size, width, height);

    const svg = $(font.getPath(text, x, y, _size).toSVG(8));
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
  let fastest, baseline;

  for (let result of results) {
    if (!fastest) {
      fastest = result;
    } else if (result.operationsPerSecond > fastest.operationsPerSecond) {
      fastest = result;
    }

    if (!baseline) {
      baseline = result;
    } else if (result.operationsPerSecond < baseline.operationsPerSecond) {
      baseline = result;
    }
  }

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
              baseline,
              fastest,
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
            baseline,
            fastest,
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
