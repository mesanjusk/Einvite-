import { describe, expect, it } from "vitest";
import { artworkPosterFor, videoPosterFor } from "./marketplace-artwork";

describe("marketplace artwork fallback", () => {
  it("uses the saved reveal poster before a generic thumbnail", () => {
    expect(
      artworkPosterFor({
        name: "Wedding",
        revealMode: "VIDEO",
        revealVideoPosterUrl: "https://example.com/poster.jpg",
        previewImage: "https://example.com/thumbnail.jpg",
      }),
    ).toBe("https://example.com/poster.jpg");
  });
  it("derives a JPEG from a transformed Cloudinary video preserving its folder and version", () => {
    expect(
      videoPosterFor(
        "https://res.cloudinary.com/shop/video/upload/c_limit,w_720/q_auto,f_mp4/v123/invites/wedding.mp4",
      ),
    ).toBe(
      "https://res.cloudinary.com/shop/video/upload/so_0,c_limit,w_640,q_auto,f_jpg/v123/invites/wedding.jpg",
    );
  });
  it("does not transform external or invalid video URLs", () => {
    expect(videoPosterFor("https://example.com/video.mp4")).toBeNull();
    expect(videoPosterFor("invalid")).toBeNull();
  });
  it("uses actual section artwork for a theme without a thumbnail", () => {
    expect(
      artworkPosterFor({
        name: "Wedding",
        previewImage: "",
        sectionArtwork: "/theme.jpg",
      }),
    ).toBe("/theme.jpg");
  });
});
