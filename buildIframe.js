const { buildSync } = require("esbuild");
const fs = require("fs");
const path = require("path");

const out = buildSync({
  bundle: true,
  format: "esm",
  write: false,
  platform: "browser",
  target: "es2020",
  entryPoints: ["./src/FrameClient"],
});

const javascript = out.outputFiles[0].text;

const HTML = `
  <!DOCTYPE html>
  <html>
    <head></head>
    <body>
    <script src="/vendor/lodash.js"></script>
    <script src="/vendor/platform.js"></script>
    <script src="/vendor/benchmark.js"></script>
    <script type="module">${javascript}</script>
    </body>
    </html>
`;

fs.writeFileSync(path.join(__dirname, "public/iframe.html"), HTML);
