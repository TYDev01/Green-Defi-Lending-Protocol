'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getContract, CONTRACTS, LENDING_POOL_ABI, formatHBAR, parseHBAR } from '@/lib/contracts';
import { ArrowDown, ArrowUp, RefreshCw, Wallet as WalletIcon } from 'lucide-react';

export default function LendBorrow() {
  const { account, isConnected, signer, provider } = useWallet();
  const [activeTab, setActiveTab] = useState<'deposit' | 'borrow'>('deposit');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [userAccount, setUserAccount] = useState<any>(null);
  const [poolStats, setPoolStats] = useState<any>(null);

  useEffect(() => {
    if (isConnected && account) {
      loadUserData();
      loadPoolStats();
    }
  }, [isConnected, account]);

  const loadUserData = async () => {
    try {
      if (!provider || !account) return;
      
      const contract = getContract(CONTRACTS.LENDING_POOL, LENDING_POOL_ABI, provider);
      const data = await contract.userAccounts(account);
      
      setUserAccount({
        deposited: data[0],
        borrowed: data[1],
        lastUpdateTime: data[2],
        accruedInterest: data[3],
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadPoolStats = async () => {
    try {
      if (!provider) return;
      
      const contract = getContract(CONTRACTS.LENDING_POOL, LENDING_POOL_ABI, provider);
      const stats = await contract.poolStats();
      const utilization = await contract.getUtilizationRate();
      
      setPoolStats({
        totalDeposits: stats[0],
        totalBorrows: stats[1],
        utilization,
      });
    } catch (error) {
      console.error('Error loading pool stats:', error);
    }
  };

  const handleDeposit = async () => {
    try {
      if (!signer || !amount) return;
      
      setLoading(true);
      const contract = getContract(CONTRACTS.LENDING_POOL, LENDING_POOL_ABI, signer);
      const tx = await contract.deposit({ value: parseHBAR(amount) });
      await tx.wait();
      
      alert('Deposit successful!');
      setAmount('');
      await loadUserData();
      await loadPoolStats();
    } catch (error: any) {
      console.error('Error depositing:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    try {
      if (!signer || !amount) return;
      
      setLoading(true);
      const contract = getContract(CONTRACTS.LENDING_POOL, LENDING_POOL_ABI, signer);
      const tx = await contract.borrow(parseHBAR(amount));
      await tx.wait();
      
      alert('Borrow successful!');
      setAmount('');
      await loadUserData();
      await loadPoolStats();
    } catch (error: any) {
      console.error('Error borrowing:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      if (!signer || !amount) return;
      
      setLoading(true);
      const contract = getContract(CONTRACTS.LENDING_POOL, LENDING_POOL_ABI, signer);
      const tx = await contract.withdraw(parseHBAR(amount));
      await tx.wait();
      
      alert('Withdrawal successful!');
      setAmount('');
      await loadUserData();
      await loadPoolStats();
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async () => {
    try {
      if (!signer || !amount) return;
      
      setLoading(true);
      const contract = getContract(CONTRACTS.LENDING_POOL, LENDING_POOL_ABI, signer);
      const tx = await contract.repay({ value: parseHBAR(amount) });
      await tx.wait();
      
      alert('Repayment successful!');
      setAmount('');
      await loadUserData();
      await loadPoolStats();
    } catch (error: any) {
      console.error('Error repaying:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <WalletIcon size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to lend or borrow</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Lend & Borrow</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Action Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Tabs */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  activeTab === 'deposit'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ArrowDown className="inline mr-2" size={20} />
                Deposit
              </button>
              <button
                onClick={() => setActiveTab('borrow')}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  activeTab === 'borrow'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ArrowUp className="inline mr-2" size={20} />
                Borrow
              </button>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount (HBAR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {activeTab === 'deposit' ? (
                <>
                  <button
                    onClick={handleDeposit}
                    disabled={loading || !amount}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
                  >
                    {loading ? 'Processing...' : 'Deposit HBAR'}
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={loading || !amount}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
                  >
                    {loading ? 'Processing...' : 'Withdraw HBAR'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBorrow}
                    disabled={loading || !amount}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
                  >
                    {loading ? 'Processing...' : 'Borrow HBAR'}
                  </button>
                  <button
                    onClick={handleRepay}
                    disabled={loading || !amount}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
                  >
                    {loading ? 'Processing...' : 'Repay HBAR'}
                  </button>
                </>
              )}
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Green Tip:</strong> Offset carbon emissions to reduce your interest rate by up to 50%!
              </p>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="space-y-6">
          {/* Your Position */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Your Position</h3>
              <RefreshCw
                className="cursor-pointer text-gray-400 hover:text-gray-600"
                size={20}
                onClick={() => { loadUserData(); loadPoolStats(); }}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Deposited</span>
                <span className="font-bold text-green-600">
                  {userAccount ? formatHBAR(userAccount.deposited) : '0.00'} HBAR
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Borrowed</span>
                <span className="font-bold text-purple-600">
                  {userAccount ? formatHBAR(userAccount.borrowed) : '0.00'} HBAR
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interest Accrued</span>
                <span className="font-bold text-orange-600">
                  {userAccount ? formatHBAR(userAccount.accruedInterest) : '0.00'} HBAR
                </span>
              </div>
            </div>
          </div>

          {/* Pool Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-4">Pool Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Deposits</span>
                <span className="font-bold">
                  {poolStats ? formatHBAR(poolStats.totalDeposits) : '0.00'} HBAR
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Borrows</span>
                <span className="font-bold">
                  {poolStats ? formatHBAR(poolStats.totalBorrows) : '0.00'} HBAR
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Utilization</span>
                <span className="font-bold">
                  {poolStats ? poolStats.utilization.toString() : '0'}%
                </span>
              </div>
            </div>
          </div>

          {/* Interest Rates */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-bold text-lg mb-4">Current Rates</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Supply APY</span>
                <span className="font-bold text-2xl">5.2%</span>
              </div>
              <div className="flex justify-between">
                <span>Borrow APR</span>
                <span className="font-bold text-2xl">8.5%</span>
              </div>
              <div className="text-sm text-green-100 pt-2 border-t border-green-400">
                Your green discount: -20%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
