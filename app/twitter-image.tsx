import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #020202 0%, #0a0a0a 60%, #0f1d0c 100%)",
          color: "white",
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: "0.5em", textTransform: "uppercase", color: "#9ae36a" }}>
          ModelCast
        </div>
        <div style={{ marginTop: 16, fontSize: 64, fontWeight: 800, lineHeight: 1.05 }}>
          AI model photos for fashion brands
        </div>
        <div style={{ marginTop: 20, fontSize: 26, color: "#c6c6c6", maxWidth: 860 }}>
          Upload a product photo, get studio-ready results in minutes.
        </div>
        <div style={{ marginTop: 36, fontSize: 20, color: "#9ae36a" }}>modelcast.fit</div>
      </div>
    ),
    size,
  )
}
