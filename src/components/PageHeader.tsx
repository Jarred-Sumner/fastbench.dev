import { Logo } from "./Logo";
import { Navigation } from "./Navigation";
import Link from "next/link";

export const PageHeader = () => (
  <header className={"LandingHeader"}>
    <Link href={"/"}>
      <a href={"/"}>
        <Logo />
      </a>
    </Link>

    <Navigation />
  </header>
);