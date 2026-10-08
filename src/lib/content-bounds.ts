export function contentCorrection(frame: { left: number; right: number; top: number; bottom: number }, layer: { left: number; right: number; top: number; bottom: number }, margin = 8) {
  return {
    x: layer.left < frame.left + margin ? frame.left + margin - layer.left : layer.right > frame.right - margin ? frame.right - margin - layer.right : 0,
    y: layer.top < frame.top + margin ? frame.top + margin - layer.top : layer.bottom > frame.bottom - margin ? frame.bottom - margin - layer.bottom : 0,
  };
}
