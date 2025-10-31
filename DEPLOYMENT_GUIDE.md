# Smart Contract Deployment Guide

This guide will help you deploy the Tourist ID NFT smart contract to Polygon Amoy testnet.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MetaMask** wallet with Polygon Amoy testnet configured
3. **Test MATIC** tokens from the faucet
4. **Private key** of your deployer wallet

## Setup

### 1. Install Dependencies

```bash
cd contracts
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your values:

```env
PRIVATE_KEY=your_private_key_without_0x_prefix
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
POLYGONSCAN_API_KEY=your_api_key_for_verification
```

### 3. Get Test MATIC

Visit the Polygon faucet to get test MATIC tokens:
- https://faucet.polygon.technology/
- Select "Polygon Amoy" network
- Enter your wallet address
- Request test tokens

You need at least 0.1 MATIC for deployment.

## Deployment

### 1. Compile the Contract

```bash
npm run compile
```

### 2. Deploy to Polygon Amoy

```bash
npm run deploy:amoy
```

The deployment script will:
- Deploy the TouristID contract
- Wait for confirmations
- Display the contract address
- Show transaction details

### 3. Verify the Contract (Optional)

```bash
npm run verify:amoy <CONTRACT_ADDRESS>
```

Replace `<CONTRACT_ADDRESS>` with the deployed contract address.

## Update React Native App

After successful deployment, update the contract address in your React Native app:

1. Copy the contract address from the deployment output
2. Open `services/blockchainService.js`
3. Update the contract address:

```javascript
// Update this line with your deployed contract address
CONTRACT_CONFIG.address = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
```

Or use the helper function:

```javascript
import blockchainService from './services/blockchainService';
blockchainService.updateContractAddress('YOUR_DEPLOYED_CONTRACT_ADDRESS');
```

## Testing

### 1. Verify Deployment

Check your contract on Polygon Amoy explorer:
- https://amoy.polygonscan.com/address/YOUR_CONTRACT_ADDRESS

### 2. Test Minting

1. Connect your wallet in the React Native app
2. Fill out the tourist ID form
3. Try minting a Tourist ID NFT
4. Check the transaction on the explorer

## Network Details

**Polygon Amoy Testnet:**
- Chain ID: 80002
- RPC URL: https://rpc-amoy.polygon.technology/
- Explorer: https://amoy.polygonscan.com
- Faucet: https://faucet.polygon.technology/

## Troubleshooting

### Common Issues

1. **"Insufficient funds"**
   - Get more test MATIC from the faucet
   - Make sure you're on the correct network

2. **"Nonce too high"**
   - Reset your MetaMask account (Settings > Advanced > Reset Account)

3. **"Contract verification failed"**
   - Make sure you have the correct PolygonScan API key
   - Wait a few minutes after deployment before verifying

4. **"Network not supported"**
   - Add Polygon Amoy testnet to MetaMask manually:
     - Network Name: Polygon Amoy Testnet
     - RPC URL: https://rpc-amoy.polygon.technology/
     - Chain ID: 80002
     - Currency Symbol: MATIC
     - Block Explorer: https://amoy.polygonscan.com

### Getting Help

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your wallet has sufficient MATIC balance
3. Ensure you're connected to the correct network
4. Check the transaction on PolygonScan for more details

## Security Notes

⚠️ **Important Security Reminders:**

1. **Never share your private key** - Keep it secure and never commit it to version control
2. **Use test networks only** - This setup is for testnet only, not production
3. **Verify contracts** - Always verify contract source code on the explorer
4. **Test thoroughly** - Test all functionality before moving to mainnet

## Next Steps

After successful deployment:

1. Test the minting functionality in your app
2. Verify NFTs appear in wallets and on OpenSea testnet
3. Test the soulbound (non-transferable) functionality
4. Consider adding additional features like metadata updates
5. Plan for mainnet deployment with proper security audits

---

**Contract Features:**

✅ ERC-721 compliant NFTs  
✅ Soulbound (non-transferable) tokens  
✅ Encrypted data storage  
✅ Passport number uniqueness  
✅ Owner-only updates  
✅ Event emission for tracking  
✅ Gas optimized with OpenZeppelin  
