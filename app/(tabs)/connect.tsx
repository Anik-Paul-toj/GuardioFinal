import { auth } from '@/config/firebase';
import { getUserProfile } from '@/services/userService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

interface UserProfile {
  fullName: string;
  nationality: string;
  passportNumber: string;
  governmentId?: string;
  age: string;
  gender: string;
  photo?: string;
  createdAt?: any;
  blockchainData?: {
    tokenId: string;
    walletAddress: string;
    contractAddress: string;
    transactionHash: string;
    network: string;
    chainId: number;
  };
}

const POLYGON_AMOY_CONFIG = {
  chainId: 80002,
  name: 'Polygon Amoy',
  rpcUrl: 'https://rpc-amoy.polygon.technology',
  blockExplorer: 'https://amoy.polygonscan.com',
};

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setProfileData(profile as UserProfile);
      } else {
        Alert.alert('Error', 'No authenticated user found');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut();
              router.replace('/auth');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.noDataText}>No profile data found</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={loadUserProfile}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const qrData = {
    address: profileData.blockchainData?.walletAddress || '',
    network: 'Polygon Amoy',
    chainId: POLYGON_AMOY_CONFIG.chainId,
    name: profileData.fullName,
    nationality: profileData.nationality,
    passportNumber: profileData.passportNumber,
    tokenId: profileData.blockchainData?.tokenId || null,
    contractAddress: profileData.blockchainData?.contractAddress || '',
    type: 'digital-tourist-id',
    createdAt: profileData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Profile</Text>
              <Text style={styles.subtitle}>Your digital identity</Text>
            </View>
          </View>
        </View>

        {/* Profile Photo Card */}
        <View style={styles.photoSection}>
          <LinearGradient
            colors={['#7C3AED', '#9333EA']}
            style={styles.photoCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.photoWrapper}>
              {profileData.photo ? (
                <Image source={{ uri: profileData.photo }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={60} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={styles.photoName}>{profileData.fullName}</Text>
            <Text style={styles.photoEmail}>{auth.currentUser?.email}</Text>
          </LinearGradient>
        </View>

        {/* Message for users without Digital ID */}
        {(!profileData.blockchainData || !profileData.blockchainData.tokenId) && (
          <View style={styles.noIdSection}>
            <View style={styles.noIdCard}>
              <Ionicons name="alert-circle-outline" size={48} color="#F59E0B" />
              <Text style={styles.noIdTitle}>Digital ID Not Minted</Text>
              <Text style={styles.noIdText}>
                You need to mint your Digital ID first to generate a QR code.
              </Text>
              <TouchableOpacity 
                style={styles.mintButton}
                onPress={() => router.push('/mint-tourist-id')}
              >
                <LinearGradient
                  colors={['#7C3AED', '#9333EA']}
                  style={styles.mintButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="add-circle" size={24} color="white" />
                  <Text style={styles.mintButtonText}>Get Your Digital ID</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* QR Code Toggle Button - Only show if blockchain data exists */}
        {profileData.blockchainData && profileData.blockchainData.tokenId && (
          <View style={styles.qrToggleSection}>
            <TouchableOpacity
              style={styles.qrToggleButton}
              onPress={() => setShowQRCode(!showQRCode)}
            >
              <LinearGradient
                colors={showQRCode ? ['#10B981', '#059669'] : ['#667eea', '#764ba2']}
                style={styles.qrToggleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="qr-code" size={24} color="white" />
                <Text style={styles.qrToggleText}>
                  {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                </Text>
                <Ionicons
                  name={showQRCode ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="white"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* QR Code Card (PhonePe/GPay Style) - Only show if blockchain data exists */}
        {showQRCode && profileData.blockchainData && profileData.blockchainData.tokenId && (
          <View style={styles.qrCodeSection}>
            <View style={styles.qrCodeCard}>
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.qrCodeGradient}
              >
                {/* Header */}
                <View style={styles.qrHeader}>
                  <View style={styles.qrHeaderLeft}>
                    <Ionicons name="shield-checkmark" size={24} color="#7C3AED" />
                    <View style={styles.qrHeaderText}>
                      <Text style={styles.qrTitle}>Digital ID QR</Text>
                      <Text style={styles.qrSubtitle}>
                        {profileData.blockchainData?.walletAddress 
                          ? `${profileData.blockchainData.walletAddress.substring(0, 8)}...${profileData.blockchainData.walletAddress.substring(36)}`
                          : 'No wallet address'}
                      </Text>
                    </View>
                  </View>
                  {profileData.blockchainData?.tokenId && (
                    <View style={styles.tokenBadge}>
                      <Text style={styles.tokenText}>
                        ID #{profileData.blockchainData.tokenId}
                      </Text>
                    </View>
                  )}
                </View>

                {/* QR Code */}
                <View style={styles.qrCodeWrapper}>
                  <View style={styles.qrCodeInner}>
                    <QRCode
                      value={JSON.stringify(qrData)}
                      size={240}
                      color="#000000"
                      backgroundColor="#FFFFFF"
                      ecl="H"
                    />
                  </View>
                  <Text style={styles.scanHint}>Scan with any QR code reader</Text>
                </View>

                {/* Info Section */}
                <View style={styles.qrInfoSection}>
                  <View style={styles.qrInfoRow}>
                    <Ionicons name="person-outline" size={16} color="#7C8BA0" />
                    <Text style={styles.qrInfoText}>{profileData.fullName}</Text>
                  </View>
                  <View style={styles.qrInfoRow}>
                    <Ionicons name="flag-outline" size={16} color="#7C8BA0" />
                    <Text style={styles.qrInfoText}>{profileData.nationality}</Text>
                  </View>
                  {profileData.blockchainData?.tokenId && (
                    <View style={styles.qrInfoRow}>
                      <Ionicons name="diamond-outline" size={16} color="#7C8BA0" />
                      <Text style={styles.qrInfoText}>
                        Token ID: #{profileData.blockchainData.tokenId}
                      </Text>
                    </View>
                  )}
                  <View style={styles.qrInfoRow}>
                    <Ionicons name="earth-outline" size={16} color="#7C8BA0" />
                    <Text style={styles.qrInfoText}>Polygon Amoy Network</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Personal Information Card */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="person-outline" size={20} color="#7C3AED" />
                <Text style={styles.infoLabel}>Full Name</Text>
              </View>
              <Text style={styles.infoValue}>{profileData.fullName}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="flag-outline" size={20} color="#7C3AED" />
                <Text style={styles.infoLabel}>Nationality</Text>
              </View>
              <Text style={styles.infoValue}>{profileData.nationality}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="card-outline" size={20} color="#7C3AED" />
                <Text style={styles.infoLabel}>Passport</Text>
              </View>
              <Text style={styles.infoValue}>{profileData.passportNumber}</Text>
            </View>

            {profileData.governmentId && (
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="document-text-outline" size={20} color="#7C3AED" />
                  <Text style={styles.infoLabel}>Government ID</Text>
                </View>
                <Text style={styles.infoValue}>{profileData.governmentId}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
                <Text style={styles.infoLabel}>Age</Text>
              </View>
              <Text style={styles.infoValue}>{profileData.age}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="male-female-outline" size={20} color="#7C3AED" />
                <Text style={styles.infoLabel}>Gender</Text>
              </View>
              <Text style={styles.infoValue}>{profileData.gender}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="time-outline" size={20} color="#7C3AED" />
                <Text style={styles.infoLabel}>Created</Text>
              </View>
              <Text style={styles.infoValue}>
                {profileData.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        {/* Blockchain Information Card */}
        {profileData.blockchainData && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Blockchain Details</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="diamond-outline" size={20} color="#7C3AED" />
                  <Text style={styles.infoLabel}>Token ID</Text>
                </View>
                <Text style={styles.infoValue}>#{profileData.blockchainData.tokenId}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="wallet-outline" size={20} color="#7C3AED" />
                  <Text style={styles.infoLabel}>Wallet</Text>
                </View>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
                  {profileData.blockchainData.walletAddress}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="cube-outline" size={20} color="#7C3AED" />
                  <Text style={styles.infoLabel}>Contract</Text>
                </View>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
                  {profileData.blockchainData.contractAddress}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="link-outline" size={20} color="#7C3AED" />
                  <Text style={styles.infoLabel}>Transaction</Text>
                </View>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
                  {profileData.blockchainData.transactionHash}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="earth-outline" size={20} color="#7C3AED" />
                  <Text style={styles.infoLabel}>Network</Text>
                </View>
                <Text style={styles.infoValue}>{profileData.blockchainData.network}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={loadUserProfile}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="refresh" size={24} color="white" />
              <Text style={styles.actionButtonText}>Refresh Data</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="log-out" size={24} color="white" />
              <Text style={styles.actionButtonText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7C8BA0',
  },
  noDataText: {
    fontSize: 16,
    color: '#7C8BA0',
    marginBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
    backgroundColor: '#F5F7FA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7C8BA0',
    marginTop: 4,
  },
  photoSection: {
    padding: 20,
    paddingTop: 10,
  },
  photoCard: {
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  photoWrapper: {
    marginBottom: 16,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  photoName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  photoEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  qrToggleSection: {
    padding: 20,
    paddingTop: 10,
  },
  qrToggleButton: {
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  qrToggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 15,
    gap: 10,
  },
  qrToggleText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  qrCodeSection: {
    padding: 20,
    paddingTop: 10,
  },
  qrCodeCard: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  qrCodeGradient: {
    padding: 20,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  qrHeaderText: {
    flex: 1,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  qrSubtitle: {
    fontSize: 12,
    color: '#7C8BA0',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  tokenBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tokenText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  qrCodeWrapper: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrCodeInner: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  scanHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#7C8BA0',
    textAlign: 'center',
  },
  qrInfoSection: {
    backgroundColor: '#F5F7FA',
    borderRadius: 15,
    padding: 16,
    gap: 12,
  },
  qrInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qrInfoText: {
    fontSize: 14,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  infoSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7C8BA0',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A2E',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  actionsSection: {
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  actionButton: {
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 15,
    gap: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noIdSection: {
    padding: 20,
    paddingTop: 10,
  },
  noIdCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  noIdTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 12,
    marginBottom: 8,
  },
  noIdText: {
    fontSize: 14,
    color: '#78350F',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  mintButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mintButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  mintButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
