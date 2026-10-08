/** Send a small image or video frame, never the original large media file. */
export async function designPreview(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    let source: CanvasImageSource;
    let width: number; let height: number;
    if (file.type.startsWith("video/")) {
      const video = document.createElement("video"); video.muted = true; video.preload = "auto"; video.src = url;
      async function waitForVideo(event: "loadeddata" | "seeked") {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => { cleanup(); reject(new Error("Video preview timed out. Manual editing is available.")); }, 10000);
          const cleanup = () => { clearTimeout(timer); video.removeEventListener(event, done); video.removeEventListener("error", fail); };
          const done = () => { cleanup(); resolve(); }; const fail = () => { cleanup(); reject(new Error("Video frame could not be read.")); };
          video.addEventListener(event, done, { once: true }); video.addEventListener("error", fail, { once: true });
        });
      }
      await waitForVideo("loadeddata");
      if (video.duration > 1 && Number.isFinite(video.duration)) { const ready = waitForVideo("seeked"); video.currentTime = Math.min(1, video.duration / 2); await ready; }
      source = video; width = video.videoWidth; height = video.videoHeight;
    } else { const bitmap = await createImageBitmap(file); source = bitmap; width = bitmap.width; height = bitmap.height; }
    const canvas = document.createElement("canvas"); const scale = Math.min(1, 768 / Math.max(width, height)); canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d"); if (!context) throw new Error("Image preview unavailable."); context.drawImage(source, 0, 0, canvas.width, canvas.height);
    if (source instanceof ImageBitmap) source.close();
    return canvas.toDataURL("image/jpeg", 0.65).split(",")[1];
  } finally { URL.revokeObjectURL(url); }
}
