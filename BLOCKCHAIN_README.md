# 🛡️ GuardioFinal - Blockchain Tourist ID System

A comprehensive React Native Expo application with blockchain-based digital tourist identification using NFTs on Polygon Amoy testnet.

## 🚀 Features

### ✅ Completed Features

#### Authentication & Profile Management
- **Real Firebase Authentication** - Email/password sign up and sign in
- **Profile Management** - Comprehensive tourist profile with encrypted data storage
- **Image Upload** - Cloudinary integration for profile photos
- **Data Security** - Firestore for profile data with proper security rules

#### Blockchain Integration
- **Smart Contract** - ERC-721 compliant Tourist ID NFTs
- **Wallet Connectivity** - MetaMask integration for Web3 interactions
- **NFT Minting** - Mint soulbound Tourist ID NFTs on Polygon Amoy
- **Data Encryption** - On-chain encrypted data storage
- **Soulbound Tokens** - Non-transferable identity NFTs

#### User Experience
- **Beautiful UI** - Modern, gradient-based design with animations
- **Progress Tracking** - Step-by-step minting process with visual feedback
- **Error Handling** - Comprehensive error handling and user feedback
- **Responsive Design** - Works on all device sizes

## 🏗️ Architecture

### Frontend (React Native)
```
├── app/
│   ├── auth.tsx                 # Authentication screen
│   ├── mint-tourist-id.tsx      # NFT minting interface
│   ├── personal-id.tsx          # Profile form
│   └── (tabs)/
│       ├── index.tsx            # Home screen
│       └── explore.tsx          # Profile viewer
├── components/
│   ├── WalletConnector.tsx      # Wallet connection modal
│   └── UserProfileView.tsx      # Profile display component
├── services/
│   ├── blockchainService.js     # Web3 and smart contract interactions
│   └── userService.js           # Firestore operations
└── config/
    ├── firebase.js              # Firebase configuration
    └── cloudinary.js            # Image upload configuration
```

### Backend (Smart Contracts)
```
├── contracts/
│   ├── TouristID.sol           # Main NFT contract
│   ├── scripts/deploy.js       # Deployment script
│   ├── test/TouristID.test.js  # Contract tests
│   └── hardhat.config.js       # Hardhat configuration
```

## 🔐 Smart Contract Features

### TouristID Contract
- **ERC-721 Compliant** - Standard NFT functionality
- **Soulbound** - Non-transferable tokens tied to identity
- **Encrypted Data** - Hash-based data storage for privacy
- **Uniqueness** - One Tourist ID per passport number
- **Updatable** - Token owners can update their data
- **Admin Controls** - Contract owner can revoke IDs if needed
- **Event Logging** - All actions are logged for transparency

### Security Features
- **Access Control** - Only token owners can update their data
- **Input Validation** - Comprehensive parameter checking
- **Reentrancy Protection** - Guards against reentrancy attacks
- **Gas Optimization** - Efficient storage and computation
- **Audit Ready** - Clean, well-documented code

## 🌐 Blockchain Integration

### Polygon Amoy Testnet
- **Chain ID**: 80002
- **RPC URL**: https://rpc-amoy.polygon.technology/
- **Explorer**: https://amoy.polygonscan.com
- **Faucet**: https://faucet.polygon.technology/

### Contract Deployment
```bash
# Install dependencies
cd contracts && npm install

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to Polygon Amoy
npm run deploy:amoy
```

## 📱 Mobile App Features

### Tourist ID Minting Process
1. **Profile Creation** - User fills out comprehensive form
2. **Data Validation** - Frontend and backend validation
3. **Photo Upload** - Cloudinary integration for images
4. **Wallet Connection** - MetaMask wallet connectivity
5. **NFT Minting** - Blockchain transaction for NFT creation
6. **Confirmation** - Success feedback with transaction details

### User Experience Flow
```
Sign Up/Sign In → Profile Form → Wallet Connect → Mint NFT → View Tourist ID
```

## 🔧 Setup Instructions

### 1. Prerequisites
- Node.js (v16+)
- React Native development environment
- MetaMask browser extension or mobile app
- Firebase project with Firestore
- Cloudinary account

### 2. Environment Configuration

#### Firebase Setup
```javascript
// config/firebase.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  // ... other config
};
```

#### Smart Contract Deployment
```bash
# Copy environment template
cp contracts/.env.example contracts/.env

# Configure your private key and RPC URL
# Deploy contract
npm run deploy:amoy
```

#### Update Contract Address
```javascript
// services/blockchainService.js
CONTRACT_CONFIG.address = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
```

### 3. Run the Application
```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS/Android
npm run ios
npm run android
```

## 🔒 Security Considerations

### Data Privacy
- **Encrypted Storage** - Sensitive data is encrypted before blockchain storage
- **Minimal On-Chain Data** - Only necessary identifiers stored on-chain
- **Access Control** - User-specific data access through Firebase rules

### Smart Contract Security
- **Soulbound Tokens** - Prevents unauthorized transfers
- **Input Validation** - Comprehensive parameter checking
- **Access Control** - Role-based permissions
- **Reentrancy Guards** - Protection against common attacks

### Best Practices
- **Private Key Security** - Never expose private keys
- **Testnet First** - Always test on testnets before mainnet
- **Regular Audits** - Code review and security audits
- **Error Handling** - Graceful failure handling

## 📊 Testing

### Smart Contract Tests
```bash
cd contracts
npm test
```

### Test Coverage
- ✅ Contract deployment
- ✅ NFT minting functionality
- ✅ Access control
- ✅ Data validation
- ✅ Soulbound properties
- ✅ Admin functions
- ✅ Error handling

## 🚀 Deployment

### Development
1. Configure Firebase and Cloudinary
2. Deploy smart contract to testnet
3. Update contract address in app
4. Test thoroughly on testnet

### Production
1. Security audit of smart contracts
2. Deploy to Polygon mainnet
3. Configure production Firebase rules
4. Submit to app stores

## 🔗 Key Resources

- **Polygon Amoy Faucet**: https://faucet.polygon.technology/
- **Polygon Explorer**: https://amoy.polygonscan.com
- **OpenZeppelin Contracts**: https://openzeppelin.com/contracts/
- **Hardhat Documentation**: https://hardhat.org/docs
- **Firebase Documentation**: https://firebase.google.com/docs

## 📈 Future Enhancements

### Planned Features
- **Real Google OAuth** - Replace fake Google login
- **QR Code Integration** - QR codes for quick ID verification
- **Biometric Verification** - Face ID/Touch ID integration
- **Multi-language Support** - Internationalization
- **Offline Mode** - Local data caching

### Advanced Features
- **Zero-Knowledge Proofs** - Enhanced privacy
- **Cross-Chain Support** - Multiple blockchain networks
- **Government Integration** - API connections to official databases
- **Travel History** - Blockchain-based travel records

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenZeppelin** - Smart contract libraries
- **Polygon** - Blockchain infrastructure
- **Firebase** - Backend services
- **Expo** - React Native framework
- **Cloudinary** - Image management

---

**Built with ❤️ for secure digital identity in the travel industry**
