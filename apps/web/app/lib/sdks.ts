export type Sdk = {
   platform: string;
   package: string;
   description: string;
   status: "available" | "coming-soon";
   href?: string;
};

/** Single source of truth for the SDK lineup — shown on both /sdks and /developers. */
export const sdks: Sdk[] = [
   {
      platform: "JavaScript / TypeScript",
      package: "@purplecallio/sdk",
      description:
         "The headless call engine every other SDK is built on: connection state, signaling, and WebRTC media, with no UI opinions.",
      status: "available",
      href: "/docs/javascript",
   },
   {
      platform: "React",
      package: "@purplecallio/react",
      description:
         "A MeetingProvider, hooks, and ready-made components for composing a branded call interface in a React app.",
      status: "available",
      href: "/docs/react",
   },
   {
      platform: "Angular",
      package: "@purplecallio/angular",
      description:
         "An injectable PurpleCallioService exposing connection state, participants, and media as RxJS observables, plus a video-binding directive.",
      status: "available",
      href: "/docs/angular",
   },
   {
      platform: "React Native",
      package: "@purplecallio/react-native",
      description:
         "Reuses the same call engine on top of react-native-webrtc, with permission handling, camera switching, and background/foreground lifecycle built in.",
      status: "available",
      href: "/docs/react-native",
   },
   {
      platform: "Vue",
      package: "@purplecallio/vue",
      description:
         "A usePurpleCallio() composable exposing connection state, participants, and media as reactive refs for Vue 3 applications.",
      status: "available",
      href: "/docs/vue",
   },
   {
      platform: "Svelte",
      package: "@purplecallio/svelte",
      description:
         "A createPurpleCallio() factory exposing connection state, participants, and media as Svelte stores.",
      status: "available",
      href: "/docs/svelte",
   },
   {
      platform: "Flutter",
      package: "PurpleCallio Flutter SDK",
      description: "A native Dart package for iOS and Android apps built with Flutter.",
      status: "coming-soon",
   },
   {
      platform: "iOS",
      package: "PurpleCallio iOS SDK",
      description: "A native Swift package for iOS apps.",
      status: "coming-soon",
   },
   {
      platform: "Android",
      package: "PurpleCallio Android SDK",
      description: "A native Kotlin library for Android apps.",
      status: "coming-soon",
   },
];
