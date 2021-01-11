export interface Stats {
  moe: number;
  rme: number;
  sem: number;
  deviation: number;
  mean: number;
  variance: number;
}

export interface Times {
  cycle: number;
  elapsed: number;
  period: number;
  timeStamp: number;
}

export interface SnippetResult {
  stats?: Stats;
  statsSamples?: number[];
  times?: Times;
  hz?: number;
  cycles?: number;
  error?: boolean;
}

export interface SnippetResultList {
  id?: string;
  userAgents?: string[];
  results?: SnippetResult[];
}

export interface BenchmarkResults {
  benchmarkId?: string;
  results?: SnippetResultList[];
}

export interface Schema {
  encodeStats(message: Stats): Uint8Array;
  decodeStats(buffer: Uint8Array): Stats;
  encodeTimes(message: Times): Uint8Array;
  decodeTimes(buffer: Uint8Array): Times;
  encodeSnippetResult(message: SnippetResult): Uint8Array;
  decodeSnippetResult(buffer: Uint8Array): SnippetResult;
  encodeSnippetResultList(message: SnippetResultList): Uint8Array;
  decodeSnippetResultList(buffer: Uint8Array): SnippetResultList;
  encodeBenchmarkResults(message: BenchmarkResults): Uint8Array;
  decodeBenchmarkResults(buffer: Uint8Array): BenchmarkResults;
}
