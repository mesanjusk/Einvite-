import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { ThemeAssetReview } from "./theme-asset-review";

describe("selected media checks", () => {
  afterEach(cleanup);
  it("distinguishes selection, loading, readiness, playback and failure", () => {
    render(<ThemeAssetReview kind="audio" url="/music.wav" label="Theme music" />);
    const audio = screen.getByLabelText("Theme music");
    expect(screen.getByText("Selected")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    fireEvent.canPlay(audio);
    expect(screen.getByRole("status")).toHaveTextContent("press Play");
    fireEvent.playing(audio);
    expect(screen.getByRole("status")).toHaveTextContent("Playing");
    fireEvent.error(audio);
    expect(screen.getByRole("status")).toHaveTextContent("Failed to load");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });
  it("does not carry a previous file's successful status onto a new selection", () => {
    const view = render(<ThemeAssetReview kind="image" url="/first.jpg" label="Artwork" />);
    fireEvent.load(screen.getByAltText("Artwork"));
    expect(screen.getByRole("status")).toHaveTextContent("Image loaded");
    view.rerender(<ThemeAssetReview kind="image" url="/missing.jpg" label="Artwork" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    fireEvent.error(screen.getByAltText("Artwork"));
    expect(screen.getByRole("status")).toHaveTextContent("Failed to load");
  });
});
