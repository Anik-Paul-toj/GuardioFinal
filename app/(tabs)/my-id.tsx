import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { auth } from '../../config/firebase';
import directWalletService, { POLYGON_AMOY_CONFIG } from '../../services/directWalletService';
import { getUserProfile } from '../../services/userService';

const { width } = Dimensions.get('window');

interface UserProfile {
  fullName?: string;
  nationality?: string;
  age?: string;
  photoUrl?: string;
  touristIdMinted?: boolean;
  blockchainData?: {
    tokenId?: string;
    transactionHash?: string;
    mintedAt?: string;
    network?: string;
  };
  [key: string]: any;
}

export default function MyIDScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadUserProfile(user.uid);
      } else {
        router.replace('/auth');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await getUserProfile(userId) as UserProfile | null;
      setUserProfile(profile);
      
      // Check if wallet is connected and get wallet info
      try {
        await directWalletService.initialize();
        if (directWalletService.isWalletConnected()) {
          const address = directWalletService.getWalletAddress();
          const balance = await directWalletService.getBalance();
          if (address) {
            setWalletAddress(address);
            setWalletBalance(balance);
          }
        }
      } catch (error) {
        console.log('Wallet not connected or error loading wallet info');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleCreateID = () => {
    router.push('/mint-tourist-id');
  };

  const handleVerifyID = () => {
    Alert.alert(
      'ID Verification',
      'Your digital ID is secure and verified. It can be used for tourist services and emergency identification.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your ID...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasValidID = userProfile?.touristIdMinted;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Custom Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Your Identity</Text>
            <Text style={styles.userName}>{userProfile?.fullName || 'Digital ID'}</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {hasValidID ? (
          <>
            {/* Digital ID Card */}
            <View style={styles.idCardContainer}>
              <LinearGradient 
                colors={['#667eea', '#764ba2']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.idCard}
              >
                {/* Verified Badge */}
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="white" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>

                {/* User Photo */}
                <View style={styles.photoSection}>
                  <View style={styles.photoContainer}>
                    {userProfile?.photoUrl ? (
                      <Image source={{ uri: userProfile.photoUrl }} style={styles.userPhoto} />
                    ) : (
                      <View style={styles.defaultPhoto}>
                        <Ionicons name="person" size={50} color="white" />
                      </View>
                    )}
                  </View>
                </View>

                {/* User Info */}
                <View style={styles.cardUserInfo}>
                  <Text style={styles.cardUserName}>{userProfile?.fullName || 'User Name'}</Text>
                  <Text style={styles.cardUserDetails}>
                    {userProfile?.nationality || 'Nationality'} • {userProfile?.age || '--'} years
                  </Text>
                  {userProfile?.blockchainData?.tokenId && (
                    <View style={styles.tokenIdBadge}>
                      <Text style={styles.tokenIdText}>ID: #{userProfile.blockchainData.tokenId}</Text>
                    </View>
                  )}
                </View>

                {/* Card Pattern/Design Element */}
                <View style={styles.cardPattern}>
                  <Ionicons name="shield-checkmark-outline" size={100} color="rgba(255,255,255,0.1)" />
                </View>
              </LinearGradient>
            </View>

            {/* QR Code Card */}
            {walletAddress && (
              <View style={styles.qrSection}>
                <TouchableOpacity 
                  style={styles.qrToggleCard}
                  onPress={() => setShowQRCode(!showQRCode)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#00D9FF', '#00B8D4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.qrToggleGradient}
                  >
                    <View style={styles.qrToggleContent}>
                      <View style={styles.qrToggleLeft}>
                        <Ionicons name="qr-code" size={40} color="white" />
                        <View style={styles.qrToggleText}>
                          <Text style={styles.qrToggleTitle}>QR Code</Text>
                          <Text style={styles.qrToggleSubtitle}>
                            {showQRCode ? 'Tap to hide' : 'Tap to show'}
                          </Text>
                        </View>
                      </View>
                      <Ionicons 
                        name={showQRCode ? "chevron-up" : "chevron-down"} 
                        size={24} 
                        color="white" 
                      />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {showQRCode && (
                  <View style={styles.qrCodeCard}>
                    <View style={styles.qrCodeWrapper}>
                      <QRCode
                        value={JSON.stringify({
                          address: walletAddress,
                          balance: parseFloat(walletBalance).toFixed(4),
                          network: 'Polygon Amoy',
                          chainId: POLYGON_AMOY_CONFIG.chainId,
                          name: userProfile?.fullName || 'User',
                          tokenId: userProfile?.blockchainData?.tokenId || null,
                          type: 'digital-id-wallet'
                        })}
                        size={220}
                        color="#000000"
                        backgroundColor="#FFFFFF"
                        ecl="H"
                      />
                    </View>
                    <Text style={styles.qrHint}>Scan to verify identity</Text>
                    <View style={styles.walletInfoCard}>
                      <Text style={styles.walletAddress}>
                        {walletAddress.substring(0, 10)}...{walletAddress.substring(36)}
                      </Text>
                      <Text style={styles.walletBalance}>
                        {parseFloat(walletBalance).toFixed(4)} MATIC
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Info Cards Grid */}
            <View style={styles.infoSection}>
              <View style={styles.infoGrid}>
                <View style={[styles.infoCard, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="shield-checkmark" size={32} color="#2196F3" />
                  <Text style={styles.infoCardTitle}>Secure</Text>
                  <Text style={styles.infoCardDesc}>Blockchain verified</Text>
                </View>

                <View style={[styles.infoCard, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="globe" size={32} color="#9C27B0" />
                  <Text style={styles.infoCardTitle}>Global</Text>
                  <Text style={styles.infoCardDesc}>Accepted worldwide</Text>
                </View>

                <View style={[styles.infoCard, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="flash" size={32} color="#4CAF50" />
                  <Text style={styles.infoCardTitle}>Fast</Text>
                  <Text style={styles.infoCardDesc}>Instant verification</Text>
                </View>

                <View style={[styles.infoCard, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="lock-closed" size={32} color="#FF9800" />
                  <Text style={styles.infoCardTitle}>Private</Text>
                  <Text style={styles.infoCardDesc}>Your data is safe</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.actionCard} onPress={handleVerifyID}>
                <View style={[styles.actionIconBox, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Verify ID Status</Text>
                  <Text style={styles.actionSubtitle}>Check your verification</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.actionIconBox, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="download" size={24} color="#2196F3" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Download Backup</Text>
                  <Text style={styles.actionSubtitle}>Save your ID data</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.actionIconBox, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="share-social" size={24} color="#FF9800" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Share ID</Text>
                  <Text style={styles.actionSubtitle}>Share verification details</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* ID Features Section */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>ID Features</Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="shield-checkmark" size={24} color="#27ae60" />
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Secure Verification</Text>
                    <Text style={styles.featureDescription}>
                      Your identity is protected with advanced security
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="globe" size={24} color="#3498db" />
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Global Recognition</Text>
                    <Text style={styles.featureDescription}>
                      Accepted by tourist services worldwide
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="flash" size={24} color="#e74c3c" />
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Emergency Access</Text>
                    <Text style={styles.featureDescription}>
                      Quick identification in emergency situations
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <Ionicons name="phone-portrait" size={24} color="#9b59b6" />
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Mobile Ready</Text>
                    <Text style={styles.featureDescription}>
                      Access your ID anytime, anywhere
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Blockchain Info Section */}
            {userProfile?.blockchainData && (
              <View style={styles.blockchainSection}>
                <Text style={styles.sectionTitle}>Blockchain Details</Text>
                
                <View style={styles.blockchainCard}>
                  {userProfile.blockchainData.tokenId && (
                    <View style={styles.blockchainRow}>
                      <Text style={styles.blockchainLabel}>Token ID</Text>
                      <Text style={styles.blockchainValue}>#{userProfile.blockchainData.tokenId}</Text>
                    </View>
                  )}
                  
                  {userProfile.blockchainData.network && (
                    <View style={styles.blockchainRow}>
                      <Text style={styles.blockchainLabel}>Network</Text>
                      <Text style={styles.blockchainValue}>{userProfile.blockchainData.network}</Text>
                    </View>
                  )}
                  
                  {userProfile.blockchainData.transactionHash && (
                    <View style={styles.blockchainRow}>
                      <Text style={styles.blockchainLabel}>Transaction</Text>
                      <Text style={styles.blockchainValue} numberOfLines={1}>
                        {userProfile.blockchainData.transactionHash.substring(0, 10)}...
                        {userProfile.blockchainData.transactionHash.substring(56)}
                      </Text>
                    </View>
                  )}
                  
                  {userProfile.blockchainData.mintedAt && (
                    <View style={styles.blockchainRow}>
                      <Text style={styles.blockchainLabel}>Created</Text>
                      <Text style={styles.blockchainValue}>
                        {new Date(userProfile.blockchainData.mintedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </>
        ) : (
          /* Create ID Prompt */
          <View style={styles.createIdContainer}>
            <LinearGradient 
              colors={['#FFB800', '#FFA500']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createIdCard}
            >
              <Ionicons name="id-card-outline" size={80} color="white" />
              <Text style={styles.createIdTitle}>Create Your Digital ID</Text>
              <Text style={styles.createIdDescription}>
                Get started with your secure digital identity in minutes
              </Text>
              <TouchableOpacity style={styles.createIdButton} onPress={handleCreateID}>
                <Text style={styles.createIdButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#FF9800" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ID Card
  idCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  idCard: {
    borderRadius: 25,
    padding: 30,
    minHeight: 280,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
    marginBottom: 20,
  },
  verifiedText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  userPhoto: {
    width: '100%',
    height: '100%',
  },
  defaultPhoto: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardUserInfo: {
    alignItems: 'center',
    zIndex: 1,
  },
  cardUserName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  cardUserDetails: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  tokenIdBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 5,
  },
  tokenIdText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  cardPattern: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    opacity: 0.5,
  },
  // QR Section
  qrSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  qrToggleCard: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  qrToggleGradient: {
    padding: 20,
  },
  qrToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  qrToggleText: {
    flex: 1,
  },
  qrToggleTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  qrToggleSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  qrCodeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  qrCodeWrapper: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginVertical: 15,
  },
  qrHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  walletInfoCard: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  walletAddress: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // Info Grid
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoCard: {
    width: (width - 55) / 2,
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 3,
  },
  infoCardDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  // Actions
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  // Create ID Card
  createIdContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  createIdCard: {
    borderRadius: 25,
    padding: 40,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  createIdTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  createIdDescription: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  createIdButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  createIdButtonText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Features Section
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 15,
    gap: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Blockchain Section
  blockchainSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  blockchainCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  blockchainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  blockchainLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  blockchainValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    fontFamily: 'monospace',
    maxWidth: '60%',
  },
});
