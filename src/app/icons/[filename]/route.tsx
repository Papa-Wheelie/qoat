import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  const size = filename.startsWith("icon-192") ? 192 : 512;
  const isMaskable = filename.includes("maskable");

  // Maskable icons keep content within the inner 80% safe zone
  const padding = isMaskable ? Math.round(size * 0.1) : 0;
  const innerSize = size - padding * 2;
  const fontSize = Math.round(innerSize * 0.56);

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
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 900,
            color: "#111111",
            lineHeight: 1,
            // Force a system font — next/og doesn't load custom fonts unless specified
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Q
        </span>
      </div>
    ),
    { width: size, height: size },
  );
}
