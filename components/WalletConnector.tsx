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
          'Verification Successful! 🎉',
          `Your identity has been verified and secured.\\nAccount: ${address.substring(0, 6)}...${address.substring(38)}`,
          [{ text: 'OK' }]
        );
      }
      
    } catch (error: any) {
      console.error('Verification error:', error);
      
      let errorMessage = 'Failed to verify identity. Please try again.';
      
      if (error.message.includes('User rejected')) {
        errorMessage = 'Verification request was cancelled. Please try again.';
      }
      
      Alert.alert('Verification Failed', errorMessage);
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
      Alert.alert('Error', 'Please complete verification first');
      return;
    }

    const balance = parseFloat(walletInfo.balance);
    if (balance < 0.01) {
      Alert.alert(
        'Insufficient Funds',
        `A small network fee (0.01 MATIC) is required for verification. Your current balance is ${balance.toFixed(4)} MATIC.\\n\\nGet free testnet MATIC from the faucet.`,
        [
          { text: 'Get Test Funds', onPress: () => openExplorer(POLYGON_AMOY_CONFIG.faucet) },
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
            <Text style={styles.title}>Verify Identity</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {!walletInfo ? (
            /* Identity Verification */
            <View style={styles.content}>
              <LinearGradient
                colors={['#7C3AED', '#9333EA']}
                style={styles.verifyCard}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="shield-checkmark-outline" size={54} color="white" />
                </View>
                <Text style={styles.verifyCardTitle}>Secure Identity Verification</Text>
                <Text style={styles.verifyCardDescription}>
                  Complete the verification process to create your digital identity
                </Text>
              </LinearGradient>

              <View style={styles.infoSection}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="lock-closed" size={22} color="#7C3AED" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Encrypted & Secure</Text>
                    <Text style={styles.featureDescription}>Your data is protected with encryption</Text>
                  </View>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Verified Identity</Text>
                    <Text style={styles.featureDescription}>Globally recognized verification</Text>
                  </View>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="card-outline" size={22} color="#3B82F6" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Digital Certificate</Text>
                    <Text style={styles.featureDescription}>Receive your unique digital ID</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleConnectWallet}
                disabled={connecting}
              >
                <LinearGradient
                  colors={connecting ? ['#9CA3AF', '#6B7280'] : ['#7C3AED', '#9333EA']}
                  style={styles.connectButtonGradient}
                >
                  <Ionicons 
                    name={connecting ? "hourglass-outline" : "arrow-forward-circle-outline"} 
                    size={22} 
                    color="white" 
                  />
                  <Text style={styles.connectButtonText}>
                    {connecting ? 'Verifying...' : 'Start Verification'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.secureNote}>
                <Ionicons name="information-circle-outline" size={14} color="#7C8BA0" /> This process is secure and your data remains private
              </Text>
            </View>
          ) : (
            /* Identity Verified */
            <View style={styles.content}>
              <View style={styles.connectedCard}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.connectedHeader}
                >
                  <Ionicons name="checkmark-circle" size={36} color="white" />
                  <Text style={styles.connectedTitle}>Identity Verified</Text>
                  <Text style={styles.connectedSubtitle}>Ready to create your Digital ID</Text>
                </LinearGradient>

                <View style={styles.verifiedDetails}>
                  <View style={styles.verifiedItem}>
                    <View style={styles.verifiedIconBg}>
                      <Ionicons name="shield-checkmark" size={20} color="#7C3AED" />
                    </View>
                    <View style={styles.verifiedInfo}>
                      <Text style={styles.verifiedLabel}>Status</Text>
                      <Text style={styles.verifiedValue}>Verified & Secure</Text>
                    </View>
                  </View>

                  <View style={styles.verifiedItem}>
                    <View style={styles.verifiedIconBg}>
                      <Ionicons name="key" size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.verifiedInfo}>
                      <Text style={styles.verifiedLabel}>Account</Text>
                      <Text style={styles.verifiedValue}>
                        {walletInfo.address.substring(0, 8)}...{walletInfo.address.substring(36)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.verifiedItem}>
                    <View style={styles.verifiedIconBg}>
                      <Ionicons name="globe" size={20} color="#10B981" />
                    </View>
                    <View style={styles.verifiedInfo}>
                      <Text style={styles.verifiedLabel}>Network</Text>
                      <Text style={styles.verifiedValue}>Polygon Amoy</Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.mintButton}
                onPress={handleMintTouristID}
                disabled={checking}
              >
                <LinearGradient
                  colors={checking ? ['#9CA3AF', '#6B7280'] : ['#7C3AED', '#9333EA']}
                  style={styles.mintButtonGradient}
                >
                  <Ionicons 
                    name={checking ? "hourglass-outline" : "card-outline"} 
                    size={22} 
                    color="white" 
                  />
                  <Text style={styles.mintButtonText}>
                    {checking ? 'Processing...' : 'Create Digital ID'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                <Ionicons name="information-circle-outline" size={14} color="#7C8BA0" /> A small network fee is required for verification
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: width * 0.9,
    maxHeight: '85%',
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
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  content: {
    padding: 24,
  },
  // Verify Card
  verifyCard: {
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 28,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  verifyCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  verifyCardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Info Section
  infoSection: {
    marginBottom: 28,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 14,
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 13,
    color: '#7C8BA0',
    lineHeight: 18,
  },
  // Buttons
  connectButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  connectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  secureNote: {
    fontSize: 13,
    color: '#7C8BA0',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Connected State
  connectedCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  connectedHeader: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  connectedTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  connectedSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  verifiedDetails: {
    padding: 20,
    gap: 14,
  },
  verifiedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  verifiedIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedInfo: {
    flex: 1,
  },
  verifiedLabel: {
    fontSize: 12,
    color: '#7C8BA0',
    marginBottom: 4,
    fontWeight: '500',
  },
  verifiedValue: {
    fontSize: 15,
    color: '#1A1A2E',
    fontWeight: '600',
  },
  // Mint Button
  mintButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mintButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  mintButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 13,
    color: '#7C8BA0',
    textAlign: 'center',
    lineHeight: 20,
  },
});
