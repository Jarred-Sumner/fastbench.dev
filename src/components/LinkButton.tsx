import Link from "next/link";
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

export const FakeLinkButton = ({ children, onClick, disabled = false }) => {
  return (
    <div onClick={onClick} disabled={disabled} className="LinkButton">
      <span className={"LinkButton-text"}>{children}</span>

      <Arrow className={"LinkButton-arrow"} />
    </div>
  );
};