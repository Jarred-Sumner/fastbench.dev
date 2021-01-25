import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "src/components/ShareCardDimensions";
import * as React from "react";
import { useRouter } from "next/router";
import { confetti } from "dom-confetti";
import copy from "copy-to-clipboard";
import classNames from "classnames";

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
  process.env.NODE_ENV === "development" ? "localhost:3001" : "fastbench.dev";
export const getShareURL = ({ id, version }) =>
  `${scheme}://${domain}/${id}/${version}`;

export const ShareSheet = ({ benchmark, isLoading: _isLoading = false }) => {
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
  const shareURL = getShareURL(router.query);
  const isLoading = _isLoading || shareURL.includes("/benches/new");

  const imgRef = React.useRef<HTMLImageElement>();
  const reloadCount = React.useRef(0);

  const reloadImage = React.useCallback(() => {
    if (imgRef.current && reloadCount.current < 2) {
      let src = imgRef.current.src;
      imgRef.current.src = "";
      imgRef.current.src = src;
      reloadCount.current++;
    }
  }, [imgRef, reloadCount]);
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
          {isLoading ? (
            <EmptyIcon />
          ) : (
            <img
              ref={imgRef}
              onError={reloadImage}
              src={`${shareURL}.svg?t=${Math.floor(Date.now() / 1000)}`}
              height={SHARE_CARD_HEIGHT}
              width={SHARE_CARD_WIDTH}
            />
          )}
        </a>
      </div>
    </>
  );
};

function EmptyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={SHARE_CARD_WIDTH}
      height={SHARE_CARD_HEIGHT}
      fill="none"
      viewBox="0 0 351 175"
    >
      <g clipPath="url(#clip0)">
        <path fill="#0017E9" d="M351 0H0v1000h351V0z"></path>
        <path
          fill="#fff"
          className="ShareSheet-image-loading"
          d="M126 83.414h2.362v-1.945c0-.35.108-.638.324-.864.226-.226.514-.34.864-.34h3.026v1.112h-2.594c-.277 0-.416.154-.416.463v1.574h3.195v1.112h-3.195v6.545h-1.204v-6.545H126v-1.112zm15.086 6.36h-.185c-.247.515-.592.896-1.035 1.143-.432.247-.89.37-1.373.37-.505 0-.973-.082-1.405-.247a3.41 3.41 0 01-1.142-.756 3.72 3.72 0 01-.757-1.235c-.185-.484-.278-1.045-.278-1.683v-.247c0-.627.093-1.183.278-1.667.186-.484.438-.89.757-1.22.329-.34.71-.596 1.142-.771.432-.175.89-.263 1.374-.263.525 0 .998.119 1.42.355.432.227.772.582 1.019 1.066h.185v-1.205h1.204v6.082c0 .31.139.464.417.464h.386v1.11h-.818c-.35 0-.638-.112-.865-.34-.216-.225-.324-.513-.324-.863v-.093zm-2.47.37c.36 0 .69-.066.988-.2.309-.134.571-.324.787-.571.216-.247.386-.54.51-.88.123-.35.185-.736.185-1.158v-.185a3.29 3.29 0 00-.185-1.127 2.566 2.566 0 00-.525-.895 2.183 2.183 0 00-.787-.571 2.207 2.207 0 00-.973-.216 2.4 2.4 0 00-.988.2c-.299.134-.567.33-.787.572a2.534 2.534 0 00-.51.88 3.284 3.284 0 00-.185 1.126v.247c0 .875.227 1.56.68 2.053.463.484 1.06.726 1.79.726v-.001zm7.955-4.754c0 .37.154.654.463.85.319.195.895.324 1.729.385.895.072 1.574.288 2.037.649.474.35.71.864.71 1.543v.093a2.143 2.143 0 01-.849 1.744 2.59 2.59 0 01-.957.463 4.13 4.13 0 01-1.22.17c-.596 0-1.11-.077-1.543-.231a3.477 3.477 0 01-1.065-.633 2.8 2.8 0 01-.633-.896 3.061 3.061 0 01-.247-1.018l1.142-.278c.052.586.278 1.06.68 1.42.401.35.936.525 1.605.525.566 0 1.019-.108 1.358-.325.35-.226.525-.54.525-.941 0-.432-.17-.741-.51-.926-.339-.186-.89-.304-1.65-.355-.886-.062-1.565-.268-2.038-.618-.474-.35-.71-.86-.71-1.528v-.093c0-.36.077-.674.231-.941.154-.278.36-.51.618-.695.267-.185.566-.324.895-.417a3.83 3.83 0 011.034-.14c.504 0 .947.073 1.328.217.38.134.7.314.957.54.257.217.452.469.586.757.144.288.237.576.278.865l-1.142.277c-.052-.494-.252-.88-.602-1.157-.34-.278-.787-.417-1.343-.417-.213 0-.426.025-.633.077a1.7 1.7 0 00-.525.2c-.149.088-.276.21-.37.356a.821.821 0 00-.14.478h.001zm7.6-1.976h2.407v-3.15h1.204v3.15h2.964v1.11h-2.964v4.972c0 .31.14.464.417.464h2.177v1.11h-2.61c-.35 0-.637-.112-.864-.34-.216-.225-.324-.513-.324-.863v-5.341h-2.408v-1.112h.001zm10.639 7.657h-1.204V80.265h1.204v4.354h.185a2.605 2.605 0 011.111-1.05c.474-.247.988-.37 1.544-.37.473 0 .92.087 1.343.262.419.172.797.43 1.111.756.33.33.587.736.772 1.22.196.483.293 1.034.293 1.65v.31c0 .628-.092 1.184-.277 1.667a3.451 3.451 0 01-.772 1.22c-.319.33-.695.58-1.127.756-.432.165-.89.247-1.374.247-.247 0-.5-.03-.756-.092a3.15 3.15 0 01-.741-.248 3.82 3.82 0 01-.633-.432 2.433 2.433 0 01-.494-.617h-.185v1.173zm2.562-.926c.37 0 .71-.062 1.019-.185.302-.13.575-.319.803-.556.236-.237.416-.525.54-.865.134-.34.2-.72.2-1.142v-.31c0-.41-.066-.781-.2-1.11a2.34 2.34 0 00-.54-.864 2.314 2.314 0 00-.819-.572 2.494 2.494 0 00-1.003-.2c-.36 0-.695.072-1.003.216a2.495 2.495 0 00-.819.57 2.786 2.786 0 00-.54.896c-.133.34-.2.715-.2 1.127v.185c0 .422.067.808.2 1.158.134.34.314.633.54.88a2.488 2.488 0 001.822.771zm6.843-2.532c.031.762.268 1.374.71 1.837.443.463 1.06.695 1.853.695.36 0 .674-.041.941-.124a2.07 2.07 0 00.679-.34c.196-.143.35-.308.464-.493.123-.196.221-.402.293-.618l1.142.309a3.398 3.398 0 01-1.204 1.744c-.576.443-1.358.664-2.346.664a4.02 4.02 0 01-1.513-.278 3.49 3.49 0 01-1.173-.818 3.747 3.747 0 01-.772-1.25 4.445 4.445 0 01-.278-1.606v-.37c0-.535.093-1.034.278-1.497.195-.464.463-.86.803-1.19a3.57 3.57 0 011.188-.786 3.807 3.807 0 011.498-.294c.627 0 1.168.119 1.62.355.463.227.839.51 1.127.85.299.339.515.71.649 1.11.144.402.216.773.216 1.112v.988h-6.175zm2.563-3.272c-.34 0-.659.056-.957.17-.283.1-.545.25-.772.447a2.572 2.572 0 00-.541.695c-.133.257-.221.54-.262.849h4.94a2.145 2.145 0 00-.247-.896 2.049 2.049 0 00-.541-.68 2.38 2.38 0 00-.756-.431 2.466 2.466 0 00-.864-.154zm7.213 6.73h-1.204v-7.657h1.204v1.297h.185c.474-1.008 1.297-1.513 2.47-1.513.885 0 1.59.278 2.115.834.525.545.787 1.369.787 2.47v4.569h-1.204v-4.322c0-.803-.18-1.405-.54-1.806-.36-.402-.849-.602-1.467-.602-.73 0-1.306.252-1.728.756-.412.494-.618 1.158-.618 1.99v3.984zm15.41-2.717a3.788 3.788 0 01-.432 1.173c-.195.36-.447.674-.756.942a3.447 3.447 0 01-1.081.602c-.443.149-.907.222-1.374.216a4.458 4.458 0 01-1.528-.262 3.768 3.768 0 01-1.25-.757 3.84 3.84 0 01-.865-1.235c-.205-.483-.308-1.04-.308-1.667v-.185c0-.617.103-1.173.308-1.667a3.79 3.79 0 01.865-1.25c.36-.34.777-.603 1.25-.788a4.238 4.238 0 011.528-.278c.484 0 .932.072 1.343.216.412.145.772.35 1.081.618.319.257.576.566.772.926.206.36.345.75.417 1.173l-1.204.278a2.322 2.322 0 00-.232-.772 1.924 1.924 0 00-.479-.663 2.09 2.09 0 00-.725-.464 2.735 2.735 0 00-1.003-.17 2.59 2.59 0 00-1.05.217c-.319.134-.602.33-.849.586a2.712 2.712 0 00-.587.896c-.133.35-.2.73-.2 1.142v.185c0 .432.067.823.2 1.173.144.34.34.628.587.865.247.236.535.422.864.556.33.123.685.185 1.065.185.381 0 .711-.057.988-.17.289-.123.53-.278.726-.463.206-.196.365-.417.478-.664a2.59 2.59 0 00.247-.772l1.204.278zm3.495 2.717h-1.204V80.265h1.204v4.539h.185a2.91 2.91 0 01.988-1.173c.432-.29.957-.433 1.575-.433.833 0 1.507.278 2.022.834.525.545.787 1.369.787 2.47v4.569h-1.204v-4.322c0-.803-.18-1.405-.54-1.806-.361-.402-.849-.602-1.467-.602-.73 0-1.307.252-1.729.756-.411.494-.617 1.158-.617 1.99v3.984z"
        ></path>
        <path
          className="ShareSheet-image-loading"
          fill="#FE0100"
          d="M216.711 80h8.361v8.361h-8.361V80z"
        ></path>
        <path
          fill="#02FF00"
          className="ShareSheet-image-loading"
          d="M223.142 86.432h8.361v8.36h-8.361v-8.36z"
        ></path>
      </g>
      <defs>
        <clipPath id="clip0">
          <path fill="#fff" d="M0 0H351V175H0z"></path>
        </clipPath>
      </defs>
    </svg>
  );
}
