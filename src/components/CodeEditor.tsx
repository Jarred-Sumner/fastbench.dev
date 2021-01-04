import type { default as AceEditorType } from "react-ace";

let AceEditor: typeof AceEditorType;

if (typeof window === "undefined") {
  AceEditor = () => null;
} else {
  AceEditor = require("react-ace").default;
  globalThis.ace.define(
    "ace/theme/monokai",
    ["require", "exports", "module", "ace/lib/dom"],
    function (require, exports, module) {
      exports.isDark = true;
      exports.cssClass = "ace-monokai";
    }
  );
  require("ace-builds/src-noconflict/mode-javascript");
}

const options = {
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  enableSnippets: true,
  showLineNumbers: true,
  tabSize: 2,
};

const editorProps = {
  lineHeight: 1.2,
};

export const CodeEditor = ({
  defaultValue,
  onChange,
  onLoad,
  placeholder = "Start writing code",
  theme = "monokai",
}) => (
  <AceEditor
    placeholder={placeholder}
    mode="javascript"
    theme="monokai"
    name="blah2"
    onLoad={onLoad}
    onChange={onChange}
    fontSize={"1rem"}
    height={"200px"}
    showPrintMargin={true}
    showGutter={true}
    editorProps={editorProps}
    className={"CodeEditor"}
    width={"100%"}
    highlightActiveLine={true}
    defaultValue={defaultValue}
    setOptions={options}
  />
);