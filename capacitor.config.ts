import type { CapacitorConfig } from "@capacitor/cli";

// The phone apps open the live site, so office data stays on the server and
// every device sees the same records. Set APP_SERVER_URL before `npx cap sync`.
const serverUrl = process.env.APP_SERVER_URL?.replace(/\/+$/, "");
const serverHost = (() => {
  if (!serverUrl) return undefined;
  try {
    return new URL(serverUrl).hostname;
  } catch {
    return undefined;
  }
})();

const config: CapacitorConfig = {
  appId: "com.motordrivingschool.software",
  appName: "Driving School",
  webDir: "mobile-shell",
  server: serverUrl
    ? {
        url: `${serverUrl}/dashboard`,
        cleartext: false,
        androidScheme: "https",
        iosScheme: "https",
        ...(serverHost ? { allowNavigation: [serverHost] } : {}),
      }
    : undefined,
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    allowsLinkPreview: false,
    contentInset: "automatic",
    scrollEnabled: true,
  },
};

export default config;
