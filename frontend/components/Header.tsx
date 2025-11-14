'use client';

import { WalletButton } from './wallet-button';

export default function Header() {
  return (
    <header className="bg-linear-to-r from-green-600 to-emerald-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div>
              <h1 className="text-2xl font-bold">GreenDeFi</h1>
              <p className="text-xs text-green-100">Carbon-Negative Lending</p>
            </div>
          </div>

          <nav className="hidden md:flex space-x-6">
            <a href="/" className="hover:text-green-200 transition">Dashboard</a>
            <a href="/lend" className="hover:text-green-200 transition">Lend/Borrow</a>
            <a href="/rewards" className="hover:text-green-200 transition">Rewards</a>
            <a href="/leaderboard" className="hover:text-green-200 transition">Leaderboard</a>
            <a href="/staking" className="hover:text-green-200 transition">Staking</a>
          </nav>

          <WalletButton />
        </div>
      </div>
    </header>
  );
}
