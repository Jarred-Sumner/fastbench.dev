import classNames from "classnames";
import { CodeEditor } from "./CodeEditor";
import * as React from "react";
import { formatDecimal, formatLongDecimal, Result } from "./ResultCard";
import { ModulePicker } from "src/components/ModulePicker";
import { camelCase } from "lodash";
import { TransformType } from "src/lib/Benchmark";

const SnippetTitle = ({
  title,
  onChange,
  placeholder,
  disabled,
  icon,
  onDelete,
  showImportModal,
  onPickImport,
  onShowImportModal,
  onCloseImportModal,
  setTransform,
  transform,
}) => {
  return (
    <div className="SnippetTitleContainer">
      <div className="SnippetHeadingIcon">{icon}</div>
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

      {onDelete && (
        <div onClick={onDelete} className="SnippetTitle-deleteButton">
          DELETE
        </div>
      )}

      {onShowImportModal && (
        <SharedHeadingToolbar
          showImportModal={showImportModal}
          transform={transform}
          setTransform={setTransform}
          onShowImportModal={onShowImportModal}
          onCloseImportModal={onCloseImportModal}
          onPickImport={onPickImport}
        />
      )}
    </div>
  );
};

const SharedHeadingToolbar = ({
  showImportModal,
  transform,
  setTransform,
  onShowImportModal,
  onCloseImportModal,
  onPickImport,
}) => {
  const checkbox = React.useRef<HTMLInputElement>();
  const setChecked = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = checkbox.current.checked
        ? TransformType.none
        : TransformType.jsx;
      setTransform(newValue);
      event.stopPropagation();
    },
    [setTransform]
  );

  const toggleTransform = React.useCallback(
    (event: React.MouseEvent<HTMLInputElement>) => {
      const newValue =
        transform === TransformType.none
          ? TransformType.jsx
          : TransformType.none;
      setTransform(newValue);
    },
    [setTransform, transform, checkbox]
  );
  const checked = transform === TransformType.jsx;
  return (
    <div className="SnippetTitle-importButtonContainer">
      <div
        onClick={toggleTransform}
        className={classNames("SnippetTitle-transformField", {
          "SnippetTitle-transformField--checked": checked,
          "SnippetTitle-transformField--unchecked": !checked,
        })}
      >
        <div className="Toggler" name="Toggler" />
        <label htmlFor="Toggler" className="SnippetTitle-transformField-label">
          Use React
        </label>
      </div>

      <div onClick={onShowImportModal} className="SnippetTitle-importButton">
        IMPORT
      </div>

      {showImportModal && (
        <ModulePicker onClose={onCloseImportModal} onPick={onPickImport} />
      )}
    </div>
  );
};

const SnippetHeading = ({
  icon,
  title,
  result,
  baseline,
  onChange,
  onDelete,
  showImportModal,
  transform,
  setTransform,
  onShowImportModal,
  onCloseImportModal,
  onPickImport,
}: {
  icon: React.ReactNode;
  title: string;
  result: Result;
}) => {
  let ops = result?.operationsPerSecond ?? 0;
  ops = ops > 1000 ? Math.trunc(ops) : ops;

  return (
    <div
      className={classNames("SnippetTitleContainer SnippetHeading", {
        "SnippetHeading--first": result?.rank === 1,
        "SnippetHeading--notFirst": result?.rank !== 1,
      })}
    >
      <div className="SnippetHeadingIcon">{icon}</div>
      <input
        type={"text"}
        name={"snippet-title"}
        autoCapitalize={"off"}
        autoCorrect={"off"}
        autoFocus={false}
        className={"SnippetTitle"}
        defaultValue={title}
        onInput={onChange}
      />

      {onDelete && (
        <div onClick={onDelete} className="SnippetTitle-deleteButton">
          DELETE
        </div>
      )}

      {onShowImportModal && (
        <SharedHeadingToolbar
          showImportModal={showImportModal}
          transform={transform}
          setTransform={setTransform}
          onShowImportModal={onShowImportModal}
          onCloseImportModal={onCloseImportModal}
          onPickImport={onPickImport}
        />
      )}

      <div className="SnippetHeading-subheader">
        <div className="SnippetHeading-ops">{formatLongDecimal(ops)}</div>
        <div className="SnippetHeading-opsLabel">OPS/S</div>
        <span className="SnipptHeading-Dot">&middot;</span>
        <div className="SnippetHeading-multiplier">
          {formatDecimal(result?.multiplier ?? 0, 1)}
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
        <OpsLabel ref={ref} ops={result?.operationsPerSecond ?? 10000} />
        <span className={"SnippetOverlayLabel-unit"}> ops/s</span>
      </div>
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
  onDelete,
  transform,
  setTransform,

  runState,
  onChangeTitle: _onChangeTitle,
  disableTitle,
  isCollapsed = false,
  error,
  onChangeCollapse,
  onBlur,
  onFocus,
  focusedId,
  showImportModal,
  setShowImportModal,
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

  const _onDelete = React.useCallback(() => {
    onDelete && onDelete(id);
  }, [onDelete, id]);

  const onShowImportModal = React.useCallback(() => {
    setShowImportModal(true);
  }, [setShowImportModal]);

  const onCloseImportModal = React.useCallback(() => {
    setShowImportModal(false);
  }, [setShowImportModal]);

  const onPickImport = React.useCallback(
    (name, importUrl) => {
      onChangeCode(`import ${camelCase(name)} from "${importUrl}";\n` + code);
      setShowImportModal(false);
    },
    [onChangeCode, code, camelCase]
  );

  const defaultCode = React.useRef<string>(code);

  return (
    <div
      onClick={onChangeCollapse}
      className={classNames("SnippetContainer", {
        "SnippetContainer--collapsed": isCollapsed,
        "SnippetContainer--focused": id === focusedId,
        "SnippetContainer--visible": !isCollapsed,
        "SnippetContainer--isRunning": runState === SnippetRunState.running,
        "SnippetContainer--ran": runState === SnippetRunState.ran,
        "SnippetContainer--unposition": !disableTitle && showImportModal,
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
          transform={transform}
          setTransform={setTransform}
          result={result}
          onDelete={!disableTitle && onDelete ? _onDelete : null}
          onPickImport={disableTitle ? onPickImport : null}
          showImportModal={disableTitle ? showImportModal : null}
          onShowImportModal={disableTitle ? onShowImportModal : null}
          onCloseImportModal={disableTitle ? onCloseImportModal : null}
        />
      ) : (
        <SnippetTitle
          title={title}
          onChange={onChangeTitle}
          disabled={disableTitle}
          placeholder={placeholder}
          icon={icon}
          transform={transform}
          setTransform={setTransform}
          onDelete={!disableTitle && onDelete ? _onDelete : null}
          onPickImport={disableTitle ? onPickImport : null}
          showImportModal={disableTitle ? showImportModal : null}
          onShowImportModal={disableTitle ? onShowImportModal : null}
          onCloseImportModal={disableTitle ? onCloseImportModal : null}
        />
      )}

      {!isCollapsed && (
        <CodeEditor
          defaultValue={defaultCode.current}
          onChange={onChangeCode}
          key={`runState-${runState}`}
          placeholder={codePlaceholder}
        />
      )}

      {showError && error && error.message && (
        <div className="SnippetContainer-ErrorTitle">
          {error.message}

          <div onClick={hideError} className="SnippetContainer-ErrorClose">
            CLOSE
          </div>
        </div>
      )}

      {runState === SnippetRunState.running && (
        <SnippetOverlay ref={overlayRef} result={result} />
      )}
    </div>
  );
};
