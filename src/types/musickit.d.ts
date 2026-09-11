export {};

interface MusicKitInstance {
  authorize: () => Promise<string>;
  musicUserToken: string;
}

interface MusicKitStatic {
  configure: (config: {
    developerToken: string;
    app: { name: string; build: string };
  }) => MusicKitInstance;
  getInstance: () => MusicKitInstance;
}

declare global {
  interface Window {
    MusicKit?: MusicKitStatic;
  }
}
