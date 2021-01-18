/* tslint:disable */
/* eslint-disable */
/**
*/
export enum AlignItems {
  FlexStart,
  FlexEnd,
  Center,
  Baseline,
  Stretch,
}
/**
*/
export enum AlignSelf {
  Auto,
  FlexStart,
  FlexEnd,
  Center,
  Baseline,
  Stretch,
}
/**
*/
export enum AlignContent {
  FlexStart,
  FlexEnd,
  Center,
  Stretch,
  SpaceBetween,
  SpaceAround,
}
/**
*/
export enum Direction {
  Inherit,
  LTR,
  RTL,
}
/**
*/
export enum Display {
  Flex,
  None,
}
/**
*/
export enum FlexDirection {
  Row,
  Column,
  RowReverse,
  ColumnReverse,
}
/**
*/
export enum JustifyContent {
  FlexStart,
  FlexEnd,
  Center,
  SpaceBetween,
  SpaceAround,
  SpaceEvenly,
}
/**
*/
export enum Overflow {
  Visible,
  Hidden,
  Scroll,
}
/**
*/
export enum PositionType {
  Relative,
  Absolute,
}
/**
*/
export enum FlexWrap {
  NoWrap,
  Wrap,
  WrapReverse,
}
/**
*/
export class Allocator {
  free(): void;
/**
*/
  constructor();
}
/**
*/
export class Layout {
  free(): void;
/**
* @param {number} at
* @returns {Layout}
*/
  child(at: number): Layout;
/**
* @returns {number}
*/
  readonly childCount: number;
/**
* @returns {number}
*/
  readonly height: number;
/**
* @returns {number}
*/
  readonly width: number;
/**
* @returns {number}
*/
  readonly x: number;
/**
* @returns {number}
*/
  readonly y: number;
}
/**
*/
export class Node {
  free(): void;
/**
* @param {Allocator} allocator
* @param {any} style
*/
  constructor(allocator: Allocator, style: any);
/**
* @param {any} measure
*/
  setMeasure(measure: any): void;
/**
* @param {Node} child
*/
  addChild(child: Node): void;
/**
* @param {Node} child
*/
  removeChild(child: Node): void;
/**
* @param {number} index
* @param {Node} child
*/
  replaceChildAtIndex(index: number, child: Node): void;
/**
* @param {number} index
*/
  removeChildAtIndex(index: number): void;
/**
* @returns {any}
*/
  getStyle(): any;
/**
* @param {any} style
*/
  setStyle(style: any): void;
/**
*/
  markDirty(): void;
/**
* @returns {boolean}
*/
  isDirty(): boolean;
/**
* @param {any} size
* @returns {Layout}
*/
  computeLayout(size: any): Layout;
/**
* @returns {number}
*/
  readonly childCount: number;
}
