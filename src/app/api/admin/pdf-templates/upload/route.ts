import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/media/cloudinary";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Media storage isn't configured. Add CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET to your environment.",
      },
      { status: 501 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 10MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadImageBuffer(buffer, { folder: "wedding-studio/pdf-templates" });

  return NextResponse.json({ url: uploaded.url });
}
