import { v2 as cloudinary } from "cloudinary";

let configured = false;

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function ensureConfigured() {
  if (configured) return;
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary isn't configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.",
    );
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  configured = true;
}

export async function uploadImageBuffer(
  buffer: Buffer,
  options: { folder: string },
) {
  ensureConfigured();

  return new Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        // Auto-optimize: strip to WebP/AVIF as the browser supports, cap
        // dimensions, and let Cloudinary pick quality — matches the
        // "compress / WebP / lazy" requirement without a custom pipeline.
        transformation: [
          { width: 2000, height: 2000, crop: "limit" },
          { fetch_format: "auto", quality: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );
    uploadStream.end(buffer);
  });
}

export async function uploadVideoBuffer(
  buffer: Buffer,
  options: { folder: string },
) {
  ensureConfigured();

  return new Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: "video",
        // Cap resolution and let Cloudinary pick an efficient codec/bitrate —
        // guests' phone videos can be huge; this keeps gallery playback light.
        transformation: [{ width: 1280, height: 1280, crop: "limit", quality: "auto" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );
    uploadStream.end(buffer);
  });
}

export async function uploadIntroVideoBuffer(
  buffer: Buffer,
  options: { folder: string },
) {
  ensureConfigured();

  const uploaded = await new Promise<{
    publicId: string;
    width: number;
    height: number;
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: "video",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );
    uploadStream.end(buffer);
  });

  const mp4Url = cloudinary.url(uploaded.publicId, {
    resource_type: "video",
    secure: true,
    format: "mp4",
    transformation: [
      { start_offset: 0, end_offset: 5 },
      { width: 540, height: 960, crop: "fill", gravity: "auto" },
      { fps: 24 },
      { audio_codec: "none" },
      { quality: "auto:eco" },
      { video_codec: "h264" },
    ],
  });

  const webmUrl = cloudinary.url(uploaded.publicId, {
    resource_type: "video",
    secure: true,
    format: "webm",
    transformation: [
      { start_offset: 0, end_offset: 5 },
      { width: 540, height: 960, crop: "fill", gravity: "auto" },
      { fps: 24 },
      { audio_codec: "none" },
      { quality: "auto:eco" },
      { video_codec: "vp9" },
    ],
  });

  const posterUrl = cloudinary.url(uploaded.publicId, {
    resource_type: "video",
    secure: true,
    format: "webp",
    transformation: [
      { start_offset: 0.2 },
      { width: 540, height: 960, crop: "fill", gravity: "auto" },
      { quality: "auto:eco" },
    ],
  });

  return {
    publicId: uploaded.publicId,
    width: uploaded.width,
    height: uploaded.height,
    mp4Url,
    webmUrl,
    posterUrl,
  };
}

export async function uploadAudioBuffer(
  buffer: Buffer,
  options: { folder: string },
) {
  ensureConfigured();

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      // Cloudinary has no dedicated "audio" resource type — audio files go
      // through "video", which is also what lets it accept/serve mp3s.
      { folder: options.folder, resource_type: "video" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    uploadStream.end(buffer);
  });
}

export async function deleteImage(
  publicId: string,
  resourceType: "image" | "video" = "image",
) {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
