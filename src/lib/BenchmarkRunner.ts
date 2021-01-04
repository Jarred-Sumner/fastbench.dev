import { Benchmark } from "./Benchmark";
import { MessageType } from "../WorkerMessage";
import * as BenchmarkJS from "benchmark";
import { filter } from "./BenchmarkFilter";
import React from "react";
import { formatDecimal, formatLongDecimal } from "../components/ResultCard";

const TEN_SECONDS = 10_000;
export class BenchmarkRunner {
  snippetIdMap = new Map<number, number>();

  benchmark: Benchmark;
  worker: Worker;
  snippetData = [];
  finishedSnippets = new Map<number, boolean>();

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

  updateProgressBar(
    progress: number,
    _operations: number,
    progressBar: React.RefObject<HTMLDivElement>,
    operationsBar: React.RefObject<HTMLDivElement>
  ) {
    let el = progressBar.current;
    let _el = operationsBar.current;
    let operations = Math.trunc(_operations);
    requestAnimationFrame(() => {
      el.style.transform = `scaleX(${progress < 1 ? progress : 1})`;
      el = null;
      _el.textContent = formatLongDecimal(operations).toString();
    });
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
        this.updateProgressBar(
          1.0,
          this.snippetData[snippetIndex].hz,
          this.progressBarRefs[snippetIndex],
          this.opsRefs[snippetIndex]
        );
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
        this.updateProgressBar(
          value[3] / TEN_SECONDS,
          value[2],
          this.progressBarRefs[snippetIndex],
          this.opsRefs[snippetIndex]
        );

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
      const snippet = this.benchmark.snippets[i];

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
    this.updateProgressBar(
      0,
      0,
      this.progressBarRefs[currentSnippetIndex],
      this.opsRefs[currentSnippetIndex]
    );
    this.snippetIdMap.set(currentId, currentSnippetIndex);
    this.busyWorkers.set(worker, true);
    this.finishedSnippets.set(currentSnippetIndex, false);
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
    const finishedSnippets = this.snippetData.filter(Boolean);
    const fastest = filter(finishedSnippets, "fastest")[0];
    const slowest = filter(finishedSnippets, "slowest")[0];

    return {
      results: this.snippetData,
      fastest: this.snippetData.indexOf(fastest),
      slowest: this.snippetData.indexOf(slowest),
    };
  }

  finish(error) {
    if (error) {
      this.finishResolver = null;
      this.finishRejecter(error);
    } else {
      this.finishResolver(this.getResults());
      this.finishRejecter = null;
    }
  }
  cleanup() {
    for (let worker of this.workers) {
      worker.onmessage = null;
      worker.onerror = null;
      this.busyWorkers.delete(worker);
    }

    this.benchmark = this.workers = null;
    this.snippetIdMap.clear();
    this.finishedSnippets.clear();
    this.snippetData.length = 0;
  }

  onErrorEvent = (event: ErrorEvent) => {
    this.finish(event.error);
  };

  finishResolver = null;
  finishRejecter = null;
  workers: Worker[];
  busyWorkers = new WeakMap<Worker, boolean>();

  progressBarRefs = new Array<React.Ref<HTMLDivElement>>();
  opsRefs = new Array<React.Ref<HTMLDivElement>>();

  run(benchmark: Benchmark, workerPool: Worker[]) {
    this.benchmark = benchmark;
    this.workers = workerPool;
    this.snippetData.length = benchmark.snippets.length;
    this.snippetData.fill(null);

    return new Promise((resolve, reject) => {
      for (let worker of this.workers) {
        this.busyWorkers.set(worker, false);
        worker.onmessage = this.onMessageEvent;
        worker.onerror = this.onErrorEvent;
      }

      this.finishResolver = resolve;
      this.finishRejecter = reject;

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