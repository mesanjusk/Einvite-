export const SCRATCH_SHAPES = ["box", "round", "heart", "diamond", "hexagon"] as const;
export type ScratchShape = (typeof SCRATCH_SHAPES)[number];
export const SCRATCH_CLIPS: Record<ScratchShape, string> = {
  box: "inset(0 round 12px)",
  round: "circle(50% at 50% 50%)",
  heart: "polygon(50% 92%, 12% 57%, 3% 40%, 3% 24%, 12% 10%, 28% 5%, 42% 10%, 50% 20%, 58% 10%, 72% 5%, 88% 10%, 97% 24%, 97% 40%, 88% 57%)",
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  hexagon: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
};

const SHAPE_POINTS = Object.fromEntries(SCRATCH_SHAPES.map((shape) => [shape,
  (SCRATCH_CLIPS[shape].match(/[\d.]+% [\d.]+%/g) ?? []).map((pair) => pair.split(" ").map((number) => parseFloat(number) / 100)),
])) as Record<ScratchShape, number[][]>;

/** The reveal threshold counts only pixels the guest can actually scratch. */
export function insideScratchShape(shape: ScratchShape, x: number, y: number): boolean {
  if (shape === "box") return true;
  if (shape === "round") return (x - 0.5) ** 2 + (y - 0.5) ** 2 <= 0.25;
  const points = SHAPE_POINTS[shape];
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
