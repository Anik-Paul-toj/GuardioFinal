
import 'react-native-get-random-values';
import walletConnectService from './walletConnectService';

class BlockchainService {
  constructor() {
    // Initialize WalletConnect service
    walletConnectService.initialize().catch(console.error);
  }

  // Connect to wallet using WalletConnect
  async connectWallet() {
    try {
      // Open WalletConnect modal
      await walletConnectService.openModal();
      
      // Check if connection was successful
      const isConnected = walletConnectService.isWalletConnected();
      if (!isConnected) {
        throw new Error('Wallet connection failed');
      }

      const address = walletConnectService.getWalletAddress();
      if (!address) {
        throw new Error('No wallet address found');
      }

      return {
        address,
        network: { chainId: 80002, name: 'Polygon Amoy' },
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  // Check wallet balance - delegate to walletConnectService
  async getBalance() {
    try {
      return await walletConnectService.getBalance();
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  // Mint Tourist ID NFT - delegate to walletConnectService
  async mintTouristID(userData) {
    try {
      // Ensure wallet is connected
      if (!walletConnectService.isWalletConnected()) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      return await walletConnectService.mintTouristID(userData);
    } catch (error) {
      console.error('Error minting Tourist ID:', error);
      throw error;
    }
  }

  // Check if user has Tourist ID - delegate to walletConnectService
  async checkUserTouristID() {
    try {
      return await walletConnectService.checkUserTouristID();
    } catch (error) {
      console.error('Error checking Tourist ID:', error);
      return null;
    }
  }

  // Disconnect wallet - delegate to walletConnectService
  async disconnect() {
    try {
      await walletConnectService.disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }

  // Check if wallet is connected
  isWalletConnected() {
    return walletConnectService.isWalletConnected();
  }

  // Get wallet address
  getWalletAddress() {
    return walletConnectService.getWalletAddress();
  }
}

// Create and export a singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;
