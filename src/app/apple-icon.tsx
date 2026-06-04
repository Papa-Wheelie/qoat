import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F9F9F7",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
        }}
      >
        <span
          style={{
            fontSize: 100,
            fontWeight: 900,
            color: "#111111",
            lineHeight: 1,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Q
        </span>
      </div>
    ),
    { ...size },
  );
}
