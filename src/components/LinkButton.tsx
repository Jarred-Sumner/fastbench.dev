import Link from "next/link";
import { Arrow } from "./Arrow";

export const LinkButton = ({ children, href }) => {
  return (
    <Link href={href}>
      <a className="LinkButton" href={href}>
        <span className={"LinkButton-text"}>{children}</span>

        <Arrow className={"LinkButton-arrow"} />
      </a>
    </Link>
  );
};