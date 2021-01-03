import Link from "next/link";
import { useRouter } from "next/router";
import classNames from "classnames";

export const NavigationLink = ({ to, children, activePages }) => {
  const router = useRouter();
  return (
    <Link href={to}>
      <a
        className={classNames("NavigationLink", {
          "NavigationLink--active": activePages.includes(router.pathname),
          "NavigationLink--inactive": !activePages.includes(router.pathname),
        })}
        href={to}
      >
        {children}
      </a>
    </Link>
  );
};

export const Navigation = ({}) => {
  return (
    <nav className={"NavigationContainer"}>
      <NavigationLink activePages={["/", "/new"]} to={"/new"}>
        New
      </NavigationLink>
      <NavigationLink activePages={["/explore"]} to={"/explore"}>
        Explore
      </NavigationLink>
      <NavigationLink activePages={["/login"]} to={"/login"}>
        Login
      </NavigationLink>
    </nav>
  );
};