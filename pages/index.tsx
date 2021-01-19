import { AsyncShareCard } from "src/components/AsyncShareCard";
import fixture from "src/components/fixture";
import { LinkButton } from "../src/components/LinkButton";
import { PageHeader } from "../src/components/PageHeader";
import {
  CardColorScheme,
  Result,
  ResultCard,
} from "../src/components/ResultCard";

const SAMPLE_DATA: Result[][] = [
  [
    { id: "0", name: "[].forEach", operationsPerSecond: 800 },
    { id: "1", name: "for of", operationsPerSecond: 1000 },
    { id: "2", name: "_.forEach", operationsPerSecond: 600 },
  ],
  [
    { id: "0", name: `"".substring`, operationsPerSecond: 400 },
    { id: "1", name: '"".substr', operationsPerSecond: 500 },
    { id: "2", name: '"".slice', operationsPerSecond: 600 },
  ],
];

export default function Home() {
  return (
    <div className="Homepage Page">
      <PageHeader />

      <div className={"HeroContainer"}>
        <main className={"Hero"}>
          <h1 className={"Tagline"}>make the web a teeny bit faster.</h1>
          <p className={"Description"}>
            Test, compare, and optimize JavaScript performance. Share your
            results with the world for a better web. TODO: improve copy.
          </p>
          <LinkButton href={"/benches/new"}>New benchmark</LinkButton>
        </main>
        <div className={"Hero-demo"}></div>
      </div>

      <div className={"Gallery"}>
        <div className={"GalleryList"}></div>
      </div>
    </div>
  );
}
