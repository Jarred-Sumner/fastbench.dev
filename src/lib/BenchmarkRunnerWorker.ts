export enum WorkerType {
  iframe,
  inline,
  worker,
}

function _loadInline() {
  globalThis._ = require("lodash");
  globalThis.platform = require("platform");
  const BenchmarkJS = require("benchmark");

  globalThis.Benchmark = BenchmarkJS.runInContext({});

  const fakeReceiverEvent = { data: {} };
  const fakeSenderEvent = { data: {} };
  const fakeErrorEvent = { error: null };
  const fakePort = {
    handlers: {
      message: [],
      error: [],
    },
    receivePostMessage: (object) => {
      fakeReceiverEvent.data = object;

      for (let message of fakePort.handlers.message) {
        message(fakeReceiverEvent);
      }
    },
    processMessage: function () {},
    postMessage(object) {
      fakeSenderEvent.data = object;
      try {
        fakePort.processMessage(fakeSenderEvent);
      } catch (exception) {
        fakeSenderEvent.data = null;
        fakeErrorEvent.error = exception;
        for (let error of fakePort.handlers.error) {
          error(fakeErrorEvent);
        }
      }
    },
    addEventListener: (name, handler) => {
      fakePort.handlers[name].push(handler);
    },
    removeEventListener: (name, handler) => {
      fakePort.handlers[name].splice(
        fakePort.handlers[name].indexOf(handler),
        1
      );
    },
    remove: () => {
      fakePort.handlers.message.length = 0;
      fakePort.handlers.error.length = 0;
    },
  };

  fakeReceiverEvent.target = fakeSenderEvent.target = fakePort;

  import("../BenchmarkWorkerClient").then(
    ({ processMessage, setPostMessageHandler }) => {
      setPostMessageHandler(
        fakePort.receivePostMessage,
        globalThis.Benchmark.Suite
      );
      fakePort.processMessage = processMessage;
    }
  );

  return fakePort;
}

var inline;
function loadInline() {
  if (!inline) {
    inline = _loadInline();
  }

  return inline;
}

export const loadWorkers = (max: number = 3, workerType: WorkerType) => {
  if (typeof window === "undefined") {
    return null;
  }

  const count = Math.min(globalThis.navigator?.hardwareConcurrency ?? 6, max);
  const pool = new Array(count);

  if (workerType === WorkerType.iframe) {
    for (let i = 0; i < pool.length; i++) {
      const iframe: HTMLIFrameElement = document.createElement("iframe");
      iframe.src = "/iframe.html";
      iframe.width = 1;
      iframe.height = 1;
      iframe.frameBorder = 0;
      iframe.style.top = -99999;
      iframe.style.left = -99999;
      document.body.appendChild(iframe);

      const messagePort = new MessageChannel();

      const iframeInterface = messagePort.port1;
      iframe.addEventListener("load", () => {
        iframe.contentWindow.postMessage(
          { port: messagePort.port2 },
          iframe.contentWindow.origin,
          [messagePort.port2]
        );
      });
      pool[i] = iframeInterface;
      iframeInterface.object = iframe;
      iframeInterface.start();
    }
  } else if (workerType === WorkerType.inline) {
    pool[0] = loadInline();
    pool[0].object = pool[0];
  } else {
    for (let i = 0; i < pool.length; i++) {
      pool[i] = new BenchmarkWorker({
        type: "module",
      });
      pool[i].name = `Benchmarker #${i}`;
      pool[i].object = pool[i];
    }
  }

  return pool;
};

export function unloadWorkers(pool) {
  let item;
  while ((item = pool.pop())) {
    const object = item.object;

    if (object instanceof Worker) {
      (object as Worker).terminate();
    } else {
      object.remove();
    }
  }
}
