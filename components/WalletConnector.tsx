import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import directWalletService, { POLYGON_AMOY_CONFIG } from '../services/directWalletService';

const { width } = Dimensions.get('window');

interface WalletInfo {
  address: string;
  balance: string;
  network: any;
}

interface WalletConnectorProps {
  visible: boolean;
  onClose: () => void;
  onWalletConnected: (walletInfo: WalletInfo) => void;
  onMintRequested: () => void;
}

export default function WalletConnector({ 
  visible, 
  onClose, 
  onWalletConnected, 
  onMintRequested 
}: WalletConnectorProps) {
  const [connecting, setConnecting] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Initialize Direct Wallet service
    directWalletService.initialize().catch(console.error);
  }, []);

  useEffect(() => {
    if (visible && walletInfo) {
      checkExistingTouristID();
    }
  }, [visible, walletInfo]);

  const handleConnectWallet = async () => {
    setConnecting(true);
    
    try {
      // Connect wallet directly (no QR code)
      await directWalletService.connectWallet();
      
      // Check if connection was successful
      const isConnected = directWalletService.isWalletConnected();
      if (isConnected) {
        const address = directWalletService.getWalletAddress();
        const balance = await directWalletService.getBalance();
        
        if (!address) {
          throw new Error('No wallet address found');
        }
        
        const walletData: WalletInfo = {
          address,
          balance,
          network: { chainId: POLYGON_AMOY_CONFIG.chainId },
        };
        
        setWalletInfo(walletData);
        onWalletConnected(walletData);
        
        Alert.alert(
          'Connection Successful! 🎉',
          `Your digital wallet is now connected.\\nAddress: ${address.substring(0, 6)}...${address.substring(38)}\\nBalance: ${parseFloat(balance).toFixed(4)} MATIC`,
          [{ text: 'OK' }]
        );
      }
      
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      let errorMessage = 'Failed to connect wallet. Please try again.';
      
      if (error.message.includes('User rejected')) {
        errorMessage = 'Connection request was rejected. Please try again.';
      }
      
      Alert.alert('Connection Failed', errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const checkExistingTouristID = async () => {
    if (!walletInfo) return;
    
    setChecking(true);
    try {
      const existingID = await directWalletService.checkUserTouristID();
      
      if (existingID) {
        Alert.alert(
          'Digital ID Found! 🎯',
          `You already have a verified Digital ID:\\n\\nID Number: ${existingID.tokenId}\\nNationality: ${existingID.data.nationality}\\nCreated: ${existingID.data.mintedAt.toLocaleDateString()}`,
          [
            { text: 'View Details', onPress: () => openExplorer(existingID.explorerUrl) },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking existing Tourist ID:', error);
    } finally {
      setChecking(false);
    }
  };

  const openExplorer = (url: string) => {
    // In a real app, you'd use Linking.openURL(url)
    console.log('Opening explorer URL:', url);
  };

  const handleMintTouristID = () => {
    if (!walletInfo) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    const balance = parseFloat(walletInfo.balance);
    if (balance < 0.01) {
      Alert.alert(
        'Insufficient Balance',
        `You need at least 0.01 MATIC to create your Digital ID. Your current balance is ${balance.toFixed(4)} MATIC.\\n\\nGet free testnet MATIC from the faucet.`,
        [
          { text: 'Get Free MATIC', onPress: () => openExplorer(POLYGON_AMOY_CONFIG.faucet) },
          { text: 'OK' }
        ]
      );
      return;
    }

    onMintRequested();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Connect Wallet</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {!walletInfo ? (
            /* Wallet Connection */
            <View style={styles.content}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.walletCard}
              >
                <Ionicons name="wallet" size={48} color="white" />
                <Text style={styles.walletCardTitle}>Connect Your Wallet</Text>
                <Text style={styles.walletCardDescription}>
                  Connect your digital wallet to create and secure your digital identity
                </Text>
              </LinearGradient>

              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <Ionicons name="phone-portrait" size={20} color="#e74c3c" />
                  <Text style={styles.infoText}>Opens wallet app directly</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="shield-checkmark" size={20} color="#2ecc71" />
                  <Text style={styles.infoText}>Secure encrypted storage</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="globe" size={20} color="#3498db" />
                  <Text style={styles.infoText}>Global verification network</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="diamond" size={20} color="#9b59b6" />
                  <Text style={styles.infoText}>Digital identity certificate</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleConnectWallet}
                disabled={connecting}
              >
                <LinearGradient
                  colors={connecting ? ['#bdc3c7', '#95a5a6'] : ['#3498db', '#2980b9']}
                  style={styles.connectButtonGradient}
                >
                  <Ionicons 
                    name={connecting ? "hourglass" : "wallet"} 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.connectButtonText}>
                    {connecting ? 'Opening MetaMask...' : 'Open MetaMask'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            /* Wallet Connected */
            <View style={styles.content}>
              <View style={styles.connectedCard}>
                <LinearGradient
                  colors={['#2ecc71', '#27ae60']}
                  style={styles.connectedHeader}
                >
                  <Ionicons name="checkmark-circle" size={32} color="white" />
                  <Text style={styles.connectedTitle}>Wallet Connected</Text>
                </LinearGradient>

                <View style={styles.walletDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailValue}>
                      {walletInfo.address.substring(0, 6)}...{walletInfo.address.substring(38)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Balance:</Text>
                    <Text style={styles.detailValue}>
                      {parseFloat(walletInfo.balance).toFixed(4)} MATIC
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Network:</Text>
                    <Text style={styles.detailValue}>Polygon Amoy</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.mintButton}
                onPress={handleMintTouristID}
                disabled={checking}
              >
                <LinearGradient
                  colors={checking ? ['#bdc3c7', '#95a5a6'] : ['#e74c3c', '#c0392b']}
                  style={styles.mintButtonGradient}
                >
                  <Ionicons 
                    name={checking ? "hourglass" : "diamond"} 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.mintButtonText}>
                    {checking ? 'Checking...' : 'Create Digital ID'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                Make sure you have at least 0.01 MATIC for gas fees
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: '80%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  content: {
    padding: 20,
  },
  walletCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  walletCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  walletCardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#636e72',
  },
  connectButton: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  connectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectedCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  connectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  connectedTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  walletDetails: {
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#636e72',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#2d3436',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  mintButton: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 16,
  },
  mintButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  mintButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: 18,
  },
});
