import fs from "fs";
import path from "path";

export default [
  {
    family: "Space Mono",
    style: "normal",
    weight: "normal",
    src: fs.readFileSync(
      path.resolve(process.cwd(), "public", "Space_Mono/SpaceMono-Regular.ttf")
      // "binary"
    ),
  },

  {
    family: "IBM Plex Sans",
    style: "normal",
    weight: "normal",
    src: fs.readFileSync(
      path.resolve(
        process.cwd(),
        "public",
        "IBM_Plex_Sans/IBMPlexSans-Regular.ttf"
      )
      // "binary"
    ),
  },

  /* latin */
  {
    family: "IBM Plex Sans",
    style: "normal",
    weight: "bold",
    src: fs.readFileSync(
      path.resolve(
        process.cwd(),
        "public",
        "IBM_Plex_Sans/IBMPlexSans-Bold.ttf"
      )
      // "binary"
    ),
  },
  {
    family: "Space Mono",
    style: "normal",
    weight: "bold",
    src: fs.readFileSync(
      path.resolve(process.cwd(), "public", "Space_Mono/SpaceMono-Bold.ttf")
      // "binary"
    ),
  },
];
