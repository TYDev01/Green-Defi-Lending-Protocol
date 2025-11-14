'use client';

import { useDAppConnector } from './client-providers';

export function WalletButton() {
  const context = useDAppConnector();
  
  if (!context) {
    return null;
  }

  const { dAppConnector, userAccountId, disconnect, refresh } = context;

  const handleLogin = async () => {
    if (dAppConnector) {
      try {
        await dAppConnector.openModal();
        if (refresh) refresh();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const handleDisconnect = () => {
    if (disconnect) {
      void disconnect();
    }
  };

  if (!userAccountId) {
    return (
      <button
        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={handleLogin}
        disabled={!dAppConnector}
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium border border-green-200">
        {`${userAccountId.slice(0, 8)}...${userAccountId.slice(-6)}`}
      </div>
      <button
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
        onClick={handleDisconnect}
        disabled={!dAppConnector}
      >
        Disconnect
      </button>
    </div>
  );
}
