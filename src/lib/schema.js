var exports = exports || {};
exports.ByteBuffer = exports.ByteBuffer || require("kiwi-schema").ByteBuffer;

exports["decodeStats"] = function(bb) {
  var result = {};
  if (!(bb instanceof this.ByteBuffer)) {
    bb = new this.ByteBuffer(bb);
  }

  result["moe"] = bb.readVarFloat();
  result["rme"] = bb.readVarFloat();
  result["sem"] = bb.readVarFloat();
  result["deviation"] = bb.readVarFloat();
  result["mean"] = bb.readVarFloat();
  result["variance"] = bb.readVarFloat();
  return result;
};

exports["encodeStats"] = function(message, bb) {
  var isTopLevel = !bb;
  if (isTopLevel) bb = new this.ByteBuffer();

  var value = message["moe"];
  if (value != null) {
    bb.writeVarFloat(value);
  } else {
    throw new Error("Missing required field \"moe\"");
  }

  var value = message["rme"];
  if (value != null) {
    bb.writeVarFloat(value);
  } else {
    throw new Error("Missing required field \"rme\"");
  }

  var value = message["sem"];
  if (value != null) {
    bb.writeVarFloat(value);
  } else {
    throw new Error("Missing required field \"sem\"");
  }

  var value = message["deviation"];
  if (value != null) {
    bb.writeVarFloat(value);
  } else {
    throw new Error("Missing required field \"deviation\"");
  }

  var value = message["mean"];
  if (value != null) {
    bb.writeVarFloat(value);
  } else {
    throw new Error("Missing required field \"mean\"");
  }

  var value = message["variance"];
  if (value != null) {
    bb.writeVarFloat(value);
  } else {
    throw new Error("Missing required field \"variance\"");
  }

  if (isTopLevel) return bb.toUint8Array();
};

exports["decodeTimes"] = function(bb) {
  var result = {};
  if (!(bb instanceof this.ByteBuffer)) {
    bb = new this.ByteBuffer(bb);
  }

  result["cycle"] = bb.readVarFloat();
  result["elapsed"] = bb.readVarFloat();
  result["period"] = bb.readVarFloat();
  result["timeStamp"] = bb.readVarFloat();
  return result;
};

exports["encodeTimes"] = function(message, bb) {
  var isTopLevel = !bb;
  if (isTopLevel) bb = new this.ByteBuffer();

  var value = message["cycle"];
  if (value != null) {
    bb.writeVarFloat(value);
  } else {
    throw new Error("Missing required field \"cycle\"");
  }

  var value = message["elapsed"];
  if (value != null) {
    bb.writeVarFloat(value);
  } else {
    throw new Error("Missing required field \"elapsed\"");
  }

  var value = message["period"];
  if (value != null) {
    bb.writeVarFloat(value);
  } else {
    throw new Error("Missing required field \"period\"");
  }

  var value = message["timeStamp"];
  if (value != null) {
    bb.writeVarFloat(value);
  } else {
    throw new Error("Missing required field \"timeStamp\"");
  }

  if (isTopLevel) return bb.toUint8Array();
};

exports["decodeSnippetResult"] = function(bb) {
  var result = {};
  if (!(bb instanceof this.ByteBuffer)) {
    bb = new this.ByteBuffer(bb);
  }

  while (true) {
    switch (bb.readVarUint()) {
    case 0:
      return result;

    case 1:
      result["stats"] = this["decodeStats"](bb);
      break;

    case 2:
      var length = bb.readVarUint();
      var values = result["statsSamples"] = Array(length);
      for (var i = 0; i < length; i++) values[i] = bb.readVarFloat();
      break;

    case 3:
      result["times"] = this["decodeTimes"](bb);
      break;

    case 4:
      result["hz"] = bb.readVarFloat();
      break;

    case 5:
      result["cycles"] = bb.readVarUint();
      break;

    case 6:
      result["error"] = !!bb.readByte();
      break;

    default:
      throw new Error("Attempted to parse invalid message");
    }
  }
};

exports["encodeSnippetResult"] = function(message, bb) {
  var isTopLevel = !bb;
  if (isTopLevel) bb = new this.ByteBuffer();

  var value = message["stats"];
  if (value != null) {
    bb.writeVarUint(1);
    this["encodeStats"](value, bb);
  }

  var value = message["statsSamples"];
  if (value != null) {
    bb.writeVarUint(2);
    var values = value, n = values.length;
    bb.writeVarUint(n);
    for (var i = 0; i < n; i++) {
      value = values[i];
      bb.writeVarFloat(value);
    }
  }

  var value = message["times"];
  if (value != null) {
    bb.writeVarUint(3);
    this["encodeTimes"](value, bb);
  }

  var value = message["hz"];
  if (value != null) {
    bb.writeVarUint(4);
    bb.writeVarFloat(value);
  }

  var value = message["cycles"];
  if (value != null) {
    bb.writeVarUint(5);
    bb.writeVarUint(value);
  }

  var value = message["error"];
  if (value != null) {
    bb.writeVarUint(6);
    bb.writeByte(value);
  }
  bb.writeVarUint(0);

  if (isTopLevel) return bb.toUint8Array();
};

exports["decodeSnippetResultList"] = function(bb) {
  var result = {};
  if (!(bb instanceof this.ByteBuffer)) {
    bb = new this.ByteBuffer(bb);
  }

  while (true) {
    switch (bb.readVarUint()) {
    case 0:
      return result;

    case 1:
      result["id"] = bb.readString();
      break;

    case 2:
      var length = bb.readVarUint();
      var values = result["userAgents"] = Array(length);
      for (var i = 0; i < length; i++) values[i] = bb.readString();
      break;

    case 3:
      var length = bb.readVarUint();
      var values = result["results"] = Array(length);
      for (var i = 0; i < length; i++) values[i] = this["decodeSnippetResult"](bb);
      break;

    default:
      throw new Error("Attempted to parse invalid message");
    }
  }
};

exports["encodeSnippetResultList"] = function(message, bb) {
  var isTopLevel = !bb;
  if (isTopLevel) bb = new this.ByteBuffer();

  var value = message["id"];
  if (value != null) {
    bb.writeVarUint(1);
    bb.writeString(value);
  }

  var value = message["userAgents"];
  if (value != null) {
    bb.writeVarUint(2);
    var values = value, n = values.length;
    bb.writeVarUint(n);
    for (var i = 0; i < n; i++) {
      value = values[i];
      bb.writeString(value);
    }
  }

  var value = message["results"];
  if (value != null) {
    bb.writeVarUint(3);
    var values = value, n = values.length;
    bb.writeVarUint(n);
    for (var i = 0; i < n; i++) {
      value = values[i];
      this["encodeSnippetResult"](value, bb);
    }
  }
  bb.writeVarUint(0);

  if (isTopLevel) return bb.toUint8Array();
};

exports["decodeBenchmarkResults"] = function(bb) {
  var result = {};
  if (!(bb instanceof this.ByteBuffer)) {
    bb = new this.ByteBuffer(bb);
  }

  while (true) {
    switch (bb.readVarUint()) {
    case 0:
      return result;

    case 1:
      result["benchmarkId"] = bb.readString();
      break;

    case 2:
      var length = bb.readVarUint();
      var values = result["results"] = Array(length);
      for (var i = 0; i < length; i++) values[i] = this["decodeSnippetResultList"](bb);
      break;

    default:
      throw new Error("Attempted to parse invalid message");
    }
  }
};

exports["encodeBenchmarkResults"] = function(message, bb) {
  var isTopLevel = !bb;
  if (isTopLevel) bb = new this.ByteBuffer();

  var value = message["benchmarkId"];
  if (value != null) {
    bb.writeVarUint(1);
    bb.writeString(value);
  }

  var value = message["results"];
  if (value != null) {
    bb.writeVarUint(2);
    var values = value, n = values.length;
    bb.writeVarUint(n);
    for (var i = 0; i < n; i++) {
      value = values[i];
      this["encodeSnippetResultList"](value, bb);
    }
  }
  bb.writeVarUint(0);

  if (isTopLevel) return bb.toUint8Array();
};
