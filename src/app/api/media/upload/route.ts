import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { uploadImageBuffer, isCloudinaryConfigured } from "@/lib/media/cloudinary";
import { authorizeInvitationAccess } from "@/lib/invitation-access";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_PHOTOS_PER_INVITATION = 30;

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
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 10MB." }, { status: 400 });
  }

  const invitation = await authorizeInvitationAccess(invitationId);
  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  const existingCount = await db.media.count({ where: { invitationId } });
  if (existingCount >= MAX_PHOTOS_PER_INVITATION) {
    return NextResponse.json({ error: "Photo limit reached for this invitation." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadImageBuffer(buffer, {
    folder: `wedding-studio/${invitation.userId ?? invitation.id}`,
  });

  const media = await db.media.create({
    data: {
      invitationId,
      url: uploaded.url,
      cloudinaryId: uploaded.publicId,
      type: "IMAGE",
      width: uploaded.width,
      height: uploaded.height,
      order: existingCount,
    },
  });

  return NextResponse.json(media);
}
