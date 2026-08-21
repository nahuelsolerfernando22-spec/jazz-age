import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "studio.tibet.cuervodorado",
  appName: "El Cuervo Dorado",
  webDir: "dist/client",
  server: {
    androidScheme: "https",
  },
  android: {
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
    backgroundColor: "#0d0906",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0d0906",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0d0906",
      overlaysWebView: false,
    },
  },
};

export default config;
