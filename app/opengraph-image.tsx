import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #020202 0%, #0b0b0b 55%, #0e1a0b 100%)",
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
        <div
          style={{
            fontSize: 26,
            textTransform: "uppercase",
            letterSpacing: "0.42em",
            color: "#9ae36a",
            marginBottom: 18,
          }}
        >
          AI-Powered Visuals
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>
          Generate model photos with AI
        </div>
        <div style={{ marginTop: 24, fontSize: 28, color: "#c6c6c6", maxWidth: 860 }}>
          Turn product images into studio-grade model visuals for fashion brands and creators.
        </div>
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              height: 56,
              width: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #9ae36a 0%, #c9ff6a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0a0a0a",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            MC
          </div>
          <div style={{ fontSize: 24, color: "#a3ff58", letterSpacing: "0.08em" }}>ModelCast</div>
        </div>
      </div>
    ),
    size,
  )
}
