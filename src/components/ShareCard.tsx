import * as React from "react";
import {
  formatDecimal,
  getMultiplier,
  getScore,
  Result,
} from "src/components/ResultCard";
import {
  Allocator,
  Node,
  AlignItems,
  AlignSelf,
  AlignContent,
  Direction,
  Display,
  FlexDirection,
  JustifyContent,
  Overflow,
  PositionType,
  FlexWrap,
} from "stretch-layout";
import { Flexbox } from "src/components/Flexbox";
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "src/components/ShareCardDimensions";

const themes = {
  default: {
    primary: "white",
    background: "#0017E9",
    highlight: "#02FF00",
    verticalSpacing: 20,
    horizontalSpacing: 14,
    statFontFamily: "IBM Plex Sans",
    statFontWeight: "Bold",
    muted: "rgb(152,152,152)",
    opsFontFamily: "IBM Plex Sans",
    opsFontWeight: "normal",
    titleFontFamily: "Space Mono",
    titleFontSize: "16px",
    titleFontWeight: "normal",
  },
};

type ColorSchemeID = keyof typeof themes;
type ColorScheme = typeof themes.default;

const RESULT_LABEL_HEIGHT = 14;
const PROGRESS_BAR_HEIGHT = 2;
const PROGRESS_BAR_MIDPOINT = (RESULT_LABEL_HEIGHT - PROGRESS_BAR_HEIGHT) / 2;
const RESULT_LABEL_Y_OFFSET = 6;
const PROGRESS_BAR_WIDTH = 100;
const RESULT_LABEL_WIDTH = 148;

function getResultYOffset(index: number) {
  return index > 0 ? index * RESULT_LABEL_HEIGHT + RESULT_LABEL_Y_OFFSET : 0;
}
const ResultLabel = ({ rank, title, index, theme, ...props }) => {
  let fontSize = 14;

  title = title.substring(0, 16);

  return (
    <text
      {...props}
      fontFamily="IBM Plex Sans"
      fontWeight="bold"
      fontSize={fontSize}
      fill={rank === 1 ? theme.highlight : theme.primary}
      yoga={{
        flexShrink: 0,
        flexGrow: 1,
        flexBasis: 1,
        height: RESULT_LABEL_HEIGHT,
        paddingTop: RESULT_LABEL_Y_OFFSET / 2,
        paddingBottom: RESULT_LABEL_Y_OFFSET / 2,
      }}
    >
      {title.substring(0, 20)}
    </text>
  );
};

const ResultProgressBar = ({ rank, theme, value, index, ...props }) => (
  <g
    yoga={{
      height: RESULT_LABEL_HEIGHT,
      marginTop: RESULT_LABEL_Y_OFFSET / 2,
      marginBottom: RESULT_LABEL_Y_OFFSET / 2,
      top: -RESULT_LABEL_Y_OFFSET - 2,
      flexShrink: 0,
      flexGrow: 1,
      justifyContent: JustifyContent.FlexStart,
    }}
  >
    <rect
      {...props}
      fill={rank === 1 ? theme.highlight : theme.primary}
      yoga={{
        height: 2,

        width: value,
      }}
    ></rect>
  </g>
);

export { SHARE_CARD_WIDTH };
export { SHARE_CARD_HEIGHT };

export function ShareCard({
  colorScheme = "default",
  title,
  results,
  baseline,
  onMeasure,
  fastest,
}: {
  colorScheme: ColorSchemeID;
  title: string;
  results: Result[];
  baseline: Result;
  fastest: Result;
}) {
  const theme = themes[colorScheme];
  const {
    primary,
    background,
    highlight,
    verticalSpacing,
    horizontalSpacing,
    statFontFamily,
    muted,
    statFontWeight,
    opsFontFamily,
    opsFontWeight,
    titleFontFamily,
    titleFontSize,
    titleFontWeight,
  } = theme;

  const scoreRange = fastest.multiplier - baseline.multiplier;

  const renderProgressBar = React.useCallback(
    (result: Result, index: number) => {
      return (
        <ResultProgressBar
          value={
            Math.max(
              Math.min(
                result.operationsPerSecond / fastest.operationsPerSecond,
                1
              ),
              0
            ) * PROGRESS_BAR_WIDTH
          }
          rank={result.rank}
          index={index}
          key={result.id}
          theme={theme}
        />
      );
    },
    [baseline, fastest, theme, ResultProgressBar, getScore, scoreRange]
  );

  const renderLabel = React.useCallback(
    (result: Result, index: number) => {
      return (
        <ResultLabel
          title={result.name}
          rank={result.rank}
          index={index}
          key={result.id}
          theme={theme}
        />
      );
    },
    [baseline, fastest, theme, ResultLabel]
  );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={`${SHARE_CARD_WIDTH}`}
      height={`${SHARE_CARD_HEIGHT}`}
      viewBox={`0 0 ${SHARE_CARD_WIDTH} ${SHARE_CARD_HEIGHT}`}
    >
      <rect width="100%" height="100%" fill={background} />

      <Flexbox
        height={SHARE_CARD_HEIGHT}
        width={SHARE_CARD_WIDTH}
        onMeasure={onMeasure}
        measureType="text"
        style={{
          flexDirection: FlexDirection.Column,
          height: SHARE_CARD_HEIGHT,
          width: SHARE_CARD_WIDTH,
          paddingStart: horizontalSpacing,
          justifyContent: JustifyContent.SpaceBetween,
          paddingEnd: horizontalSpacing,
          marginTop: verticalSpacing,
          marginBottom: verticalSpacing * 1.5,
        }}
      >
        <text
          fontFamily={"IBM Plex Sans"}
          fontWeight={"bold"}
          fontSize="16px"
          alignmentBaseline="before-edge"
          textAnchor="start"
          fill={primary}
          height={16}
          yoga={{
            marginTop: verticalSpacing * 1.5,
            flexShrink: 1,
            flexGrow: 0,
          }}
          width={SHARE_CARD_WIDTH}
        >
          {title}
        </text>

        <g
          yoga={{
            flexDirection: FlexDirection.Row,
            justifyContent: JustifyContent.SpaceAround,
            alignItems: AlignItems.Center,
            marginBottom: 16,

            flexGrow: 1,
            flexShrink: 1,
            height: "100%",
            minHeight: 40,
            width: SHARE_CARD_WIDTH,
          }}
        >
          <g
            yoga={{
              flexDirection: FlexDirection.Column,
              alignItems: AlignItems.FlexStart,
              flexWrap: FlexWrap.NoWrap,
              flexGrow: 1,
              flexShrink: 1,
              marginEnd: 24,
            }}
          >
            <text
              fontFamily={titleFontFamily}
              fontSize={32 + "px"}
              letterSpacing={-3}
              height={24}
              width={50}
              yoga={{
                flexGrow: 1,
                flexShrink: 1,
              }}
              fontWeight={titleFontWeight}
              fill={highlight}
            >
              {formatDecimal(getMultiplier(fastest, baseline))}x
            </text>

            <text
              fontFamily={opsFontFamily}
              fontSize={"16px"}
              letterSpacing={1}
              textAnchor="start"
              alignmentBaseline="before-edge"
              fontWeight={opsFontWeight}
              fill={muted}
              height={14}
              width={50}
              yoga={{
                flexGrow: 1,
                flexShrink: 1,
              }}
            >
              {formatDecimal(
                fastest.operationsPerSecond,
                fastest.operationsPerSecond > 100_000 ? 0 : 1
              )}{" "}
              ops/s
            </text>
          </g>

          <g
            yoga={{
              flexDirection: FlexDirection.Column,
              flexWrap: FlexWrap.NoWrap,
              flexGrow: 1,
              flexShrink: 1,
              marginStart: 16,
              marginEnd: 16,
              justifyContent: JustifyContent.FlexEnd,
              minHeight: 50,
            }}
          >
            {results.map(renderLabel)}
          </g>

          <g
            yoga={{
              flexDirection: FlexDirection.Column,
              justifyContent: JustifyContent.Center,
              flexWrap: FlexWrap.NoWrap,
              flexGrow: 1,
              flexShrink: 0,
              paddingEnd: 16,

              minHeight: 50,
            }}
          >
            {results.map(renderProgressBar)}
          </g>
        </g>
      </Flexbox>

      <g
        transform={`translate(${horizontalSpacing}, ${
          SHARE_CARD_HEIGHT - 16 - verticalSpacing
        })`}
      >
        <path
          fill="#fff"
          d="M57.266 6.343h2.362V4.398c0-.35.108-.638.324-.864.226-.226.514-.34.864-.34h3.026v1.112h-2.594c-.277 0-.416.154-.416.463v1.574h3.195v1.112h-3.195V14h-1.204V7.455h-2.362V6.343zm15.086 6.36h-.185c-.247.515-.592.896-1.035 1.143-.432.247-.89.37-1.373.37-.505 0-.973-.082-1.405-.247a3.405 3.405 0 01-1.142-.756 3.726 3.726 0 01-.757-1.235c-.185-.484-.278-1.045-.278-1.683v-.247c0-.627.093-1.183.278-1.667.186-.484.438-.89.757-1.22.329-.339.71-.596 1.142-.771.432-.175.89-.263 1.374-.263.525 0 .998.119 1.42.355.432.227.772.582 1.019 1.066h.185V6.343h1.204v6.082c0 .31.139.464.417.464h.386V14h-.818c-.35 0-.638-.113-.865-.34-.216-.226-.324-.514-.324-.864v-.093zm-2.47.37c.36 0 .69-.066.988-.2.309-.134.571-.324.787-.571.216-.247.386-.54.51-.88.123-.35.185-.736.185-1.158v-.185c0-.412-.062-.787-.185-1.127a2.574 2.574 0 00-.525-.895 2.186 2.186 0 00-.787-.571 2.207 2.207 0 00-.973-.216c-.36 0-.69.067-.988.2a2.38 2.38 0 00-.787.572 2.54 2.54 0 00-.51.88c-.123.339-.185.715-.185 1.126v.247c0 .875.227 1.56.68 2.053.463.484 1.06.726 1.79.726zm7.955-4.754c0 .37.154.654.463.85.319.195.895.324 1.729.385.895.072 1.574.288 2.037.649.474.35.71.864.71 1.543v.093a2.152 2.152 0 01-.849 1.744c-.257.206-.576.36-.957.463-.37.114-.777.17-1.22.17-.596 0-1.11-.077-1.543-.231a3.482 3.482 0 01-1.065-.633 2.791 2.791 0 01-.633-.896 3.073 3.073 0 01-.247-1.018l1.142-.278c.052.586.278 1.06.68 1.42.401.35.936.525 1.605.525.566 0 1.019-.108 1.358-.325.35-.226.525-.54.525-.941 0-.432-.17-.741-.51-.926-.339-.186-.89-.304-1.65-.355-.886-.062-1.565-.268-2.038-.618-.474-.35-.71-.86-.71-1.528v-.093c0-.36.077-.674.231-.941.154-.278.36-.51.618-.695.267-.185.566-.324.895-.417.33-.092.674-.139 1.034-.139.504 0 .947.072 1.328.216.38.134.7.314.957.54.257.217.452.469.586.757.144.288.237.576.278.865l-1.142.277c-.052-.494-.252-.88-.602-1.157-.34-.278-.787-.417-1.343-.417a2.6 2.6 0 00-.633.077c-.196.041-.37.108-.525.2a1.114 1.114 0 00-.37.356.82.82 0 00-.14.478zm7.6-1.976h2.407V3.194h1.204v3.15h2.964v1.11h-2.964v4.971c0 .31.14.464.417.464h2.177V14h-2.61c-.35 0-.637-.113-.864-.34-.216-.226-.324-.514-.324-.864V7.455h-2.408V6.343zM96.076 14h-1.204V3.194h1.204v4.354h.185a2.604 2.604 0 011.111-1.05c.474-.247.988-.37 1.544-.37.473 0 .92.087 1.343.262a3.28 3.28 0 011.111.756c.33.33.587.736.772 1.22.196.483.293 1.034.293 1.651v.31c0 .627-.092 1.183-.277 1.666a3.45 3.45 0 01-.772 1.22c-.319.33-.695.581-1.127.756-.432.165-.89.247-1.374.247-.247 0-.5-.03-.756-.092a3.138 3.138 0 01-.741-.248 3.821 3.821 0 01-.633-.432 2.418 2.418 0 01-.494-.617h-.185V14zm2.562-.926c.37 0 .71-.062 1.019-.185a2.45 2.45 0 00.803-.556c.236-.237.416-.525.54-.865.134-.34.2-.72.2-1.142v-.309c0-.411-.066-.782-.2-1.111a2.343 2.343 0 00-.54-.864 2.31 2.31 0 00-.819-.572 2.496 2.496 0 00-1.003-.2c-.36 0-.695.072-1.003.216a2.5 2.5 0 00-.819.57 2.775 2.775 0 00-.54.896c-.133.34-.2.715-.2 1.127v.185c0 .422.067.808.2 1.158.134.34.314.633.54.88.237.247.51.437.819.571.308.134.643.2 1.003.2zm6.843-2.532c.031.762.268 1.374.71 1.837.443.463 1.06.695 1.853.695.36 0 .674-.041.941-.124.268-.082.494-.195.679-.34.196-.143.35-.308.464-.493.123-.196.221-.402.293-.618l1.142.309a3.401 3.401 0 01-1.204 1.744c-.576.443-1.358.664-2.346.664-.546 0-1.05-.092-1.513-.278a3.49 3.49 0 01-1.173-.818 3.752 3.752 0 01-.772-1.25 4.46 4.46 0 01-.278-1.606v-.37c0-.535.093-1.034.278-1.497.195-.464.463-.86.803-1.19.339-.339.735-.601 1.188-.786a3.81 3.81 0 011.498-.294c.627 0 1.168.119 1.62.355.463.227.839.51 1.127.85.299.339.515.71.649 1.11.144.402.216.773.216 1.112v.988h-6.175zm2.563-3.272c-.34 0-.659.056-.957.17a2.397 2.397 0 00-.772.447 2.575 2.575 0 00-.541.695c-.133.257-.221.54-.262.849h4.94a2.154 2.154 0 00-.247-.896 2.05 2.05 0 00-.541-.679 2.377 2.377 0 00-.756-.432 2.47 2.47 0 00-.864-.154zm7.213 6.73h-1.204V6.343h1.204V7.64h.185c.474-1.008 1.297-1.513 2.47-1.513.885 0 1.59.278 2.115.834.525.545.787 1.369.787 2.47V14h-1.204V9.678c0-.803-.18-1.405-.54-1.806-.36-.402-.849-.602-1.467-.602-.73 0-1.306.252-1.728.756-.412.494-.618 1.158-.618 1.991V14zm15.41-2.717a3.808 3.808 0 01-.432 1.173c-.195.36-.447.674-.756.942a3.451 3.451 0 01-1.081.602 4.132 4.132 0 01-1.374.216 4.46 4.46 0 01-1.528-.262 3.77 3.77 0 01-1.25-.757 3.829 3.829 0 01-.865-1.235c-.205-.483-.308-1.039-.308-1.667v-.185c0-.617.103-1.173.308-1.667.217-.494.505-.91.865-1.25.36-.34.777-.603 1.25-.788a4.237 4.237 0 011.528-.278c.484 0 .932.072 1.343.216.412.145.772.35 1.081.618.319.257.576.566.772.926.206.36.345.751.417 1.173l-1.204.278a2.32 2.32 0 00-.232-.772 1.922 1.922 0 00-.479-.663 2.086 2.086 0 00-.725-.464 2.733 2.733 0 00-1.003-.17c-.371 0-.721.073-1.05.217-.319.134-.602.33-.849.586a2.705 2.705 0 00-.587.896c-.133.35-.2.73-.2 1.142v.185c0 .432.067.823.2 1.173.144.34.34.628.587.865.247.236.535.422.864.556.33.123.685.185 1.065.185.381 0 .711-.057.988-.17.289-.123.53-.278.726-.463.206-.196.365-.417.478-.664a2.58 2.58 0 00.247-.772l1.204.278zM134.162 14h-1.204V3.194h1.204v4.539h.185c.237-.494.566-.885.988-1.173.432-.289.957-.433 1.575-.433.833 0 1.507.278 2.022.834.525.545.787 1.369.787 2.47V14h-1.204V9.678c0-.803-.18-1.405-.54-1.806-.361-.402-.849-.602-1.467-.602-.73 0-1.307.252-1.729.756-.411.494-.617 1.158-.617 1.991V14z"
        ></path>
        <path
          fill="#fff"
          d="M57.266 6.343h2.362V4.398c0-.35.108-.638.324-.864.226-.226.514-.34.864-.34h3.026v1.112h-2.594c-.277 0-.416.154-.416.463v1.574h3.195v1.112h-3.195V14h-1.204V7.455h-2.362V6.343zm15.086 6.36h-.185c-.247.515-.592.896-1.035 1.143-.432.247-.89.37-1.373.37-.505 0-.973-.082-1.405-.247a3.405 3.405 0 01-1.142-.756 3.726 3.726 0 01-.757-1.235c-.185-.484-.278-1.045-.278-1.683v-.247c0-.627.093-1.183.278-1.667.186-.484.438-.89.757-1.22.329-.339.71-.596 1.142-.771.432-.175.89-.263 1.374-.263.525 0 .998.119 1.42.355.432.227.772.582 1.019 1.066h.185V6.343h1.204v6.082c0 .31.139.464.417.464h.386V14h-.818c-.35 0-.638-.113-.865-.34-.216-.226-.324-.514-.324-.864v-.093zm-2.47.37c.36 0 .69-.066.988-.2.309-.134.571-.324.787-.571.216-.247.386-.54.51-.88.123-.35.185-.736.185-1.158v-.185c0-.412-.062-.787-.185-1.127a2.574 2.574 0 00-.525-.895 2.186 2.186 0 00-.787-.571 2.207 2.207 0 00-.973-.216c-.36 0-.69.067-.988.2a2.38 2.38 0 00-.787.572 2.54 2.54 0 00-.51.88c-.123.339-.185.715-.185 1.126v.247c0 .875.227 1.56.68 2.053.463.484 1.06.726 1.79.726zm7.955-4.754c0 .37.154.654.463.85.319.195.895.324 1.729.385.895.072 1.574.288 2.037.649.474.35.71.864.71 1.543v.093a2.152 2.152 0 01-.849 1.744c-.257.206-.576.36-.957.463-.37.114-.777.17-1.22.17-.596 0-1.11-.077-1.543-.231a3.482 3.482 0 01-1.065-.633 2.791 2.791 0 01-.633-.896 3.073 3.073 0 01-.247-1.018l1.142-.278c.052.586.278 1.06.68 1.42.401.35.936.525 1.605.525.566 0 1.019-.108 1.358-.325.35-.226.525-.54.525-.941 0-.432-.17-.741-.51-.926-.339-.186-.89-.304-1.65-.355-.886-.062-1.565-.268-2.038-.618-.474-.35-.71-.86-.71-1.528v-.093c0-.36.077-.674.231-.941.154-.278.36-.51.618-.695.267-.185.566-.324.895-.417.33-.092.674-.139 1.034-.139.504 0 .947.072 1.328.216.38.134.7.314.957.54.257.217.452.469.586.757.144.288.237.576.278.865l-1.142.277c-.052-.494-.252-.88-.602-1.157-.34-.278-.787-.417-1.343-.417a2.6 2.6 0 00-.633.077c-.196.041-.37.108-.525.2a1.114 1.114 0 00-.37.356.82.82 0 00-.14.478zm7.6-1.976h2.407V3.194h1.204v3.15h2.964v1.11h-2.964v4.971c0 .31.14.464.417.464h2.177V14h-2.61c-.35 0-.637-.113-.864-.34-.216-.226-.324-.514-.324-.864V7.455h-2.408V6.343zM96.076 14h-1.204V3.194h1.204v4.354h.185a2.604 2.604 0 011.111-1.05c.474-.247.988-.37 1.544-.37.473 0 .92.087 1.343.262a3.28 3.28 0 011.111.756c.33.33.587.736.772 1.22.196.483.293 1.034.293 1.651v.31c0 .627-.092 1.183-.277 1.666a3.45 3.45 0 01-.772 1.22c-.319.33-.695.581-1.127.756-.432.165-.89.247-1.374.247-.247 0-.5-.03-.756-.092a3.138 3.138 0 01-.741-.248 3.821 3.821 0 01-.633-.432 2.418 2.418 0 01-.494-.617h-.185V14zm2.562-.926c.37 0 .71-.062 1.019-.185a2.45 2.45 0 00.803-.556c.236-.237.416-.525.54-.865.134-.34.2-.72.2-1.142v-.309c0-.411-.066-.782-.2-1.111a2.343 2.343 0 00-.54-.864 2.31 2.31 0 00-.819-.572 2.496 2.496 0 00-1.003-.2c-.36 0-.695.072-1.003.216a2.5 2.5 0 00-.819.57 2.775 2.775 0 00-.54.896c-.133.34-.2.715-.2 1.127v.185c0 .422.067.808.2 1.158.134.34.314.633.54.88.237.247.51.437.819.571.308.134.643.2 1.003.2zm6.843-2.532c.031.762.268 1.374.71 1.837.443.463 1.06.695 1.853.695.36 0 .674-.041.941-.124.268-.082.494-.195.679-.34.196-.143.35-.308.464-.493.123-.196.221-.402.293-.618l1.142.309a3.401 3.401 0 01-1.204 1.744c-.576.443-1.358.664-2.346.664-.546 0-1.05-.092-1.513-.278a3.49 3.49 0 01-1.173-.818 3.752 3.752 0 01-.772-1.25 4.46 4.46 0 01-.278-1.606v-.37c0-.535.093-1.034.278-1.497.195-.464.463-.86.803-1.19.339-.339.735-.601 1.188-.786a3.81 3.81 0 011.498-.294c.627 0 1.168.119 1.62.355.463.227.839.51 1.127.85.299.339.515.71.649 1.11.144.402.216.773.216 1.112v.988h-6.175zm2.563-3.272c-.34 0-.659.056-.957.17a2.397 2.397 0 00-.772.447 2.575 2.575 0 00-.541.695c-.133.257-.221.54-.262.849h4.94a2.154 2.154 0 00-.247-.896 2.05 2.05 0 00-.541-.679 2.377 2.377 0 00-.756-.432 2.47 2.47 0 00-.864-.154zm7.213 6.73h-1.204V6.343h1.204V7.64h.185c.474-1.008 1.297-1.513 2.47-1.513.885 0 1.59.278 2.115.834.525.545.787 1.369.787 2.47V14h-1.204V9.678c0-.803-.18-1.405-.54-1.806-.36-.402-.849-.602-1.467-.602-.73 0-1.306.252-1.728.756-.412.494-.618 1.158-.618 1.991V14zm15.41-2.717a3.808 3.808 0 01-.432 1.173c-.195.36-.447.674-.756.942a3.451 3.451 0 01-1.081.602 4.132 4.132 0 01-1.374.216 4.46 4.46 0 01-1.528-.262 3.77 3.77 0 01-1.25-.757 3.829 3.829 0 01-.865-1.235c-.205-.483-.308-1.039-.308-1.667v-.185c0-.617.103-1.173.308-1.667.217-.494.505-.91.865-1.25.36-.34.777-.603 1.25-.788a4.237 4.237 0 011.528-.278c.484 0 .932.072 1.343.216.412.145.772.35 1.081.618.319.257.576.566.772.926.206.36.345.751.417 1.173l-1.204.278a2.32 2.32 0 00-.232-.772 1.922 1.922 0 00-.479-.663 2.086 2.086 0 00-.725-.464 2.733 2.733 0 00-1.003-.17c-.371 0-.721.073-1.05.217-.319.134-.602.33-.849.586a2.705 2.705 0 00-.587.896c-.133.35-.2.73-.2 1.142v.185c0 .432.067.823.2 1.173.144.34.34.628.587.865.247.236.535.422.864.556.33.123.685.185 1.065.185.381 0 .711-.057.988-.17.289-.123.53-.278.726-.463.206-.196.365-.417.478-.664a2.58 2.58 0 00.247-.772l1.204.278zM134.162 14h-1.204V3.194h1.204v4.539h.185c.237-.494.566-.885.988-1.173.432-.289.957-.433 1.575-.433.833 0 1.507.278 2.022.834.525.545.787 1.369.787 2.47V14h-1.204V9.678c0-.803-.18-1.405-.54-1.806-.361-.402-.849-.602-1.467-.602-.73 0-1.307.252-1.729.756-.411.494-.617 1.158-.617 1.991V14z"
        ></path>
        <path
          fill="#FE0100"
          d="M147.977 2.929H156.338V11.290000000000001H147.977z"
        ></path>
        <path
          fill="#02FF00"
          d="M154.408 9.361H162.76899999999998V17.722H154.408z"
        ></path>
        <path
          fill="#fff"
          d="M183.594 8.672a.57.57 0 00-.188-.422l-4.914-4.922c-.156-.148-.289-.203-.445-.203a.534.534 0 00-.547.547c0 .148.047.297.148.398l2 2.016 2.29 2.117-1.735-.094h-9.765a.54.54 0 00-.555.563c0 .32.234.555.555.555h9.765l1.742-.094-2.297 2.117-2 2.016a.601.601 0 00-.148.398c0 .313.234.547.547.547a.562.562 0 00.406-.172l4.953-4.953a.554.554 0 00.188-.414zM4.536 13L7.32 4.624H5.952L4.62 8.764l-.816 2.916h-.048l-.804-2.916-1.332-4.14H.216L2.964 13h1.572zm7.32 0v-1.104h-1.153V5.728h1.152V4.624H8.207v1.104h1.14v6.168h-1.14V13h3.648zm7.067 0v-1.2h-4.008V9.352h3.636v-1.2h-3.636V5.824h4.008v-1.2H13.56V13h5.364zm4.51 0l1.092-4.332.636-2.544h.024l.624 2.544L26.877 13H28.4l2.064-8.376h-1.332l-.876 4.032-.612 2.772h-.036l-.66-2.772-.984-4.032h-1.512l-.996 4.032-.672 2.784h-.036l-.588-2.784-.852-4.032h-1.38L21.909 13h1.524zm14.425.144c2.184 0 3.612-1.512 3.612-4.332S40.042 4.48 37.858 4.48s-3.612 1.512-3.612 4.332 1.428 4.332 3.612 4.332zm0-1.212c-1.296 0-2.16-.936-2.16-2.46v-1.32c0-1.524.864-2.46 2.16-2.46 1.296 0 2.16.936 2.16 2.46v1.32c0 1.524-.864 2.46-2.16 2.46zM48.153 13h1.512V4.624h-1.296v6.408h-.036l-.924-1.776-2.736-4.632H43.16V13h1.296V6.592h.036l.924 1.776L48.153 13z"
        ></path>
      </g>
    </svg>
  );
}

export default ShareCard;
