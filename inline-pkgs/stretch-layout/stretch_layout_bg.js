import * as wasm from './stretch_layout_bg.wasm';

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachegetFloat64Memory0 = null;
function getFloat64Memory0() {
    if (cachegetFloat64Memory0 === null || cachegetFloat64Memory0.buffer !== wasm.memory.buffer) {
        cachegetFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachegetFloat64Memory0;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
    if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory0;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}

let stack_pointer = 32;

function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack');
    heap[--stack_pointer] = obj;
    return stack_pointer;
}

function handleError(f) {
    return function () {
        try {
            return f.apply(this, arguments);

        } catch (e) {
            wasm.__wbindgen_exn_store(addHeapObject(e));
        }
    };
}
/**
*/
export const AlignItems = Object.freeze({ FlexStart:0,"0":"FlexStart",FlexEnd:1,"1":"FlexEnd",Center:2,"2":"Center",Baseline:3,"3":"Baseline",Stretch:4,"4":"Stretch", });
/**
*/
export const AlignSelf = Object.freeze({ Auto:0,"0":"Auto",FlexStart:1,"1":"FlexStart",FlexEnd:2,"2":"FlexEnd",Center:3,"3":"Center",Baseline:4,"4":"Baseline",Stretch:5,"5":"Stretch", });
/**
*/
export const AlignContent = Object.freeze({ FlexStart:0,"0":"FlexStart",FlexEnd:1,"1":"FlexEnd",Center:2,"2":"Center",Stretch:3,"3":"Stretch",SpaceBetween:4,"4":"SpaceBetween",SpaceAround:5,"5":"SpaceAround", });
/**
*/
export const Direction = Object.freeze({ Inherit:0,"0":"Inherit",LTR:1,"1":"LTR",RTL:2,"2":"RTL", });
/**
*/
export const Display = Object.freeze({ Flex:0,"0":"Flex",None:1,"1":"None", });
/**
*/
export const FlexDirection = Object.freeze({ Row:0,"0":"Row",Column:1,"1":"Column",RowReverse:2,"2":"RowReverse",ColumnReverse:3,"3":"ColumnReverse", });
/**
*/
export const JustifyContent = Object.freeze({ FlexStart:0,"0":"FlexStart",FlexEnd:1,"1":"FlexEnd",Center:2,"2":"Center",SpaceBetween:3,"3":"SpaceBetween",SpaceAround:4,"4":"SpaceAround",SpaceEvenly:5,"5":"SpaceEvenly", });
/**
*/
export const Overflow = Object.freeze({ Visible:0,"0":"Visible",Hidden:1,"1":"Hidden",Scroll:2,"2":"Scroll", });
/**
*/
export const PositionType = Object.freeze({ Relative:0,"0":"Relative",Absolute:1,"1":"Absolute", });
/**
*/
export const FlexWrap = Object.freeze({ NoWrap:0,"0":"NoWrap",Wrap:1,"1":"Wrap",WrapReverse:2,"2":"WrapReverse", });
/**
*/
export class Allocator {

    static __wrap(ptr) {
        const obj = Object.create(Allocator.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_allocator_free(ptr);
    }
    /**
    */
    constructor() {
        var ret = wasm.allocator_new();
        return Allocator.__wrap(ret);
    }
}
/**
*/
export class Layout {

    static __wrap(ptr) {
        const obj = Object.create(Layout.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_layout_free(ptr);
    }
    /**
    * @returns {number}
    */
    get width() {
        var ret = wasm.__wbg_get_layout_width(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    get height() {
        var ret = wasm.__wbg_get_layout_height(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    get x() {
        var ret = wasm.__wbg_get_layout_x(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    get y() {
        var ret = wasm.__wbg_get_layout_y(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    get childCount() {
        var ret = wasm.__wbg_get_layout_childCount(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} at
    * @returns {Layout}
    */
    child(at) {
        var ret = wasm.layout_child(this.ptr, at);
        return Layout.__wrap(ret);
    }
}
/**
*/
export class Node {

    static __wrap(ptr) {
        const obj = Object.create(Node.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_node_free(ptr);
    }
    /**
    * @returns {number}
    */
    get childCount() {
        var ret = wasm.__wbg_get_node_childCount(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {Allocator} allocator
    * @param {any} style
    */
    constructor(allocator, style) {
        try {
            _assertClass(allocator, Allocator);
            var ret = wasm.node_new(allocator.ptr, addBorrowedObject(style));
            return Node.__wrap(ret);
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }
    /**
    * @param {any} measure
    */
    setMeasure(measure) {
        try {
            wasm.node_setMeasure(this.ptr, addBorrowedObject(measure));
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }
    /**
    * @param {Node} child
    */
    addChild(child) {
        _assertClass(child, Node);
        wasm.node_addChild(this.ptr, child.ptr);
    }
    /**
    * @param {Node} child
    */
    removeChild(child) {
        _assertClass(child, Node);
        wasm.node_removeChild(this.ptr, child.ptr);
    }
    /**
    * @param {number} index
    * @param {Node} child
    */
    replaceChildAtIndex(index, child) {
        _assertClass(child, Node);
        wasm.node_replaceChildAtIndex(this.ptr, index, child.ptr);
    }
    /**
    * @param {number} index
    */
    removeChildAtIndex(index) {
        wasm.node_removeChildAtIndex(this.ptr, index);
    }
    /**
    * @returns {any}
    */
    getStyle() {
        var ret = wasm.node_getStyle(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {any} style
    */
    setStyle(style) {
        try {
            wasm.node_setStyle(this.ptr, addBorrowedObject(style));
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }
    /**
    */
    markDirty() {
        wasm.node_markDirty(this.ptr);
    }
    /**
    * @returns {boolean}
    */
    isDirty() {
        var ret = wasm.node_isDirty(this.ptr);
        return ret !== 0;
    }
    /**
    * @param {any} size
    * @returns {Layout}
    */
    computeLayout(size) {
        try {
            var ret = wasm.node_computeLayout(this.ptr, addBorrowedObject(size));
            return Layout.__wrap(ret);
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }
}

export const __wbindgen_object_drop_ref = function(arg0) {
    takeObject(arg0);
};

export const __wbindgen_string_new = function(arg0, arg1) {
    var ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export const __wbindgen_object_clone_ref = function(arg0) {
    var ret = getObject(arg0);
    return addHeapObject(ret);
};

export const __wbindgen_number_new = function(arg0) {
    var ret = arg0;
    return addHeapObject(ret);
};

export const __wbg_call_f9e90601fa9f7222 = handleError(function(arg0, arg1, arg2, arg3) {
    var ret = getObject(arg0).call(getObject(arg1), getObject(arg2), getObject(arg3));
    return addHeapObject(ret);
});

export const __wbg_get_85e0a3b459845fe2 = handleError(function(arg0, arg1) {
    var ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
});

export const __wbg_has_91d9c72d16fd917c = handleError(function(arg0, arg1) {
    var ret = Reflect.has(getObject(arg0), getObject(arg1));
    return ret;
});

export const __wbindgen_number_get = function(arg0, arg1) {
    const obj = getObject(arg1);
    var ret = typeof(obj) === 'number' ? obj : undefined;
    getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
};

export const __wbindgen_string_get = function(arg0, arg1) {
    const obj = getObject(arg1);
    var ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export const __wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

