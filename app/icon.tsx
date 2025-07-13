import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default async function Icon() {
  return new ImageResponse(<Favicon />, { ...size });
}

const Favicon = () => {
  return (
    <div
      style={{
        padding: "5px",
        backgroundColor: "black",
        color: "white",
        borderRadius: "7px",
        fontWeight: "bold",
      }}
    >
      AN
    </div>
  );
};
