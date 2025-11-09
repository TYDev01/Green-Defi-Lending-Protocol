# GreenDeFi Protocol 🌍

A revolutionary DeFi lending protocol on Hedera Hashgraph that rewards borrowers for contributing to verified sustainability projects. Built on Hedera's carbon-negative network.

## Features

- **Lending & Borrowing**: Deposit HBAR to earn interest or borrow against collateral
- **Carbon Credit NFTs**: Earn verified carbon offset NFTs through Guardian integration
- **Dynamic Interest Rates**: Reduce your borrowing costs by up to 50% through carbon offsets
- **Gamified Leaderboard**: Compete to be a top climate champion
- **Climate Fund Vault**: Stake HBAR to support sustainability initiatives
- **Telegram Notifications**: Real-time updates on NFTs, interest rates, and rankings

## Tech Stack

- **Blockchain**: Hedera Hashgraph (EVM)
- **Smart Contracts**: Solidity with Hardhat
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Firebase
- **Verification**: Hedera Guardian Framework
- **Wallet**: HashPack / MetaMask
- **Notifications**: Telegram Bot API

## Project Structure

```
greendefi/
├── contracts/          # Solidity smart contracts
│   ├── LendingPool.sol
│   ├── GreenRewardManager.sol
│   ├── InterestRateModel.sol
│   ├── ClimateFundVault.sol
│   ├── LeaderboardTracker.sol
│   └── interfaces/
├── backend/           # Node.js backend services
│   └── src/
│       ├── server.js
│       └── services/
│           ├── guardianOracle.js
│           ├── telegramBot.js
│           ├── mirrorNodeListener.js
│           └── firebaseService.js
├── frontend/          # Next.js frontend
│   ├── app/
│   ├── components/
│   ├── contexts/
│   └── lib/
└── scripts/           # Deployment scripts
    └── deploy.js
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Hedera testnet account
- Firebase project
- Telegram bot token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd greendefi
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

### Configuration

1. **Create environment files**

   Root `.env`:
   ```
   HEDERA_TESTNET_RPC=https://testnet.hashio.io/api
   PRIVATE_KEY=your_private_key
   OPERATOR_ID=0.0.xxxxx
   OPERATOR_KEY=your_operator_key
   ```

   Backend `.env`:
   ```
   GUARDIAN_API_URL=https://guardian-api-url
   GUARDIAN_API_KEY=your_guardian_api_key
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_PROJECT_ID=your_project_id
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
   ```

   Frontend `.env.local`:
   ```
   NEXT_PUBLIC_HEDERA_RPC=https://testnet.hashio.io/api
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

### Deployment

1. **Compile contracts**
   ```bash
   npm run compile
   ```

2. **Deploy contracts to Hedera testnet**
   ```bash
   npx hardhat run scripts/deploy.js --network hedera_testnet
   ```

3. **Update environment files with deployed contract addresses**

4. **Start the backend**
   ```bash
   cd backend
   npm start
   ```

5. **Start the frontend**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000)

## Smart Contract Architecture

### LendingPool
- Manages deposits, borrows, and repayments
- Integrates with InterestRateModel for dynamic rates
- Applies green discounts via GreenRewardManager

### GreenRewardManager
- Mints carbon credit NFTs verified by Guardian
- Tracks user green profiles and carbon offsets
- Calculates interest rate adjustments (up to 50% reduction)
- Manages NFT retirement for permanent impact

### InterestRateModel
- Implements kinked interest rate model
- Adjusts rates based on pool utilization
- Base rate: 2%, Multiplier: 10%, Jump: 100%, Kink: 80%

### ClimateFundVault
- Staking mechanism for climate project funding
- 8% APY on staked HBAR
- Direct funding of verified sustainability projects

### LeaderboardTracker
- Ranks users by total carbon offset
- Awards badges: Eco Starter, Green Champion, Climate Hero, Earth Guardian
- Provides rank multipliers for additional rewards

## Guardian Integration

The protocol integrates with Hedera Guardian for:

- **Verification**: Carbon credit verification through Guardian APIs
- **NFT Minting**: Automated NFT creation upon verification
- **Data Integrity**: Guardian Verifiable Credentials (VCs)
- **Project Tracking**: Link NFTs to specific sustainability projects

## API Endpoints

### Backend API

- `GET /api/leaderboard` - Get top contributors
- `GET /api/user/:address` - Get user profile
- `GET /api/stats` - Get protocol statistics
- `GET /api/guardian/verification/:id` - Get verification status
- `POST /api/telegram/subscribe` - Subscribe to notifications

## Telegram Bot Commands

- `/start` - Initialize bot and view commands
- `/subscribe <wallet>` - Subscribe to notifications
- `/unsubscribe` - Unsubscribe from notifications
- `/status` - Check subscription status
- `/leaderboard` - View top contributors
- `/stats` - View protocol statistics

## Testing

```bash
# Run contract tests
npm test

# Run frontend tests
cd frontend
npm test

# Run backend tests
cd backend
npm test
```

## Security Considerations

- ✅ ReentrancyGuard on all state-changing functions
- ✅ Access control with Ownable
- ✅ Input validation and bounds checking
- ✅ Safe math operations with Solidity 0.8+
- ⚠️ Audit recommended before mainnet deployment

## Roadmap

- [x] Core lending protocol
- [x] Guardian integration
- [x] Carbon credit NFTs
- [x] Dynamic interest rates
- [x] Telegram notifications
- [x] Gamified leaderboard
- [ ] Multi-token support (USDC, USDT)
- [ ] Governance token (GREEN)
- [ ] DAO governance
- [ ] Mobile app
- [ ] Mainnet deployment

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License

## Contact

- Website: [greendefi.io]()
- Twitter: [@GreenDeFi]()
- Discord: [Join our server]()
- Email: contact@greendefi.io

## Acknowledgments

- Hedera Hashgraph team
- Guardian Framework contributors
- OpenZeppelin for secure contract libraries
- The DeFi and ReFi communities

---

Built with 💚 on Hedera's carbon-negative network
# Green-Defi-Lending-Protocol
