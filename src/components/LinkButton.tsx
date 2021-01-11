import Link from "next/link";
import classNames from "classnames";
import { Arrow } from "./Arrow";

export const LinkButton = ({ children, href, disabled = false }) => {
  return (
    <Link href={href}>
      <a disabled={disabled} className="LinkButton" href={href}>
        <span className={"LinkButton-text"}>{children}</span>

        <Arrow className={"LinkButton-arrow"} />
      </a>
    </Link>
  );
};

export const FakeLinkButton = ({
  children,
  gray = false,
  onClick,
  disabled = false,
}) => {
  return (
    <div
      onClick={onClick}
      disabled={disabled}
      className={classNames("LinkButton", {
        "LinkButton--gray": gray,
      })}
    >
      <span className={"LinkButton-text"}>{children}</span>

      <Arrow className={"LinkButton-arrow"} />
    </div>
  );
};
