import Link from "next/link";
import { AsyncShareCard } from "src/components/AsyncShareCard";
import fixture from "src/components/fixture";
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "src/components/ShareCardDimensions";
import { getShareURL } from "src/components/ShareSheet";
import { LinkButton } from "../src/components/LinkButton";
import { PageHeader } from "../src/components/PageHeader";
import {
  CardColorScheme,
  Result,
  ResultCard,
} from "../src/components/ResultCard";

const ID_LIST = [
  "forEach-ozI4XL/0",
  "Arrayfilter-benchmarks-rozB5K/0",
  "Arraymap-cEAWT-/0",
  "Arrayreduce-c1oQkQ/0",
];

const defaultList = ID_LIST.map((_id) => {
  const [id, version] = _id.split("/");

  const src = getShareURL({ id, version });
  return (
    <Link key={src} href={src}>
      <a href={src}>
        <img
          src={src + ".svg"}
          width={SHARE_CARD_WIDTH}
          height={SHARE_CARD_HEIGHT}
        />
      </a>
    </Link>
  );
});

export default function Home() {
  return (
    <div className="Homepage Page">
      <PageHeader />

      <div className={"HeroContainer"}>
        <main className={"Hero"}>
          <h1 className={"Tagline"}>make the web a teeny bit faster.</h1>
          <p className={"Description"}>
            Test, compare, and optimize JavaScript performance. Share your
            results with the world for a better web.
          </p>
          <LinkButton href={"/benches/new"}>New benchmark</LinkButton>
        </main>
        <div className={"Hero-demo"}></div>
      </div>

      <div className={"Gallery"}>
        <div className={"GalleryList"}>{defaultList}</div>
      </div>
    </div>
  );
}
