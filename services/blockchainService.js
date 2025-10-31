import 'react-native-get-random-values';
import { ethers } from 'ethers';

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

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.walletAddress = null;
  }

  // Connect to MetaMask or other wallet
  async connectWallet() {
    try {
      if (!window.ethereum) {
        throw new Error('No crypto wallet found. Please install MetaMask.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.walletAddress = accounts[0];

      // Create provider and signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();

      // Check if we're on the correct network
      await this.ensureCorrectNetwork();

      // Initialize contract
      if (CONTRACT_CONFIG.address) {
        this.contract = new ethers.Contract(
          CONTRACT_CONFIG.address,
          CONTRACT_CONFIG.abi,
          this.signer
        );
      }

      return {
        address: this.walletAddress,
        network: await this.provider.getNetwork(),
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  // Ensure user is on Polygon Amoy testnet
  async ensureCorrectNetwork() {
    try {
      const network = await this.provider.getNetwork();
      
      if (network.chainId !== POLYGON_AMOY_CONFIG.chainId) {
        // Request network switch
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${POLYGON_AMOY_CONFIG.chainId.toString(16)}` }],
        });
      }
    } catch (switchError) {
      // Network not added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${POLYGON_AMOY_CONFIG.chainId.toString(16)}`,
            chainName: POLYGON_AMOY_CONFIG.name,
            nativeCurrency: {
              name: POLYGON_AMOY_CONFIG.currency,
              symbol: POLYGON_AMOY_CONFIG.currency,
              decimals: 18,
            },
            rpcUrls: [POLYGON_AMOY_CONFIG.rpcUrl],
            blockExplorerUrls: [POLYGON_AMOY_CONFIG.blockExplorer],
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  // Check wallet balance
  async getBalance() {
    if (!this.provider || !this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    const balance = await this.provider.getBalance(this.walletAddress);
    return ethers.utils.formatEther(balance);
  }

  // Generate metadata for NFT
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

  // Upload metadata to IPFS (simplified version using a public gateway)
  async uploadMetadataToIPFS(metadata) {
    try {
      // For demo purposes, we'll use a simple JSON storage
      // In production, you'd use a proper IPFS service like Pinata or Infura
      const jsonString = JSON.stringify(metadata, null, 2);
      const base64Data = btoa(jsonString);
      
      // Return a data URI for demo (in production, this would be an IPFS hash)
      return `data:application/json;base64,${base64Data}`;
    } catch (error) {
      console.error('Error uploading metadata:', error);
      throw error;
    }
  }

  // Encrypt sensitive data (simplified for demo)
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
    if (!this.contract) {
      throw new Error('Contract not initialized. Please connect wallet first.');
    }

    try {
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

  // Listen for wallet events
  setupWalletListeners() {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.walletAddress = accounts[0];
      }
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  }

  // Disconnect wallet
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.walletAddress = null;
  }

  // Get contract address (for updating after deployment)
  static updateContractAddress(address) {
    CONTRACT_CONFIG.address = address;
  }
}

export default new BlockchainService();
