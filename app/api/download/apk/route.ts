import { readFile } from "node:fs/promises";
import path from "node:path";

import { APK_FILE } from "@/lib/subscription/config";
import { requestForToken } from "@/lib/subscription/requests";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const subscription = await requestForToken(token);
  if (!subscription || subscription.status !== "verified") {
    return new Response("Payment not verified.", { status: 403 });
  }
  try {
    const bytes = await readFile(path.join(process.cwd(), APK_FILE));
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="motor-driving-school-software.apk"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("The Android file is not ready yet.", { status: 404 });
  }
}
