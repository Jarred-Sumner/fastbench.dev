import dynamic from "next/dynamic";

export const AsyncShareCard = dynamic(() => import("./ShareCard"), {
  loading: () => null,
  ssr: true,
});
