import type { CapacitorConfig } from "@capacitor/cli";

// The Android app opens the live site, so office data stays on the server and
// every phone sees the same records. Set APP_SERVER_URL before `npx cap sync`.
const serverUrl = process.env.APP_SERVER_URL?.replace(/\/+$/, "");

const config: CapacitorConfig = {
  appId: "com.motordrivingschool.software",
  appName: "Driving School",
  webDir: "mobile-shell",
  server: serverUrl
    ? { url: `${serverUrl}/dashboard`, cleartext: false, androidScheme: "https" }
    : undefined,
  android: {
    allowMixedContent: false,
  },
};

export default config;
