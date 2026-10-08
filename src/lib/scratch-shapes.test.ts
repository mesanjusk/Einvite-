import { describe, expect, it } from "vitest";
import { insideScratchShape, SCRATCH_SHAPES } from "./scratch-shapes";
describe("shaped scratch reveal", () => {
  it("counts the center for every shape, excluding inaccessible corners", () => {
    for (const shape of SCRATCH_SHAPES) expect(insideScratchShape(shape, 0.5, 0.5)).toBe(true);
    for (const shape of SCRATCH_SHAPES.filter((shape) => shape !== "box")) expect(insideScratchShape(shape, 0.01, 0.01)).toBe(false);
  });
});
