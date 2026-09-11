/**
 * IPC contract between renderer and main.
 *
 * Every channel name lives here. Payload types live here.
 * Preload imports these. Main imports these.
 * Renderer sees only the API surface, never the channel names.
 */

export type IpcChannels = {
  "app:ping": {
    request: { message: string };
    response: { reply: string; timestamp: number };
  };

  "app:version": {
    request: void;
    response: { app: string; electron: string; node: string; chrome: string };
  };
};

export type IpcChannel = keyof IpcChannels;

export type IpcRequest<C extends IpcChannel> = IpcChannels[C]["request"];
export type IpcResponse<C extends IpcChannel> = IpcChannels[C]["response"];

/**
 * The shape of `window.api` in the renderer.
 * Preload builds this object. Renderer consumes it.
 */
export type AppApi = {
  app: {
    ping: (message: string) => Promise<IpcResponse<"app:ping">>;
    version: () => Promise<IpcResponse<"app:version">>;
  };
};

// Augment the global Window interface so `window.api` is typed in React.
declare global {
  interface Window {
    api: AppApi;
  }
}