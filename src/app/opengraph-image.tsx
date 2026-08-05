import { ImageResponse } from "next/og";

/**
 * The share card. This is the whole first impression on Reddit — a link with no
 * preview reads as spam — so it states the method rather than just the name.
 *
 * Deliberately built from plain divs and system fonts: loading the display
 * typeface here would mean shipping a font binary just for the card, and the
 * shape below carries the brand well enough at 1200x630.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "MyMDb — what everyone actually puts at the top";

const INK = "#0b0e14";
const BONE = "#e9e5dc";
const DIM = "#79839a";
const TUNGSTEN = "#ffae3b";
const STOCK = "#58c7d8";

export default function OpengraphImage() {
  // The rank scale, amber at first pick cooling to cyan at tenth — the same
  // gradient the boards use to encode ballot position.
  const bars = Array.from({ length: 10 }, (_, i) => {
    const t = i / 9;
    const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
    return {
      color: `rgb(${lerp(255, 88)},${lerp(174, 199)},${lerp(59, 216)})`,
      height: 150 - i * 12,
    };
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 44, fontWeight: 800, color: BONE }}>MyM</span>
          <span style={{ fontSize: 44, fontWeight: 800, color: TUNGSTEN }}>Db</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: BONE,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            What everyone actually
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: TUNGSTEN,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            puts at the top.
          </div>
          <div style={{ fontSize: 27, color: DIM, marginTop: 26 }}>
            Ranked ballots, not star ratings. One list per person, per category.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          {bars.map((bar, i) => (
            <div
              key={i}
              style={{
                width: 46,
                height: bar.height,
                background: bar.color,
                borderRadius: 6,
                opacity: 0.9,
              }}
            />
          ))}
          <div
            style={{
              display: "flex",
              color: STOCK,
              fontSize: 22,
              marginLeft: 28,
              whiteSpace: "nowrap",
            }}
          >
            #1 is worth ten points. #10 is worth one.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
