'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  balance: string;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  provider: null,
  signer: null,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  balance: '0',
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [balance, setBalance] = useState('0');

  const connectWallet = async () => {
    try {
      // Check if HashPack is installed
      if (typeof window.ethereum !== 'undefined') {
        // Check if it's HashPack specifically
        const isHashPack = window.ethereum.isHashPack;
        
        if (!isHashPack) {
          alert('Please install HashPack wallet extension from https://www.hashpack.app/');
          window.open('https://www.hashpack.app/', '_blank');
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Request accounts
        const accounts = await provider.send('eth_requestAccounts', []);
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          
          // Verify we're on Hedera Testnet (Chain ID 296)
          const network = await provider.getNetwork();
          if (network.chainId !== BigInt(296)) {
            alert('Please switch to Hedera Testnet in HashPack (Chain ID: 296)');
            return;
          }
          
          setProvider(provider);
          setSigner(signer);
          setAccount(address);
          
          // Get balance
          const balance = await provider.getBalance(address);
          setBalance(ethers.formatEther(balance));
          
          // Store in localStorage
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('walletAddress', address);
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setBalance('0');
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
  };

  // Auto-connect on mount
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'true') {
      connectWallet();
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: unknown) => {
        const accs = accounts as string[];
        if (accs.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (typeof window.ethereum !== 'undefined') {
          window.ethereum.removeAllListeners('accountsChanged');
          window.ethereum.removeAllListeners('chainChanged');
        }
      };
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        provider,
        signer,
        isConnected: !!account,
        connectWallet,
        disconnectWallet,
        balance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
