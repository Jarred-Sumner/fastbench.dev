/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export function __wbg_layout_free(a: number): void;
export function __wbg_get_layout_width(a: number): number;
export function __wbg_get_layout_height(a: number): number;
export function __wbg_get_layout_x(a: number): number;
export function __wbg_get_layout_y(a: number): number;
export function __wbg_get_layout_childCount(a: number): number;
export function layout_child(a: number, b: number): number;
export function __wbg_allocator_free(a: number): void;
export function allocator_new(): number;
export function __wbg_node_free(a: number): void;
export function __wbg_get_node_childCount(a: number): number;
export function node_new(a: number, b: number): number;
export function node_setMeasure(a: number, b: number): void;
export function node_addChild(a: number, b: number): void;
export function node_removeChild(a: number, b: number): void;
export function node_replaceChildAtIndex(a: number, b: number, c: number): void;
export function node_removeChildAtIndex(a: number, b: number): void;
export function node_getStyle(a: number): number;
export function node_setStyle(a: number, b: number): void;
export function node_markDirty(a: number): void;
export function node_isDirty(a: number): number;
export function node_computeLayout(a: number, b: number): number;
export function __wbindgen_malloc(a: number): number;
export function __wbindgen_realloc(a: number, b: number, c: number): number;
export function __wbindgen_exn_store(a: number): void;
