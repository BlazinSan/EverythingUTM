import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.everythingutm.app",
  appName: "EverythingUTM",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    backgroundColor: "#0e1116",
  },
};

export default config;
