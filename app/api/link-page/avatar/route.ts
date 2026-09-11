import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getSupabasePublicStorageUrl,
  supabaseStorageFetch,
} from "@/lib/supabase/admin";
import {
  LINKCRAFT_ACCESS_COOKIE,
  getAuthUser,
} from "@/lib/supabase/auth";

export const runtime = "nodejs";

const AVATAR_BUCKET = "linkcraft-avatars";
const MAX_COMPRESSED_BYTES = 300 * 1024;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(LINKCRAFT_ACCESS_COOKIE)?.value;
    const user = await getAuthUser(accessToken);

    if (!user || !accessToken) {
      return NextResponse.json(
        { error: "Your session has expired. Sign in again." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const avatar = formData.get("avatar");

    if (!(avatar instanceof File)) {
      return NextResponse.json(
        { error: "Choose an image to upload." },
        { status: 400 },
      );
    }

    if (avatar.type !== "image/webp") {
      return NextResponse.json(
        { error: "LinkCraft stores profile photos as compressed WebP images." },
        { status: 415 },
      );
    }

    if (avatar.size <= 0 || avatar.size > MAX_COMPRESSED_BYTES) {
      return NextResponse.json(
        { error: "Compressed profile image must be 300 KB or smaller." },
        { status: 413 },
      );
    }

    const objectPath = `${user.id}/avatar.webp`;
    const encodedPath = objectPath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    const uploadResponse = await supabaseStorageFetch(
      `object/${AVATAR_BUCKET}/${encodedPath}`,
      accessToken,
      {
        method: "POST",
        headers: {
          "Content-Type": "image/webp",
          "x-upsert": "true",
          "cache-control": "3600",
        },
        body: avatar,
      },
    );

    if (!uploadResponse.ok) {
      let message = "Unable to upload profile image.";
      try {
        const payload = (await uploadResponse.json()) as {
          message?: string;
          error?: string;
        };
        message = payload.message || payload.error || message;
      } catch {
        // Keep the safe fallback message.
      }

      console.error("LinkCraft avatar upload failed", uploadResponse.status, message);
      return NextResponse.json({ error: message }, { status: uploadResponse.status });
    }

    const publicUrl = getSupabasePublicStorageUrl(AVATAR_BUCKET, objectPath);
    const avatarUrl = `${publicUrl}?v=${Date.now()}`;

    return NextResponse.json({
      avatarUrl,
      size: avatar.size,
    });
  } catch (error) {
    console.error("LinkCraft avatar upload error", error);
    return NextResponse.json(
      { error: "Profile image upload is temporarily unavailable." },
      { status: 503 },
    );
  }
}
