import type { default as AceEditorType } from "react-ace";
import * as React from "react";

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

const zeorArray = [0, 0];
const options = {
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  enableSnippets: true,
  showLineNumbers: true,
  tabSize: 2,
  useWorker: false,
};

const editorProps = {
  lineHeight: 1.2,
};

export const CodeEditor = React.memo(
  ({
    defaultValue,
    onChange,
    onLoad: _onLoad,
    placeholder = "Start writing code",
    theme = "monokai",
    defaultHeight = 150,
  }) => {
    const [height, _setHeight] = React.useState(defaultHeight);
    const aceEditorRef = React.useRef();
    const setHeight = React.useCallback(
      (height) => {
        _setHeight(Math.max(height, defaultHeight));
      },
      [_setHeight, defaultHeight]
    );

    const onLoad = React.useCallback(
      (editor) => {
        if (_onLoad) {
          _onLoad(editor);
        }

        setHeight(
          editor.getSession().getScreenLength() * editor.renderer.lineHeight +
            editor.renderer.scrollBar.getWidth()
        );

        editor.on("change", (arg, activeEditor) => {
          const aceEditor = activeEditor;
          aceEditorRef.current = activeEditor;

          setHeight(
            editor.getSession().getScreenLength() * editor.renderer.lineHeight +
              editor.renderer.scrollBar.getWidth()
          );
          // }
        });
      },
      [_onLoad, setHeight, defaultHeight, aceEditorRef]
    );

    const styleProp = React.useMemo(() => ({ height }), [height]);

    React.useLayoutEffect(() => {
      if (aceEditorRef.current) {
        aceEditorRef.current.resize();
      }
    }, [height, aceEditorRef]);

    return (
      <div style={styleProp} className={"CodeContainer"}>
        <AceEditor
          placeholder={placeholder}
          mode="javascript"
          theme="monokai"
          name="blah2"
          onLoad={onLoad}
          onChange={onChange}
          scrollMargin={zeorArray}
          fontSize={"1rem"}
          height="inherit"
          showPrintMargin={true}
          wrapEnabled
          maxLines={Infinity}
          showGutter={true}
          editorProps={editorProps}
          className={"CodeEditor"}
          width={"100%"}
          highlightActiveLine={true}
          defaultValue={defaultValue}
          setOptions={options}
        />
      </div>
    );
  }
);
