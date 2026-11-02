import { ImageResponse } from "next/og";

export const alt = "360 Consultancy — Your Visa · Our Guidance · A Brighter Future";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social-share card for every page that has no image of its own. */
export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#0a1f44", color: "#fff" }}>
        <div style={{ fontSize: 28, color: "#e0b24a", letterSpacing: 4, textTransform: "uppercase" }}>360consultancy.pk</div>
        <div style={{ fontSize: 88, fontWeight: 800, marginTop: 24, lineHeight: 1.05 }}>360 Consultancy</div>
        <div style={{ fontSize: 38, marginTop: 28, color: "#cbd5e1" }}>Visa guidance · Study abroad · Scholarships · Umrah &amp; tours</div>
        <div style={{ fontSize: 30, marginTop: 40, color: "#e0b24a" }}>Your Visa · Our Guidance · A Brighter Future</div>
      </div>
    ),
    size,
  );
}
