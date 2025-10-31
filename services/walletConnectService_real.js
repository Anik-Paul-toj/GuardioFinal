import { WalletConnectModal } from '@walletconnect/modal-react-native';
import UniversalProvider from '@walletconnect/universal-provider';
import { ethers } from 'ethers';
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

// WalletConnect Project ID
const PROJECT_ID = '04e0cc7fe3e6ca381994cb961c4ee8b3';

// WalletConnect provider metadata
const providerMetadata = {
  name: 'GuardioFinal',
  description: 'Blockchain-based Digital Tourist ID System',
  url: 'https://guardio.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
  redirect: {
    native: 'guardiofinal://wc',
    universal: 'https://guardio.app/wc'
  }
};

class RealWalletConnectService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.walletAddress = null;
    this.isConnected = false;
    this.universalProvider = null;
    this.modal = null;
  }

  // Initialize the WalletConnect service
  async initialize() {
    try {
      console.log('Initializing WalletConnect service...');
      
      // Initialize the modal
      this.modal = new WalletConnectModal({
        projectId: PROJECT_ID,
        metadata: providerMetadata,
        themeMode: 'light',
        themeVariables: {
          '--wcm-color-bg-1': '#ffffff',
          '--wcm-color-bg-2': '#f3f5f7',
          '--wcm-color-bg-3': '#ffffff',
          '--wcm-color-fg-1': '#1a202c',
          '--wcm-color-fg-2': '#2d3748',
          '--wcm-color-fg-3': '#4a5568',
          '--wcm-accent-color': '#667eea',
          '--wcm-font-family': 'SF Pro Display, system-ui, sans-serif',
          '--wcm-border-radius-master': '12px',
        }
      });

      // Initialize Universal Provider
      this.universalProvider = await UniversalProvider.init({
        projectId: PROJECT_ID,
        metadata: providerMetadata,
        relayUrl: 'wss://relay.walletconnect.com'
      });

      // Set up event listeners
      this.universalProvider.on('display_uri', (uri) => {
        console.log('WalletConnect URI:', uri);
      });

      this.universalProvider.on('session_ping', (args) => {
        console.log('Session ping:', args);
      });

      this.universalProvider.on('session_event', (args) => {
        console.log('Session event:', args);
      });

      this.universalProvider.on('session_update', ({ topic, params }) => {
        console.log('Session update:', topic, params);
      });

      this.universalProvider.on('session_delete', ({ id, topic }) => {
        console.log('Session deleted:', id, topic);
        this.disconnect();
      });

      console.log('WalletConnect service initialized successfully');
    } catch (error) {
      console.error('Error initializing WalletConnect service:', error);
      throw error;
    }
  }

  // Open the WalletConnect modal
  async openModal() {
    try {
      console.log('Opening WalletConnect modal...');

      if (!this.universalProvider) {
        await this.initialize();
      }

      // Check if already connected
      if (this.isConnected) {
        console.log('Already connected to wallet');
        return true;
      }

      // Define the chains and methods we want to support
      const requiredNamespaces = {
        eip155: {
          methods: [
            'eth_sendTransaction',
            'eth_signTransaction',
            'eth_sign',
            'personal_sign',
            'eth_signTypedData',
          ],
          chains: [`eip155:${POLYGON_AMOY_CONFIG.chainId}`],
          events: ['chainChanged', 'accountsChanged'],
        },
      };

      // Connect using the universal provider
      const session = await this.universalProvider.connect({
        requiredNamespaces,
      });

      if (session) {
        // Get the first account
        const accounts = Object.values(session.namespaces)
          .map((namespace) => namespace.accounts)
          .flat();

        if (accounts.length > 0) {
          // Extract address from the first account (format: eip155:80002:0x...)
          this.walletAddress = accounts[0].split(':')[2];
          this.isConnected = true;

          // Setup provider and signer
          await this.setupProvider();

          console.log('Successfully connected to wallet:', this.walletAddress);
          return true;
        }
      }

      throw new Error('No accounts found');
    } catch (error) {
      console.error('Error opening WalletConnect modal:', error);
      throw error;
    }
  }

  // Setup provider after connection
  async setupProvider() {
    try {
      console.log('Setting up Web3 provider...');

      // Create ethers provider using the universal provider
      this.provider = new ethers.providers.Web3Provider(this.universalProvider);
      this.signer = this.provider.getSigner();

      // Initialize contract
      if (CONTRACT_CONFIG.address && CONTRACT_CONFIG.abi) {
        this.contract = new ethers.Contract(
          CONTRACT_CONFIG.address,
          CONTRACT_CONFIG.abi,
          this.signer
        );
      }

      console.log('Provider setup complete');
    } catch (error) {
      console.error('Error setting up provider:', error);
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

  // Mint Tourist ID NFT
  async mintTouristID(userData) {
    if (!this.contract || !this.isConnected) {
      throw new Error('Wallet not connected or contract not initialized');
    }

    try {
      console.log('Starting NFT minting process...');

      // Check if user already has a Tourist ID
      const hasExisting = await this.contract.hasValidTouristID(this.walletAddress);
      if (hasExisting) {
        throw new Error('You already have a Tourist ID NFT');
      }

      // Encrypt user data
      const encryptedDataHash = this.encryptUserData(userData);

      // Generate NFT metadata
      const metadata = this.generateNFTMetadata(userData);
      const metadataURI = await this.uploadMetadataToIPFS(metadata);

      console.log('Estimating gas for minting transaction...');

      // Estimate gas
      const gasEstimate = await this.contract.estimateGas.mintTouristID(
        this.walletAddress,
        encryptedDataHash,
        userData.passportNumber,
        userData.nationality,
        metadataURI
      );

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate.mul(120).div(100);

      console.log('Sending minting transaction...');

      // Mint the NFT
      const transaction = await this.contract.mintTouristID(
        this.walletAddress,
        encryptedDataHash,
        userData.passportNumber,
        userData.nationality,
        metadataURI,
        { gasLimit }
      );

      console.log('Minting transaction sent:', transaction.hash);

      // Wait for confirmation
      const receipt = await transaction.wait();
      console.log('Tourist ID minted successfully:', receipt);

      // Extract token ID from events
      const event = receipt.events?.find(e => e.event === 'TouristIDMinted');
      const tokenId = event?.args?.tokenId?.toString();

      return {
        success: true,
        tokenId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        contractAddress: this.contract.address,
        explorerUrl: `${POLYGON_AMOY_CONFIG.blockExplorer}/tx/${receipt.transactionHash}`,
      };
    } catch (error) {
      console.error('Error minting Tourist ID:', error);
      throw error;
    }
  }

  // Check if user has a Tourist ID
  async checkUserTouristID() {
    if (!this.contract || !this.walletAddress) {
      return null;
    }

    try {
      const hasID = await this.contract.hasValidTouristID(this.walletAddress);
      if (!hasID) {
        return null;
      }

      const tokenId = await this.contract.getUserTokenId(this.walletAddress);
      const tokenURI = await this.contract.tokenURI(tokenId);
      const touristData = await this.contract.getTouristData(tokenId);

      return {
        tokenId: tokenId.toString(),
        tokenURI,
        data: {
          encryptedDataHash: touristData.encryptedDataHash,
          passportNumber: touristData.passportNumber,
          nationality: touristData.nationality,
          mintedAt: new Date(touristData.mintedAt.toNumber() * 1000),
          isActive: touristData.isActive,
        },
        explorerUrl: `${POLYGON_AMOY_CONFIG.blockExplorer}/token/${this.contract.address}?a=${tokenId}`,
      };
    } catch (error) {
      console.error('Error checking Tourist ID:', error);
      return null;
    }
  }

  // Disconnect wallet
  async disconnect() {
    try {
      if (this.universalProvider) {
        await this.universalProvider.disconnect();
      }
      
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

  // Get modal instance for direct access
  getModal() {
    return this.modal;
  }
}

// Create and export a singleton instance
const walletConnectService = new RealWalletConnectService();

export default walletConnectService;
