interface Window {
  ethereum?: {
    isHashPack?: boolean;
    isMetaMask?: boolean;
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (eventName: string, handler: (...args: unknown[]) => void) => void;
    removeAllListeners: (eventName: string) => void;
  };
}
