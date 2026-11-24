import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: env.appName,
    short_name: "Driving School",
    description: "Applicants, training, fees, documents, and staff for a motor driving school.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f3f0e8",
    theme_color: "#1a1916",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
