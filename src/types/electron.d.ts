export {};

declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => string;
    };
  }
}