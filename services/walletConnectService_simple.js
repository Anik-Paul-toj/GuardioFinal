import { ethers } from 'ethers';
import { Alert } from 'react-native';
import 'react-native-get-random-values';

// Polygon Amoy Testnet Configuration
export const POLYGON_AMOY_CONFIG = {
  chainId: 80002,
  name: 'Polygon Amoy Testnet',
  currency: 'MATIC',
  rpcUrl: 'https://rpc-amoy.polygon.technology/',
  blockExplorer: 'https://amoy.polygonscan.com',
  faucet: 'https://faucet.polygon.technology/',
};

// Contract Configuration
export const CONTRACT_CONFIG = {
  address: '0x73773F19b1F31b4c0E63b9f107B6E7472c54A617', // Deployed on Polygon Amoy
  abi: [
    "function mintTouristID(address to, string memory encryptedDataHash, string memory passportNumber, string memory nationality, string memory tokenURI) public returns (uint256)",
    "function getUserTokenId(address user) public view returns (uint256)",
    "function hasValidTouristID(address user) public view returns (bool)",
    "function getTouristData(uint256 tokenId) public view returns (tuple(string encryptedDataHash, string passportNumber, string nationality, uint256 mintedAt, bool isActive))",
    "function totalSupply() public view returns (uint256)",
    "function tokenURI(uint256 tokenId) public view returns (string memory)",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "event TouristIDMinted(address indexed user, uint256 indexed tokenId, string passportNumber, string nationality, uint256 timestamp)"
  ]
};

class SimpleWalletConnectService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.walletAddress = null;
    this.isConnected = false;
  }

  // Initialize the service
  async initialize() {
    console.log('WalletConnect service initialized (Simple mode)');
  }

  // Open a simple connection modal (for now, just show alert)
  async openModal() {
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Connect Wallet',
        'This is a demo implementation of WalletConnect. In a real app, this would open the WalletConnect modal to connect to various wallets.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => reject(new Error('User cancelled'))
          },
          {
            text: 'Simulate Connection',
            onPress: () => this.simulateConnection().then(resolve).catch(reject)
          }
        ]
      );
    });
  }

  // Simulate a wallet connection for demo purposes
  async simulateConnection() {
    try {
      // Create a provider using the RPC URL
      this.provider = new ethers.providers.JsonRpcProvider(POLYGON_AMOY_CONFIG.rpcUrl);
      
      // For demo, create a random wallet
      const wallet = ethers.Wallet.createRandom();
      this.signer = wallet.connect(this.provider);
      this.walletAddress = wallet.address;
      this.isConnected = true;

      // Initialize contract
      if (CONTRACT_CONFIG.address && CONTRACT_CONFIG.abi) {
        this.contract = new ethers.Contract(
          CONTRACT_CONFIG.address,
          CONTRACT_CONFIG.abi,
          this.signer
        );
      }

      console.log('Simulated wallet connection:', this.walletAddress);
      return true;
    } catch (error) {
      console.error('Error simulating wallet connection:', error);
      throw error;
    }
  }

  // Get wallet connection status
  isWalletConnected() {
    return this.isConnected && this.walletAddress;
  }

  // Get wallet address
  getWalletAddress() {
    return this.walletAddress;
  }

  // Get wallet balance
  async getBalance() {
    if (!this.provider || !this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.provider.getBalance(this.walletAddress);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      // Return 0 for demo
      return '0.1'; // Simulated balance
    }
  }

  // Generate NFT metadata
  generateNFTMetadata(userData) {
    return {
      name: `Tourist ID - ${userData.fullName}`,
      description: 'Blockchain-based Digital Tourist Identification',
      image: userData.photoUrl || 'https://via.placeholder.com/400x400?text=Tourist+ID',
      attributes: [
        {
          trait_type: 'Nationality',
          value: userData.nationality,
        },
        {
          trait_type: 'Issue Date',
          value: new Date().toISOString().split('T')[0],
        },
        {
          trait_type: 'Document Type',
          value: 'Digital Tourist ID',
        },
        {
          trait_type: 'Blockchain',
          value: 'Polygon',
        },
      ],
      external_url: 'https://guardio.app',
    };
  }

  // Upload metadata to IPFS (simplified)
  async uploadMetadataToIPFS(metadata) {
    try {
      const jsonString = JSON.stringify(metadata, null, 2);
      const base64Data = btoa(jsonString);
      
      // Return a data URI for demo (in production, this would be an IPFS hash)
      return `data:application/json;base64,${base64Data}`;
    } catch (error) {
      console.error('Error uploading metadata:', error);
      throw error;
    }
  }

  // Encrypt user data (simplified)
  encryptUserData(userData) {
    const sensitiveData = {
      fullName: userData.fullName,
      passportNumber: userData.passportNumber,
      governmentId: userData.governmentId,
      age: userData.age,
      timestamp: Date.now(),
    };

    // Simple encryption for demo (use proper encryption in production)
    const dataString = JSON.stringify(sensitiveData);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
    
    return hash;
  }

  // Mint Tourist ID NFT (simulated)
  async mintTouristID(userData) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

      // Generate a fake token ID and transaction hash
      const tokenId = Math.floor(Math.random() * 10000) + 1;
      const transactionHash = '0x' + Math.random().toString(16).substring(2, 66);
      const blockNumber = Math.floor(Math.random() * 100000) + 1000000;

      return {
        success: true,
        tokenId: tokenId.toString(),
        transactionHash,
        blockNumber,
        contractAddress: CONTRACT_CONFIG.address,
        explorerUrl: `${POLYGON_AMOY_CONFIG.blockExplorer}/tx/${transactionHash}`,
      };
    } catch (error) {
      console.error('Error minting Tourist ID:', error);
      throw error;
    }
  }

  // Check if user has a Tourist ID (simulated)
  async checkUserTouristID() {
    if (!this.walletAddress) {
      return null;
    }

    try {
      // Simulate checking - randomly return null or existing ID
      const hasID = Math.random() > 0.7; // 30% chance of having existing ID
      
      if (!hasID) {
        return null;
      }

      const tokenId = Math.floor(Math.random() * 1000) + 1;
      return {
        tokenId: tokenId.toString(),
        tokenURI: `https://example.com/metadata/${tokenId}`,
        data: {
          encryptedDataHash: '0x' + Math.random().toString(16).substring(2, 66),
          passportNumber: 'DEMO123456',
          nationality: 'Demo Country',
          mintedAt: new Date(),
          isActive: true,
        },
        explorerUrl: `${POLYGON_AMOY_CONFIG.blockExplorer}/token/${CONTRACT_CONFIG.address}?a=${tokenId}`,
      };
    } catch (error) {
      console.error('Error checking Tourist ID:', error);
      return null;
    }
  }

  // Disconnect wallet
  async disconnect() {
    try {
      this.provider = null;
      this.signer = null;
      this.contract = null;
      this.walletAddress = null;
      this.isConnected = false;
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }
}

// Create and export a singleton instance
const walletConnectService = new SimpleWalletConnectService();

export default walletConnectService;
