import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  deleteImage,
  isCloudinaryConfigured,
  uploadIntroVideoBuffer,
} from "@/lib/media/cloudinary";
import { authorizeInvitationAccess } from "@/lib/invitation-access";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export async function POST(request: Request) {
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Media storage isn't configured. Add CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET to .env.",
      },
      { status: 501 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const invitationId = formData.get("invitationId");

  if (!(file instanceof File) || typeof invitationId !== "string") {
    return NextResponse.json({ error: "file and invitationId are required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Use MP4, MOV, or WebM for the intro video." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Intro video upload must be 20MB or smaller." },
      { status: 400 },
    );
  }

  const invitation = await authorizeInvitationAccess(invitationId);
  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const optimized = await uploadIntroVideoBuffer(buffer, {
    folder: "wedding-studio/" + (invitation.userId ?? invitation.id) + "/intro",
  });

  if (invitation.introVideoPublicId) {
    await deleteImage(invitation.introVideoPublicId, "video").catch(() => {});
  }

  const saved = await db.invitation.update({
    where: { id: invitationId },
    data: {
      introVideoPublicId: optimized.publicId,
      introVideoMp4Url: optimized.mp4Url,
      introVideoWebmUrl: optimized.webmUrl,
      introVideoPosterUrl: optimized.posterUrl,
    },
    select: {
      introVideoMp4Url: true,
      introVideoWebmUrl: true,
      introVideoPosterUrl: true,
    },
  });

  return NextResponse.json(saved);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const invitationId = searchParams.get("invitationId");
  if (!invitationId) {
    return NextResponse.json({ error: "invitationId is required" }, { status: 400 });
  }

  const invitation = await authorizeInvitationAccess(invitationId);
  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  if (invitation.introVideoPublicId && isCloudinaryConfigured()) {
    await deleteImage(invitation.introVideoPublicId, "video").catch(() => {});
  }

  await db.invitation.update({
    where: { id: invitationId },
    data: {
      introVideoPublicId: null,
      introVideoMp4Url: null,
      introVideoWebmUrl: null,
      introVideoPosterUrl: null,
    },
  });

  return NextResponse.json({ ok: true });
}
