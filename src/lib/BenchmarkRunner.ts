import { Benchmark } from "./Benchmark";
import { MessageType } from "../WorkerMessage";
import * as BenchmarkJS from "benchmark";
import { filter } from "./BenchmarkFilter";
import React from "react";
import { formatDecimal, formatLongDecimal } from "../components/ResultCard";
import { BenchmarkResult } from "src/lib/SnippetResult";

const TEN_SECONDS = 10_000;

// Allow this function to be JIT'd.
// TODO: use CSS Typed Objects.
function performUpdate(
  progressEl: HTMLDivElement,
  operationsBarEl: HTMLDivElement,
  progressValue: number,
  operationsValue: string
) {
  progressEl.style.transform = `scaleX(${
    progressValue < 1 ? progressValue : 1
  })`;
  operationsBarEl.textContent = operationsValue;
}

class ProgressUpdater {
  progressEl: React.RefObject<HTMLDivElement>;
  operationsBarEl: React.RefObject<HTMLDivElement>;
  progressValue: number;
  operationsValue: string;
  token: number;

  static dispose(updater: ProgressUpdater) {
    if (updater.token) {
      globalThis.cancelAnimationFrame(updater.token);
    }
    updater.progressEl = updater.operationsBarEl = null;
  }

  update = () => {
    if (!this.progressEl?.current || !this.operationsBarEl?.current) {
      return;
    }

    performUpdate(
      this.progressEl.current,
      this.operationsBarEl.current,
      this.progressValue,
      this.operationsValue
    );
  };

  schedule(progressValue: number, operationsValue: string) {
    this.progressValue = progressValue;
    this.operationsValue = operationsValue;
    this.token = globalThis.requestAnimationFrame(this.update);
  }
}

export class BenchmarkRunner {
  snippetIdMap = new Map<number, number>();

  benchmark: Benchmark;
  worker: Worker | MessagePort;
  snippetData = [];
  errorData = [];
  finishedSnippets = new Map<number, boolean>();

  progressBarUpdaters: Array<ProgressUpdater> = [];
  createProgressBarUpdater(snippetIndex: number) {
    const updater = new ProgressUpdater();
    updater.progressEl = this.progressBarRefs[snippetIndex];
    updater.operationsBarEl = this.opsRefs[snippetIndex];
    return updater;
  }

  *nextPendingSnippet() {
    for (let i = 0; i < this.benchmark.snippets.length; i++) {
      if (!this.finishedSnippets.has(i)) {
        yield i;
      }
    }
  }

  *nextWorker() {
    for (let i = 0; i < this.workers.length; i++) {
      if (!this.busyWorkers.get(this.workers[i])) {
        yield this.workers[i];
      }
    }
  }

  updateProgressBar(snippetIndex: number, progress: number, ops: number) {
    this.progressBarUpdaters[snippetIndex].schedule(
      progress,
      formatLongDecimal(Math.trunc(ops)).toString()
    );
  }

  onMessageEvent = ({
    data: { id: _id, type, value },
    source,
    target,
    srcElement,
  }: MessageEvent) => {
    if (!this.snippetIdMap.has(_id)) {
      return;
    }

    const snippetIndex = this.snippetIdMap.get(_id);

    switch (type) {
      case MessageType.complete: {
        if (this.snippetData[snippetIndex]) {
          this.updateProgressBar(
            snippetIndex,
            1.0,
            this.snippetData[snippetIndex].hz
          );
        }

        this.finishedSnippets.set(snippetIndex, true);

        this.busyWorkers.set(target || srcElement, false);
        this.continueBenchmark();
        break;
      }

      case MessageType.cycle: {
        this.snippetData[snippetIndex] = value;
        break;
      }

      case MessageType.progressUpdate: {
        if (!this.finishedSnippets.get(snippetIndex)) {
          this.updateProgressBar(
            snippetIndex,
            value[3] / TEN_SECONDS,
            value[2]
          );
        }

        break;
      }
    }
  };

  get isLast() {
    const nextPendingSnippet = this.nextPendingSnippet().next();
    return (
      nextPendingSnippet.done || typeof nextPendingSnippet.value !== "number"
    );
  }

  get isFinished() {
    for (let i = 0; i < this.benchmark.snippets.length; i++) {
      if (!this.finishedSnippets.get(i)) {
        return false;
      }
    }

    return true;
  }

  continueBenchmark() {
    if (this.isLast && this.isFinished) {
      this.finish(null);
    } else if (this.isLast) {
    } else {
      this.runSnippet();
    }
  }

  runSnippet() {
    const { benchmark } = this;
    const currentSnippetIndex = this.nextPendingSnippet().next().value;
    const worker: Worker = this.nextWorker().next().value;
    let currentId = Math.random();
    this.updateProgressBar(currentSnippetIndex, 0, 0);
    this.snippetIdMap.set(currentId, currentSnippetIndex);
    this.busyWorkers.set(worker, currentId);
    this.finishedSnippets.set(currentSnippetIndex, false);

    globalThis.onerror = this.errorEvents.get(worker);
    worker.postMessage({
      type: MessageType.start,
      id: currentId,
      value: {
        benchmark: benchmark.toJSON(),
        snippetIndex: currentSnippetIndex,
      },
    });
  }

  getResults() {
    const finishedSnippets = this.snippetData
      .filter((value, index) => !this.errorData[index])
      .filter(Boolean);
    return finishedSnippets.map((data) => ({
      id: this.benchmark.snippets[this.snippetData.indexOf(data)].id,
      result: data,
    }));
  }

  getLocalResults() {
    return BenchmarkResult.createFromJSON(
      this.benchmark.id,
      globalThis.navigator.userAgent,
      this.getResults()
    );
  }

  get hasErrors() {
    return this.errorData.filter(Boolean).length > 0;
  }

  get canSave() {
    return !this.hasErrors && this.getResults().length > 0;
  }

  cancel() {
    for (let worker of this.workers) {
      if (this.busyWorkers.get(worker)) {
        worker.postMessage({
          type: MessageType.cancel,
        });
      }
    }
    this.finish({ cancel: true });
  }

  finish(error) {
    if (error) {
      this.finishResolver = null;
      this.finishRejecter(error);
    } else if (this.finishResolver) {
      this.finishResolver(this.getResults());
      this.finishRejecter = null;
    }
  }
  cleanup() {
    for (let worker of this.workers) {
      worker.removeEventListener("message", this.onMessageEvent);
      worker.removeEventListener("error", this.errorEvents.get(worker));
      this.errorEvents.delete(worker);
      this.busyWorkers.delete(worker);
    }

    globalThis.onerror = this.origOnError;
    this.benchmark = this.workers = null;
    this.snippetIdMap.clear();
    this.progressBarUpdaters.forEach(ProgressUpdater.dispose);
    this.progressBarUpdaters.length = 0;
    this.finishedSnippets.clear();
    this.snippetData.length = 0;
  }

  onErrorEvent = (worker) => (event: ErrorEvent) => {
    if (!event) {
      return;
    }

    let error = event?.error;
    if (typeof event === "string") {
      error = new Error(event);
    }
    this.errorData[this.busyWorkers.get(worker)] = error;
    this.finishedSnippets.set(this.busyWorkers.get(worker), false);
    this.busyWorkers.delete(worker);

    this.finish(error);
  };

  finishResolver = null;
  finishRejecter = null;
  workers: Worker[];
  busyWorkers = new WeakMap<Worker, number>();
  errorEvents = new WeakMap<Worker, Function>();

  progressBarRefs = new Array<React.Ref<HTMLDivElement>>();
  opsRefs = new Array<React.Ref<HTMLDivElement>>();

  run(benchmark: Benchmark, workerPool: Worker[]) {
    this.benchmark = benchmark;
    this.workers = workerPool;
    this.errorData.length = this.progressBarUpdaters.length = this.snippetData.length =
      benchmark.snippets.length;
    this.snippetData.fill(null);
    this.errorData.fill(null);

    for (let i = 0; i < this.benchmark.snippets.length; i++) {
      this.progressBarUpdaters[i] = this.createProgressBarUpdater(i);
      this.progressBarUpdaters[i].schedule(0, "0");
    }

    return new Promise((resolve, reject) => {
      this.finishResolver = resolve;
      this.finishRejecter = reject;

      for (let worker of this.workers) {
        let errFunc = this.onErrorEvent(worker);
        this.errorEvents.set(worker, errFunc);
        this.busyWorkers.delete(worker);
        worker.addEventListener("message", this.onMessageEvent);
        worker.addEventListener("error", errFunc);
      }

      for (
        let i = 0;
        i < Math.min(this.workers.length, this.benchmark.snippets.length);
        i++
      ) {
        this.runSnippet();
      }
    });
  }
}
