import { MessageType, StatusMessageType } from "src/WorkerMessage";
import { Benchmark, TransformType } from "./lib/Benchmark";
import type { default as BenchmarkType } from "benchmark";
import type { LexerType } from "src/parseImports";
import type { Service, TransformOptions } from "esbuild-wasm/esm/browser";
import { resolveSkypackModule } from "src/skypack";

const ESBUILD_WASM = "/esbuild.wasm";

const ESBUILD_OPTS: TransformOptions = {
  loader: "jsx",
  minify: false,
  avoidTDZ: false,
};
let esbuild: Service;

let parseImports;

let Suite;

let suite: BenchmarkType.Suite;
let postMessage;

export function setPostMessageHandler(
  _postMesasge,
  _Suite: BenchmarkType.Suite
) {
  postMessage = _postMesasge;
  Suite = _Suite;
}

function runImport(importPath, originalPath) {
  return new Promise((resolve, reject) => {
    import(
      /* webpackIgnore: true */
      importPath
    )
      .then((ESM) => {
        importsList[importPath] = ESM;
        resolve(null);
      })
      .catch((exception) => {
        const error = new Error(
          `Importing module ${originalPath} failed.\nURL: ${importPath}\nError: ${exception.message}`
        );
        error.stack = exception.stack;
        error.name = exception.name;

        resolve(error);
      });
  });
}

let updateLength = Float64Array.BYTES_PER_ELEMENT * 5;
const updateObject = {
  id: 0,
  type: MessageType.progressUpdate,
  value: new Float64Array(
    typeof SharedArrayBuffer !== "undefined"
      ? new SharedArrayBuffer(updateLength)
      : new ArrayBuffer(updateLength)
  ),
};
let progressInterval: number = null;

function startSendingProgressUpdates(id) {
  if (typeof progressInterval === "number") {
    globalThis.clearInterval(progressInterval);
  }

  updateObject.id = id;
  updateObject.value.fill(0);
  updateObject.value[4] = performance.now();
  progressInterval = globalThis.setInterval(sendProgressUpdate, 100);
}

function sendProgressUpdate() {
  const now = performance.now();
  const stats = suite[0].stats;
  updateObject.value[1] = updateObject.value[0];
  updateObject.value[0] = 1 / (stats.mean + stats.moe);
  updateObject.value[2] = suite[0].hz;
  updateObject.value[3] += now - updateObject.value[4];
  updateObject.value[4] = now;
  postMessage(updateObject);
}

function stopProgressUpdates() {
  if (typeof progressInterval === "number") {
    globalThis.clearInterval(progressInterval);
  }
  progressInterval = null;
}
let statusMessage = {
  status: 0,
  id: 0,
  type: MessageType.statusUpdate,
  timestamp: 0,
};

function emitStatusMessage(status: StatusMessageType, id: number) {
  statusMessage.status = status;
  statusMessage.id = id;
  statusMessage.timestamp = performance.now();
  postMessage(statusMessage);
}

const importsList = (globalThis.bi = {});
const globalImportVariable = "globalThis.bi";

async function processImports(__code: string) {
  let code = __code;
  if (!code || !code.length) {
    return code;
  }

  if (!parseImports) {
    parseImports = (await import("src/parseImports")).default;
  }

  const imports: LexerType[] = await parseImports(code);

  if (imports.length === 0) {
    return code;
  }

  let newCode = code.slice();

  for (let importStatement of imports) {
    let originalPath, path;
    originalPath = path = code.substring(importStatement.s, importStatement.e);
    // Handle imports typed manually, so you can do

    if (!path.startsWith("http")) {
      const pathParts = path.split("/");
      let pathOffset = 1;
      // import _ from "@loadsh/lodash";
      if (path.startsWith("@")) {
        pathOffset = 2;
        path = await resolveSkypackModule(`${pathParts[0]}/${pathParts[1]}`);
        debugger;
      } else {
        pathOffset = 1;
        // import _ from "lodash";
        path = await resolveSkypackModule(pathParts[0]);
      }

      if (pathParts.length >= pathOffset) {
        path = path + "/" + pathParts.slice(pathOffset).join("/");
      }
    }

    let innerImportContent = code.substring(
      importStatement.ss,
      importStatement.s
    );
    innerImportContent = innerImportContent
      .substring(
        Math.max(
          innerImportContent.indexOf("import ") + "import ".length - 1,
          0
        )
      )
      .trim();

    innerImportContent = innerImportContent
      .substring(0, innerImportContent.lastIndexOf("from"))
      .trim();

    const wildcard = innerImportContent.includes("*")
      ? innerImportContent.replace("* as ", "").trim()
      : null;

    const named = innerImportContent.includes("{")
      ? innerImportContent
          .substring(
            innerImportContent.indexOf("{") + 1,
            innerImportContent.lastIndexOf("}")
          )
          .replace(/ as /gm, ":")
      : null;

    let defaultImport: string = null;

    if (!named && !wildcard && innerImportContent) {
      defaultImport = innerImportContent;
    }

    if (!importsList[path]) {
      console.log("Importing", originalPath);
      const importError = await runImport(path, originalPath);
      console.log(importError);
      if (importError) {
        throw importError;
      }
    }

    console.log("Imported from", path);

    let replacementCode = "";
    if (wildcard) {
      replacementCode += `var ${wildcard} = ${globalImportVariable}["${path}"];`;
    }

    if (defaultImport) {
      replacementCode += `var ${defaultImport} = ${globalImportVariable}["${path}"].default;`;
    }

    if (named?.length) {
      replacementCode += `var {${named}} = ${globalImportVariable}["${path}"];`;
    }

    newCode = newCode.replace(
      code.substring(importStatement.ss, importStatement.se),
      replacementCode
    );
  }

  return newCode;
}

async function start(
  benchmark: Benchmark,
  snippetIndex: number,
  id: string | number
) {
  const snippet = benchmark.snippets[snippetIndex];

  if (suite) {
    suite.abort();
  }

  emitStatusMessage(StatusMessageType.aboutToStart, id);
  let hasStarted = false;

  function errorHandler(error) {
    if (!hasStarted) {
      postMessage({ type: MessageType.start, id });
    }
    postMessage({ type: MessageType.error, value: error, id });
    stopProgressUpdates();
    // if (suite && !suite.aborted) {
    //   suite.abort();
    // }
  }

  if (!snippet?.code?.trim().length) {
    errorHandler(new Error("Empty snippet"));
    return;
  }

  let snippetCode = snippet?.code;
  let sharedCode = benchmark?.shared?.code ?? null;

  if (benchmark.transform === TransformType.jsx) {
    try {
      if (!esbuild) {
        const _esbuild = await import("esbuild-wasm/esm/browser");

        esbuild = await _esbuild.startService({
          wasmURL: ESBUILD_WASM,
        });

        console.log("Loaded ESBuild.");
      }

      const [_snippetCode, _sharedCode] = await Promise.all([
        esbuild.transform(snippetCode, ESBUILD_OPTS),
        esbuild.transform(sharedCode, ESBUILD_OPTS),
      ]);

      snippetCode = _snippetCode.code;
      sharedCode = _sharedCode.code;
    } catch (exception) {
      errorHandler(exception);
      return;
    }
  }

  try {
    if (snippetCode.includes("import")) {
      snippetCode = await processImports(snippetCode);
    }
    if (sharedCode && sharedCode.includes("import")) {
      sharedCode = await processImports(sharedCode);
    }
  } catch (exception) {
    errorHandler(exception);
    return;
  }
  console.log(benchmark.transform);

  let _suite: BenchmarkType.Suite = new Suite(snippet.name, {
    maxTime: 30,
    name: benchmark.name,
  });

  _suite.add(snippet.name, snippetCode, {
    setup: sharedCode,
    onError: errorHandler,
    onCycle: ({ target: { stats, times, hz, cycles, error } }) => {
      if (error) {
        errorHandler(error);
      } else {
        postMessage({
          type: MessageType.cycle,
          value: { stats, times, hz, cycles, error: false },
          id,
        });
      }
    },
    onComplete: function (complete) {
      if (suite === _suite) {
        suite = null;
      }
      _suite = null;
      stopProgressUpdates();
      postMessage({
        type: MessageType.complete,
        // value: complete,
        id,
      });
    },
    onStart: (...complete) => {
      hasStarted = true;
      postMessage({ type: MessageType.start, id });
      startSendingProgressUpdates(id);
    },
  });

  suite = _suite;
  try {
    _suite.run({ async: true, defer: false });
  } catch (exception) {
    errorHandler(exception);
    return;
  }
}

export function processMessage(event: MessageEvent) {
  const { type } = event.data;
  switch (type) {
    case MessageType.start: {
      const {
        id,
        value: { benchmark, snippetIndex },
      } = event.data;
      start(Benchmark.fromJSON(benchmark), snippetIndex, id);
      break;
    }
    case MessageType.cancel: {
      if (suite) {
        suite.abort();
        suite = null;
      }
      stopProgressUpdates();
      break;
    }
  }
}
