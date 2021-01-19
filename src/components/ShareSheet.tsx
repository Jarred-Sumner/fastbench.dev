import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "src/components/ShareCardDimensions";
import * as React from "react";
import { useRouter } from "next/router";
import { confetti } from "dom-confetti";
import copy from "copy-to-clipboard";

const confettiConfig = {
  angle: 90,
  spread: 360,
  startVelocity: 40,
  elementCount: 70,
  dragFriction: 0.12,
  duration: 3000,
  stagger: 3,
  width: "10px",
  height: "10px",
  perspective: "500px",
  colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"],
};

const useConfetti = (ref: React.Ref<HTMLDivElement>) => {
  confetti(ref, confettiConfig);
};

const scheme = process.env.NODE_ENV === "development" ? "http" : "https";
const domain =
  process.env.NODE_ENV === "development"
    ? "localhost:3001"
    : "fastbench.vercel.app";
export const getShareURL = ({ id, version }) =>
  `${scheme}://${domain}/${id}/${version}`;

export const ShareSheet = ({ benchmark }) => {
  const router = useRouter();

  const SHARE_CONTENT = `<br/><a href="${getShareURL(
    router.query
  )}" title="Run ${
    benchmark.name
  }" target="_blank" rel="noopener"><img src="${getShareURL(
    router.query
  )}.svg" width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}"/></a><br/>`.replace(
    /\n/gm,
    ""
  );

  const shareURLBox = React.useRef();

  const [shareCount, setShareCount] = React.useState(0);

  const copyShareContent = React.useCallback(() => {
    copy(SHARE_CONTENT);
    setShareCount((a) => {
      a++;
      return a;
    });
  }, [setShareCount, copy, shareURLBox, useConfetti]);

  React.useLayoutEffect(() => {
    if (shareURLBox.current && shareCount) {
      useConfetti(shareURLBox.current);
    }
  }, [shareCount, shareURLBox]);

  return (
    <>
      {shareCount > 0 && <div className="Confetti" ref={shareURLBox} />}

      <div className="ShareSheet">
        <div className="ShareHeader">Share scorecard</div>
        <div className="ShareHeader-urlBox">
          <input
            type="url"
            name="share-url"
            value={SHARE_CONTENT}
            readOnly
            className="ShareHeader-url"
          />

          <div onClick={copyShareContent} className="ShareHeader-copyButton">
            COPY
          </div>
        </div>
        <a
          style={{ width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT }}
          target="_blank"
          className="ShareSheet-preview-link"
          href={getShareURL(router.query)}
        >
          <img
            src={`${getShareURL(router.query)}.svg`}
            height={SHARE_CARD_HEIGHT}
            width={SHARE_CARD_WIDTH}
          />
        </a>
      </div>
    </>
  );
};
