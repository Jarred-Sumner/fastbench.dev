export function PlusIcon({
  width = 20,
  height = 20,
  fill = "currentColor",
  ...props
}) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        fill={fill}
        d="M1.83 10.988h7.182v7.182c0 .533.444.988.988.988s.999-.455.999-.988v-7.182h7.17a.997.997 0 00.989-.988c0-.544-.455-1-.988-1h-7.171V1.83c0-.533-.455-.988-.999-.988a.997.997 0 00-.988.988V9H1.83c-.533 0-.988.456-.988 1s.455.988.988.988z"
      ></path>
    </svg>
  );
}