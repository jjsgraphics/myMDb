import { ImageResponse } from "next/og";

/** Favicon. Generated rather than shipped as a binary so it stays in step with
 *  the palette in globals.css. */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0e14",
          color: "#ffae3b",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "-0.05em",
        }}
      >
        M
      </div>
    ),
    size,
  );
}
