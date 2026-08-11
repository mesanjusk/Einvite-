import { NextResponse } from "next/server";

import { isCloudinaryConfigured, uploadAudioBuffer } from "@/lib/media/cloudinary";
import { authorizeInvitationAccess } from "@/lib/invitation-access";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB

// Lets a couple (signed-in owner or guest with a valid draft/owner cookie)
// upload their own background-music clip for their invitation, instead of
// only picking from the shared preset MusicTrack catalog.
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
  if (!file.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Only audio uploads are supported." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 15MB." }, { status: 400 });
  }

  const invitation = await authorizeInvitationAccess(invitationId);
  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadAudioBuffer(buffer, {
    folder: `wedding-studio/${invitation.userId ?? invitation.id}`,
  });

  return NextResponse.json({ url: uploaded.url });
}
