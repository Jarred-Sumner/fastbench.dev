import classNames from "classnames";
import { CodeEditor } from "./CodeEditor";
import * as React from "react";
import { formatDecimal, formatLongDecimal, Result } from "./ResultCard";

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

const SnippetHeading = ({
  icon,
  title,
  result,
}: {
  icon: React.ReactNode;
  title: string;
  result: Result;
}) => {
  let ops = result.operationsPerSecond ?? 0;
  ops = ops > 1000 ? Math.trunc(ops) : ops;

  return (
    <div
      className={classNames("SnippetTitleContainer SnippetHeading", {
        "SnippetHeading--first": result?.rank === 1,
        "SnippetHeading--notFirst": result?.rank !== 1,
      })}
    >
      {icon}
      <input
        type={"text"}
        name={"snippet-title"}
        autoCapitalize={"off"}
        autoCorrect={"off"}
        autoFocus={false}
        readOnly
        disabled
        className={"SnippetTitle"}
        value={title}
      />

      <div className="SnippetHeading-subheader">
        <div className="SnippetHeading-ops">{formatLongDecimal(ops)}</div>
        <div className="SnippetHeading-opsLabel">OPS/S</div>
        <span className="SnipptHeading-Dot">&middot;</span>
        <div className="SnippetHeading-multiplier">
          {formatDecimal(result?.multiplier ?? 0, 2)}
          <span className="xIcon">x</span>
        </div>
      </div>
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

const SnippetOverlay = React.forwardRef(({ result }, ref) => {
  return (
    <div className={"SnippetOverlay"}>
      <div className={"SnippetOverlayLabel"}>
        <OpsLabel ref={ref} ops={result?.operationsPerSecond} />
        <span className={"SnippetOverlayLabel-unit"}> ops/s</span>
      </div>

      <div className={"SnippetOverlay-Rank"}>{result?.rank}</div>
    </div>
  );
});

export enum SnippetRunState {
  pending,
  running,
  ran,
}

const DEFAULT_ERROR = { name: "TypeError constructor is not defined " };

export const SnippetContainer = ({
  onSave,
  title,
  icon,
  placeholder,
  runState,
  onChangeTitle: _onChangeTitle,
  disableTitle,
  isCollapsed = false,
  error,
  onChangeCollapse,
  onBlur,
  onFocus,
  focusedId,
  id,
  codePlaceholder,
  code,
  onChangeCode: _onChangeCode,
  progressUpdateRef,
  result,
  overlayRef,
}) => {
  const disableError = React.useRef(false);
  const [showError, setShowError] = React.useState(false);
  React.useEffect(() => {
    disableError.current = false;
  }, [disableError, error]);
  React.useEffect(() => {
    setShowError(() => {
      if (error && !disableError.current) {
        return true;
      } else {
        return false;
      }
    });
  }, [setShowError, error, disableError]);
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

  const hideError = React.useCallback(() => {
    disableError.current = true;
    setShowError(false);
  }, [setShowError, disableError]);

  return (
    <div
      onClick={onChangeCollapse}
      className={classNames("SnippetContainer", {
        "SnippetContainer--collapsed": isCollapsed,
        "SnippetContainer--focused": id === focusedId,
        "SnippetContainer--visible": !isCollapsed,
        "SnippetContainer--isRunning": runState === SnippetRunState.running,
        "SnippetContainer--ran": runState === SnippetRunState.ran,
      })}
    >
      <SnippetBackground ref={progressUpdateRef} />

      {runState === SnippetRunState.ran ? (
        <SnippetHeading
          title={title}
          onChange={onChangeTitle}
          disabled={disableTitle}
          placeholder={placeholder}
          icon={icon}
          result={result}
        />
      ) : (
        <SnippetTitle
          title={title}
          onChange={onChangeTitle}
          disabled={disableTitle}
          placeholder={placeholder}
          icon={icon}
        />
      )}

      {!isCollapsed && (
        <CodeEditor
          defaultValue={code}
          onChange={onChangeCode}
          placeholder={codePlaceholder}
        />
      )}

      {showError && error && error.message && (
        <div className="SnippetContainer-ErrorTitle">
          {error.message}

          <div onClick={hideError} className="SnippetContainer-ErrorClose">
            X
          </div>
        </div>
      )}

      {runState === SnippetRunState.running && (
        <SnippetOverlay ref={overlayRef} result={result} />
      )}
    </div>
  );
};
