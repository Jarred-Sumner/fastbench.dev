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
    src: new Buffer(
      SpaceMonoRegular.replace("data:font/ttf;base64,", ""),
      "base64"
    ),
  },

  {
    family: "IBM Plex Sans",
    style: "normal",
    weight: "normal",
    src: new Buffer(
      IBMPlexSansRegular.replace("data:font/ttf;base64,", ""),
      "base64"
    ),
  },

  /* latin */
  {
    family: "IBM Plex Sans",
    style: "normal",
    weight: "bold",
    src: new Buffer(
      IBMPlexSansBold.replace("data:font/ttf;base64,", ""),
      "base64"
    ),
  },
  {
    family: "Space Mono",
    style: "normal",
    weight: "bold",
    src: new Buffer(
      SpaceMonoBold.replace("data:font/ttf;base64,", ""),
      "base64"
    ),
  },
];
