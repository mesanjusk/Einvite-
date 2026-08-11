import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { deleteImage, isCloudinaryConfigured } from "@/lib/media/cloudinary";
import { authorizeInvitationAccess } from "@/lib/invitation-access";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const media = await db.media.findUnique({ where: { id } });
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const invitation = await authorizeInvitationAccess(media.invitationId);
  if (!invitation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (media.cloudinaryId && isCloudinaryConfigured()) {
    await deleteImage(media.cloudinaryId).catch((error) =>
      console.error("Failed to delete Cloudinary asset", error),
    );
  }

  await db.media.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
