import classNames from "classnames";
import { CodeEditor } from "./CodeEditor";

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

export const SnippetContainer = ({
  onSave,
  title,
  icon,
  placeholder,
  onChangeTitle,
  disableTitle,
  isCollapsed = false,
  onChangeCollapse,
  onBlur,
  onFocus,
  focusedId,
  id,
  codePlaceholder,
  code,
  onChangeCode,
}) => {
  return (
    <div
      onClick={onChangeCollapse}
      className={classNames("SnippetContainer", {
        "SnippetContainer--collapsed": isCollapsed,
        "SnippetContainer--focused": id === focusedId,
        "SnippetContainer--visible": !isCollapsed,
      })}
    >
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
    </div>
  );
};