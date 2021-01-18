import fs from "fs";
import path from "path";
import SpaceMonoRegular from "src/fonts/Space_Mono/SpaceMono-Regular.ttf";
import IBMPlexSansRegular from "src/fonts/IBM_Plex_Sans/IBMPlexSans-Regular.ttf";
import IBMPlexSansBold from "src/fonts/IBM_Plex_Sans/IBMPlexSans-Bold.ttf";
import SpaceMonoBold from "src/fonts/Space_Mono/SpaceMono-Bold.ttf";

export default [
  {
    family: "Space Mono",
    style: "normal",
    weight: "normal",
    src: fs.readFileSync(
      path.resolve(process.cwd(), ".next/server", SpaceMonoRegular)
      // "binary"
    ),
  },

  {
    family: "IBM Plex Sans",
    style: "normal",
    weight: "normal",
    src: fs.readFileSync(
      path.resolve(process.cwd(), ".next/server", IBMPlexSansRegular)
      // "binary"
    ),
  },

  /* latin */
  {
    family: "IBM Plex Sans",
    style: "normal",
    weight: "bold",
    src: fs.readFileSync(
      path.resolve(process.cwd(), ".next/server", IBMPlexSansBold)
      // "binary"
    ),
  },
  {
    family: "Space Mono",
    style: "normal",
    weight: "bold",
    src: fs.readFileSync(
      path.resolve(process.cwd(), ".next/server", SpaceMonoBold)
    ),
  },
];
