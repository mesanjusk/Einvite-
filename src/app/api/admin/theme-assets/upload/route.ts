import { NextResponse } from "next/server";

import { getAdmin } from "@/lib/admin-guard";
import {
  isCloudinaryConfigured,
  uploadImageBuffer,
  uploadIntroVideoBuffer,
} from "@/lib/media/cloudinary";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Media storage is not configured." },
      { status: 501 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (kind === "video") {
    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Choose a video file." }, { status: 400 });
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ error: "Video is larger than 40MB." }, { status: 400 });
    }
    const uploaded = await uploadIntroVideoBuffer(buffer, {
      folder: "wedding-studio/theme-reveals",
    });
    return NextResponse.json({
      type: "video",
      url: uploaded.mp4Url,
      webmUrl: uploaded.webmUrl,
      posterUrl: uploaded.posterUrl,
    });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image is larger than 12MB." }, { status: 400 });
  }

  const uploaded = await uploadImageBuffer(buffer, {
    folder: "wedding-studio/theme-sections",
  });
  return NextResponse.json({ type: "image", url: uploaded.url });
}
