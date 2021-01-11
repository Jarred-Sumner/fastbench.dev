import classNames from "classnames";
import Link from "next/link";

export const TitleInput = ({
  defaultValue,
  placeholder,
  onInput,
  readOnly = false,
  href,
}) => {
  const ContainerType = readOnly ? "a" : "div";

  const content = (
    <input
      name={"title"}
      autoCapitalize="autoCapitalize"
      autoComplete={"off"}
      autoCorrect={"on"}
      className={"TitleInput"}
      placeholder={placeholder}
      autoFocus
      type={"text"}
      defaultValue={defaultValue}
      value={readOnly ? defaultValue : undefined}
      readOnly={readOnly}
      onInput={onInput}
    />
  );

  const className = classNames("TitleInput-container", {
    "TitleInput-container--readOnly": readOnly,
    "TitleInput-container--readWrite": !readOnly,
  });

  if (readOnly) {
    return (
      <Link href={href}>
        <a href={href} className={className}>
          {content}
        </a>
      </Link>
    );
  } else {
    return <div className={className}>{content}</div>;
  }
};
