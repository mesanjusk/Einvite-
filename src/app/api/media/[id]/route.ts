import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteImage, isCloudinaryConfigured } from "@/lib/media/cloudinary";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const media = await db.media.findUnique({ where: { id }, include: { invitation: true } });
  if (!media || media.invitation.userId !== session.user.id) {
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
