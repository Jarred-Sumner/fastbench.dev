import classNames from "classnames";
import { CodeEditor } from "./CodeEditor";
import * as React from "react";
import { formatDecimal } from "./ResultCard";

const SnippetTitle = ({ title, onChange, placeholder, disabled, icon }) => {
  return (
    <div className="SnippetTitleContainer">
      {icon}
      <input
        type={"text"}
        name={"snippet-title"}
        autoCapitalize={"off"}
        autoCorrect={"off"}
        autoFocus={false}
        placeholder={placeholder}
        disabled={disabled}
        className={"SnippetTitle"}
        defaultValue={title}
        onInput={onChange}
      />
    </div>
  );
};

const SnippetBackground = React.forwardRef(({ onProgressUpdate }, ref) => {
  return <div ref={ref} className={"SnippetBackground"}></div>;
});

const OpsLabel = React.forwardRef(({ ops }, ref) => (
  <span ref={ref} className={"SnippetOverlayLabel-ops"}>
    {formatDecimal(ops || 0)}
  </span>
));

const SnippetOverlay = React.forwardRef(({ rank, ops }, ref) => {
  return (
    <div className={"SnippetOverlay"}>
      <div className={"SnippetOverlayLabel"}>
        <OpsLabel ref={ref} ops={ops} />
        <span className={"SnippetOverlayLabel-unit"}> ops/s</span>
      </div>

      <div className={"SnippetOverlay-Rank"}>{rank}</div>
    </div>
  );
});

export const SnippetContainer = ({
  onSave,
  title,
  icon,
  placeholder,
  onChangeTitle: _onChangeTitle,
  disableTitle,
  isCollapsed = false,
  onChangeCollapse,
  onBlur,
  onFocus,
  focusedId,
  id,
  codePlaceholder,
  code,
  onChangeCode: _onChangeCode,
  progressUpdateRef,

  rank,
  ops,
  isRunning = false,
  overlayRef,
}) => {
  const onChangeCode = React.useCallback(
    (event) => {
      _onChangeCode(event, id);
    },
    [_onChangeCode, id]
  );

  const onChangeTitle = React.useCallback(
    (event: React.SyntheticEvent<InputEvent>) => {
      _onChangeTitle(event.target.value, id);
    },
    [_onChangeTitle, id]
  );
  return (
    <div
      onClick={onChangeCollapse}
      className={classNames("SnippetContainer", {
        "SnippetContainer--collapsed": isCollapsed,
        "SnippetContainer--focused": id === focusedId,
        "SnippetContainer--visible": !isCollapsed,
        "SnippetContainer--isRunning": isRunning,
      })}
    >
      <SnippetBackground ref={progressUpdateRef} />

      <SnippetTitle
        title={title}
        onChange={onChangeTitle}
        disabled={disableTitle}
        placeholder={placeholder}
        icon={icon}
      />

      {!isCollapsed && (
        <CodeEditor
          defaultValue={code}
          onChange={onChangeCode}
          placeholder={codePlaceholder}
        />
      )}

      {isRunning && <SnippetOverlay ref={overlayRef} rank={rank} ops={ops} />}
    </div>
  );
};