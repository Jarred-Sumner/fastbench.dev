export enum MessageType {
  start = 0,
  stop = 1,
  complete = 2,
  error = 4,
  statusUpdate = 3,
  cycle = 5,
  progressUpdate = 6,
}

export enum ErrorType {
  syntaxError = 0,
  runtimeError = 1,
}

export enum StatusMessageType {
  aboutToStart = 0,
  ranPrepare = 1,
  ran = 2,
}