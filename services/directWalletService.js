import { ethers } from 'ethers';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

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

class DirectWalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.walletAddress = null;
    this.isConnected = false;
  }

  // Initialize the direct wallet service
  async initialize() {
    try {
      console.log('Initializing direct wallet service...');
      // Create provider using RPC
      this.provider = new ethers.providers.JsonRpcProvider(POLYGON_AMOY_CONFIG.rpcUrl);
      console.log('Direct wallet service initialized successfully');
    } catch (error) {
      console.error('Error initializing direct wallet service:', error);
      throw error;
    }
  }

  // Open MetaMask directly using proper deep linking
  async connectWallet() {
    try {
      console.log('Attempting to connect wallet directly...');

      Alert.alert(
        'Connect MetaMask Wallet',
        'Choose how you want to connect your MetaMask wallet:',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Open MetaMask App',
            onPress: async () => {
              await this.openMetaMaskApp();
            }
          },
          {
            text: 'Demo Connection',
            onPress: () => {
              this.simulateConnection();
            }
          }
        ]
      );

      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  // Open MetaMask app with better deep linking
  async openMetaMaskApp() {
    try {
      // Create proper MetaMask deep link for connecting to a dApp
      const dappUrl = 'guardiofinal://'; // Use our app's scheme as callback
      const metamaskDeepLink = `https://metamask.app.link/dapp/${encodeURIComponent('guardio.app')}`;
      
      // Try multiple MetaMask deep link formats
      const metamaskAppLink = 'metamask://';
      const metamaskUniversalLink = `metamask://dapp/guardio.app`;

      Alert.alert(
        'Opening MetaMask',
        'MetaMask will open now. Please:\n\n1. Connect your wallet if prompted\n2. Switch to Polygon Amoy testnet\n3. Return to this app when done',
        [
          {
            text: 'Cancel'
          },
          {
            text: 'Continue',
            onPress: async () => {
              try {
                // Try different MetaMask links
                const canOpenApp = await Linking.canOpenURL('metamask://');
                if (canOpenApp) {
                  console.log('Opening MetaMask app directly...');
                  await Linking.openURL(metamaskAppLink);
                } else {
                  console.log('Opening MetaMask via web link...');
                  await Linking.openURL(metamaskDeepLink);
                }
                
                // Give user time to complete the connection
                setTimeout(() => {
                  this.promptForConnectionConfirmation();
                }, 4000);
                
              } catch (error) {
                console.error('Error opening MetaMask:', error);
                Alert.alert(
                  'Cannot Open MetaMask',
                  'Unable to open MetaMask app. You can use the demo connection for testing.',
                  [
                    {
                      text: 'Use Demo',
                      onPress: () => this.simulateConnection()
                    }
                  ]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in openMetaMaskApp:', error);
    }
  }

  // Generate a proper WalletConnect URI
  generateWalletConnectURI() {
    // Create a simple WalletConnect-style URI for MetaMask
    // In a real implementation, this would be generated by WalletConnect
    const topic = Math.random().toString(36).substring(2, 15);
    const version = '2';
    const bridge = 'https://bridge.walletconnect.org';
    const key = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    return `wc:${topic}@${version}?bridge=${encodeURIComponent(bridge)}&key=${key}`;
  }

  // Prompt user to confirm connection after opening MetaMask
  async promptForConnectionConfirmation() {
    try {
      console.log('Prompting for connection confirmation...');
      
      Alert.alert(
        'MetaMask Connection',
        'Did MetaMask show a connection request?\n\n• If YES: Approve it and tap "Connected"\n• If NO: MetaMask may not support this in Expo development mode\n• For testing: Use "Demo Connection"',
        [
          {
            text: 'Try Again',
            onPress: () => {
              this.connectWallet();
            }
          },
          {
            text: 'Connected ✅',
            onPress: () => {
              Alert.alert(
                'Great!',
                'Please note: This is still a demo connection for testing. In production, this would be your real MetaMask wallet.',
                [
                  {
                    text: 'Continue',
                    onPress: () => this.simulateConnection()
                  }
                ]
              );
            }
          },
          {
            text: 'Demo Connection',
            onPress: () => {
              this.simulateConnection();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error prompting for confirmation:', error);
    }
  }

  // Simulate wallet connection for demo purposes
  simulateConnection() {
    try {
      // Generate a demo wallet address
      const demoAddress = '0x742d35Cc6634C0532925a3b8D4c0Cc1d77B6a7d7';
      
      this.walletAddress = demoAddress;
      this.isConnected = true;

      // Initialize contract with demo provider
      if (this.provider && CONTRACT_CONFIG.address && CONTRACT_CONFIG.abi) {
        this.contract = new ethers.Contract(
          CONTRACT_CONFIG.address,
          CONTRACT_CONFIG.abi,
          this.provider
        );
      }

      console.log('Demo wallet connected:', this.walletAddress);
      
      Alert.alert(
        'Wallet Connected! 🎉',
        `Demo wallet connected:\n${demoAddress.substring(0, 6)}...${demoAddress.substring(38)}\n\nNote: This is a demo connection. In production, you would connect to your actual MetaMask wallet.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error in demo connection:', error);
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

  // Get wallet balance (demo)
  async getBalance() {
    if (!this.provider || !this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      // For demo, return a simulated balance
      return '2.5431';
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
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

  // Mint Tourist ID NFT (demo)
  async mintTouristID(userData) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('Starting demo NFT minting process...');

      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate demo transaction data
      const demoTokenId = Math.floor(Math.random() * 10000) + 1;
      const demoTxHash = '0x' + Math.random().toString(16).substring(2, 66);

      console.log('Demo Tourist ID minted successfully');

      return {
        success: true,
        tokenId: demoTokenId.toString(),
        transactionHash: demoTxHash,
        blockNumber: Math.floor(Math.random() * 1000000) + 50000000,
        contractAddress: CONTRACT_CONFIG.address,
        explorerUrl: `${POLYGON_AMOY_CONFIG.blockExplorer}/tx/${demoTxHash}`,
      };
    } catch (error) {
      console.error('Error minting Tourist ID:', error);
      throw error;
    }
  }

  // Check if user has a Tourist ID (demo)
  async checkUserTouristID() {
    if (!this.walletAddress) {
      return null;
    }

    try {
      // For demo, randomly return existing ID or null
      const hasExisting = Math.random() > 0.8; // 20% chance of having existing ID

      if (!hasExisting) {
        return null;
      }

      const demoTokenId = Math.floor(Math.random() * 1000) + 1;
      
      return {
        tokenId: demoTokenId.toString(),
        tokenURI: 'https://demo.ipfs.hash',
        data: {
          encryptedDataHash: '0x' + Math.random().toString(16).substring(2, 66),
          passportNumber: 'DEMO123456',
          nationality: 'Demo Country',
          mintedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
        explorerUrl: `${POLYGON_AMOY_CONFIG.blockExplorer}/token/${CONTRACT_CONFIG.address}?a=${demoTokenId}`,
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

  // Add network switching functionality
  async switchToPolygonAmoy() {
    try {
      // In a real implementation, this would use window.ethereum to switch networks
      console.log('Requesting network switch to Polygon Amoy...');
      
      Alert.alert(
        'Switch Network',
        'Please switch to Polygon Amoy testnet in MetaMask.\n\nNetwork Details:\n• Name: Polygon Amoy Testnet\n• RPC: https://rpc-amoy.polygon.technology/\n• Chain ID: 80002\n• Symbol: MATIC',
        [{ text: 'OK' }]
      );
      
      return true;
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const directWalletService = new DirectWalletService();

export default directWalletService;
