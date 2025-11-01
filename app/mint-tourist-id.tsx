import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import WalletConnector from '../components/WalletConnector';
import { uploadImageSimple } from '../config/cloudinary';
import { auth } from '../config/firebase';
import directWalletService from '../services/directWalletService';
import { getUserProfile, saveUserProfile } from '../services/userService';

const { width, height } = Dimensions.get('window');

interface UserProfile {
  fullName?: string;
  nationality?: string;
  passportNumber?: string;
  governmentId?: string;
  age?: string;
  gender?: string;
  photoUrl?: string;
  touristIdMinted?: boolean;
  [key: string]: any;
}

export default function MintTouristIdScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null);
  const [showWalletConnector, setShowWalletConnector] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [mintingStep, setMintingStep] = useState<'profile' | 'wallet' | 'minting' | 'complete'>('profile');
  
  // Form data
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [governmentId, setGovernmentId] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadExistingProfile(user.uid);
      } else {
        router.replace('/auth');
      }
    });

    return unsubscribe;
  }, []);

  const loadExistingProfile = async (userId: string) => {
    try {
      const profile = await getUserProfile(userId) as UserProfile | null;
      if (profile) {
        setExistingProfile(profile);
        // Pre-fill form with existing data (read-only)
        setFullName(profile.fullName || '');
        setNationality(profile.nationality || '');
        setPassportNumber(profile.passportNumber || '');
        setGovernmentId(profile.governmentId || '');
        setAge(profile.age || '');
        setGender(profile.gender || '');
        setPhotoUri(profile.photo || profile.photoUrl || null);
        
        // Check if user already has blockchain data
        if (profile.blockchainData && profile.blockchainData.tokenId) {
          Alert.alert(
            'Digital ID Already Minted',
            'You already have a Digital Tourist ID. Redirecting to your profile.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      } else {
        // If no profile exists, redirect back to create profile first
        Alert.alert(
          'Profile Not Found',
          'Please complete your profile first before minting a Digital ID.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error loading existing profile:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to select your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const generateTouristIdHash = (data: UserProfile): string => {
    // Simple hash generation for demo purposes
    // In production, this would use proper cryptographic hashing
    const combinedData = `${data.fullName}_${data.passportNumber}_${data.governmentId}_${Date.now()}`;
    return btoa(combinedData).substring(0, 16).toUpperCase();
  };

  const encryptAndMintNFT = async (profileData: UserProfile): Promise<string> => {
    // Simulate blockchain minting process
    const touristIdHash = generateTouristIdHash(profileData);
    
    // Simulate encryption process
    const encryptedData = {
      hash: touristIdHash,
      timestamp: Date.now(),
      blockchain: 'Ethereum', // For demo
      contractAddress: '0x' + Math.random().toString(16).substring(2, 42),
      tokenId: Math.floor(Math.random() * 1000000),
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('NFT Minted:', encryptedData);
    return touristIdHash;
  };

  const handleMintTouristId = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!fullName || !nationality || !passportNumber) {
      Alert.alert('Missing Information', 'Please fill in at least your name, nationality, and passport number to create your Tourist ID.');
      return;
    }

    // First, save the profile data
    setLoading(true);
    setMintingStep('profile');

    try {
      let photoUrl = photoUri;

      // Upload photo to Cloudinary if a new photo was selected
      if (photoUri && !photoUri.startsWith('http')) {
        console.log('Uploading new photo to Cloudinary...');
        photoUrl = await uploadImageSimple(photoUri);
      }

      const profileData: UserProfile = {
        fullName,
        nationality,
        passportNumber,
        governmentId,
        age,
        gender,
        photoUrl: photoUrl || undefined,
        profileCompleted: true,
        touristIdMinted: false,
      };

      // Save to Firestore first
      await saveUserProfile(user.uid, profileData);

      // Show wallet connector for blockchain minting
      setMintingStep('wallet');
      setShowWalletConnector(true);

    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
      setMintingStep('profile');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnected = (walletData: any) => {
    setWalletInfo(walletData);
    setWalletConnected(true);
    setMintingStep('wallet');
  };

  const handleMintNFT = async () => {
    if (!walletConnected || !user) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    setMintingStep('minting');
    setLoading(true);

    try {
      const profileData = {
        fullName,
        nationality,
        passportNumber,
        governmentId,
        age,
        gender,
        photoUrl: photoUri,
      };

      // Mint NFT on blockchain using direct wallet service
      const mintResult = await directWalletService.mintTouristID(profileData);

      // Update profile with blockchain information
      const updatedProfile = {
        ...profileData,
        profileCompleted: true,
        touristIdMinted: true,
        blockchainData: {
          tokenId: mintResult.tokenId,
          transactionHash: mintResult.transactionHash,
          contractAddress: mintResult.contractAddress,
          blockNumber: mintResult.blockNumber,
          mintedAt: new Date().toISOString(),
          network: 'Polygon Amoy',
        },
      };

      await saveUserProfile(user.uid, updatedProfile);

      setMintingStep('complete');

      Alert.alert(
        'Digital ID Created! 🎉',
        `Your digital identity has been successfully created and verified!\\n\\nID Number: ${mintResult.tokenId}\\nVerification: ${mintResult.transactionHash.substring(0, 10)}...`,
        [
          {
            text: 'View Details',
            onPress: () => console.log('Opening:', mintResult.explorerUrl)
          },
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );

    } catch (error: any) {
      console.error('Error minting NFT:', error);
      
      let errorMessage = 'Failed to mint your Tourist ID NFT. Please try again.';
      
      if (error.message.includes('already have a Tourist ID')) {
        errorMessage = 'You already have a Tourist ID NFT. Check your wallet.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient MATIC balance for gas fees. Please add funds to your wallet.';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.';
      }
      
      Alert.alert('Minting Failed', errorMessage);
      setMintingStep('wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Modern Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Create Digital ID</Text>
            </View>
          </View>

          <View style={styles.content}>
            {/* Profile Card with Photo */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <Text style={styles.cardTitle}>Your Profile</Text>
                <View style={styles.readOnlyBadge}>
                  <Ionicons name="lock-closed" size={12} color="#7C3AED" />
                  <Text style={styles.readOnlyBadgeText}>Read-only</Text>
                </View>
              </View>
              
              <View style={styles.photoWrapper}>
                <View style={styles.photoContainer}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.photo} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="person" size={48} color="#9CA3AF" />
                    </View>
                  )}
                </View>
                {photoUri && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                )}
              </View>
              
              <Text style={styles.photoNote}>
                Profile data from your sign-in account
              </Text>
            </View>

            {/* Personal Information Card */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-outline" size={24} color="#7C3AED" />
                <Text style={styles.cardTitle}>Personal Details</Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>{fullName || 'Not provided'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Nationality</Text>
                  <Text style={styles.infoValue}>{nationality || 'Not provided'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Passport Number</Text>
                  <Text style={styles.infoValue}>{passportNumber || 'Not provided'}</Text>
                </View>
              </View>

              {governmentId && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Government ID</Text>
                    <Text style={styles.infoValue}>{governmentId}</Text>
                  </View>
                </View>
              )}

              <View style={styles.row}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Age</Text>
                  <Text style={styles.infoValue}>{age || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{gender || 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* Progress Steps */}
            {mintingStep !== 'profile' && (
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Ionicons name="hourglass-outline" size={20} color="#7C3AED" />
                  <Text style={styles.progressTitle}>Minting Progress</Text>
                </View>
                <View style={styles.stepsContainer}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepCircle, styles.stepComplete]}>
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                    <Text style={styles.stepLabel}>Profile Saved</Text>
                  </View>
                  <View style={styles.stepLine} />
                  <View style={styles.stepItem}>
                    <View style={[styles.stepCircle, mintingStep === 'wallet' || mintingStep === 'minting' || mintingStep === 'complete' ? styles.stepComplete : styles.stepPending]}>
                      {mintingStep === 'complete' ? (
                        <Ionicons name="checkmark" size={16} color="white" />
                      ) : (
                        <Ionicons name="wallet-outline" size={16} color={mintingStep === 'wallet' || mintingStep === 'minting' ? 'white' : '#9CA3AF'} />
                      )}
                    </View>
                    <Text style={styles.stepLabel}>Wallet Connected</Text>
                  </View>
                  <View style={styles.stepLine} />
                  <View style={styles.stepItem}>
                    <View style={[styles.stepCircle, mintingStep === 'complete' ? styles.stepComplete : mintingStep === 'minting' ? styles.stepActive : styles.stepPending]}>
                      {mintingStep === 'complete' ? (
                        <Ionicons name="checkmark" size={16} color="white" />
                      ) : (
                        <Ionicons name="cube-outline" size={16} color={mintingStep === 'minting' ? 'white' : '#9CA3AF'} />
                      )}
                    </View>
                    <Text style={styles.stepLabel}>NFT Minted</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.actionButton, loading && styles.actionButtonDisabled]}
              onPress={mintingStep === 'profile' ? handleMintTouristId : handleMintNFT}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#9CA3AF', '#6B7280'] : ['#7C3AED', '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                {loading ? (
                  <View style={styles.buttonContent}>
                    <Ionicons name="hourglass-outline" size={22} color="white" />
                    <Text style={styles.buttonText}>
                      {mintingStep === 'profile' ? 'Processing...' : 'Minting...'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons 
                      name={mintingStep === 'profile' ? "rocket-outline" : "cube-outline"} 
                      size={22} 
                      color="white" 
                    />
                    <Text style={styles.buttonText}>
                      {mintingStep === 'profile' ? 'Create Digital ID' : 'Mint NFT Now'}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Disclaimer */}
            <View style={styles.disclaimerCard}>
              <Ionicons name="information-circle-outline" size={16} color="#7C8BA0" />
              <Text style={styles.disclaimerText}>
                {mintingStep === 'profile' 
                  ? 'Your data will be encrypted and secured on the blockchain'
                  : 'You need at least 0.01 MATIC for gas fees'
                }
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Wallet Connector Modal */}
        <WalletConnector
          visible={showWalletConnector}
          onClose={() => setShowWalletConnector(false)}
          onWalletConnected={handleWalletConnected}
          onMintRequested={handleMintNFT}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#F5F7FA',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    left: 20,
    zIndex: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#7C8BA0',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  // Blockchain Banner
  blockchainBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  bannerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  // Profile Card
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  readOnlyBadgeText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  photoWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#7C3AED',
    backgroundColor: '#F5F7FA',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: '32%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  photoNote: {
    fontSize: 12,
    color: '#7C8BA0',
    textAlign: 'center',
    marginTop: 8,
  },
  // Info Card
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#7C8BA0',
    marginBottom: 6,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  // Progress Card
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepComplete: {
    backgroundColor: '#10B981',
  },
  stepActive: {
    backgroundColor: '#7C3AED',
  },
  stepPending: {
    backgroundColor: '#E5E7EB',
  },
  stepLabel: {
    fontSize: 11,
    color: '#7C8BA0',
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLine: {
    flex: 0.5,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  // Action Button
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  actionButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  // Disclaimer
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 16,
    gap: 10,
    marginBottom: 30,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: '#7C8BA0',
    lineHeight: 18,
  },
});
