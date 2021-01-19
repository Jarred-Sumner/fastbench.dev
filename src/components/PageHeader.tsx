import { Logo } from "./Logo";
import { Navigation } from "./Navigation";
import Link from "next/link";

export const PageHeader = ({ children = null }) => (
  <div className="LandingHeader-Container">
    <header className={"LandingHeader"}>
      <Link href={"/"}>
        <a href={"/"}>
          <Logo />
        </a>
      </Link>

      <Navigation />
    </header>
    {children}
  </div>
);
