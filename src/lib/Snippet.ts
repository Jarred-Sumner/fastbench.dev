import filenamify from "filenamify";
export enum SnippetType {
  shared,
  code,
}

export class Snippet {
  constructor(
    id: string = null,
    code: string = "",
    name: string = "",
    type: SnippetType,
    error: Error = null
  ) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.type = type;
    this.error = error;
  }
  error: Error;
  id: string | null;
  code: string;
  name: string;
  type: SnippetType;

  get isEmpty() {
    return this.code.trim().length === 0;
  }

  hasCode() {
    return (this.code?.trim()?.length ?? 0) > 0;
  }

  static hasCode(snippet: Snippet) {
    return snippet.hasCode();
  }
  static toJSON(snippet: Snippet) {
    return snippet.toJSON();
  }

  get filename() {
    switch (this.type) {
      case SnippetType.shared:
        return "shared.js";
      case SnippetType.code:
        return filenamify(this.name.replace(/\./gm, "") + ".js");
      default:
        throw Error("Invalid type in Snippet");
    }
  }

  asFile() {
    return {
      content: atob(this.code),
      path: this.filename,
    };
  }

  static fromJSON({ id, code, name, type }) {
    return new Snippet(id, code, name, type);
  }

  toJSON() {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      type: this.type,
    };
  }

  static shared(code: string = "") {
    return new Snippet(
      Math.random().toString(16),
      code,
      "shared",
      SnippetType.shared
    );
  }

  static create(code: string = "", name: string = "") {
    return new Snippet(
      Math.random().toString(16),
      code,
      name,
      SnippetType.code
    );
  }
}
