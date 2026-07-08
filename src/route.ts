import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: { event_key: string } }
) {
  try {
    const eventKey = params.event_key;

    const galleryPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "galleries",
      eventKey
    );

    if (!fs.existsSync(galleryPath)) {
      return NextResponse.json({ images: [] });
    }

    const files = fs.readdirSync(galleryPath);

    const images = files
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map((f) => `/uploads/galleries/${eventKey}/${f}`);

    return NextResponse.json({ images });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}