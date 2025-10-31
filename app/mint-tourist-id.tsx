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
    TextInput,
    TouchableOpacity,
    View,
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
        // Pre-fill form with existing data
        setFullName(profile.fullName || '');
        setNationality(profile.nationality || '');
        setPassportNumber(profile.passportNumber || '');
        setGovernmentId(profile.governmentId || '');
        setAge(profile.age || '');
        setGender(profile.gender || '');
        setPhotoUri(profile.photoUrl || null);
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
          {/* Header */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.header}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Ionicons name="shield-checkmark" size={64} color="white" />
              <Text style={styles.headerTitle}>Mint Tourist ID</Text>
              <Text style={styles.headerSubtitle}>
                Create your secure blockchain-based digital identity
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.content}>
            {/* Info Card */}
            <View style={styles.infoCard}>
              <LinearGradient
                colors={['#74b9ff', '#0984e3']}
                style={styles.infoCardGradient}
              >
                <Ionicons name="information-circle" size={24} color="white" />
                <Text style={styles.infoCardText}>
                  Your information will be encrypted and stored securely. Only you control access to your digital identity.
                </Text>
              </LinearGradient>
            </View>

            {/* Profile Photo */}
            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>Profile Photo</Text>
              <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={32} color="#999" />
                    <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Personal Information */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full legal name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nationality *</Text>
                <TextInput
                  style={styles.input}
                  value={nationality}
                  onChangeText={setNationality}
                  placeholder="Enter your nationality"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Passport Number *</Text>
                <TextInput
                  style={styles.input}
                  value={passportNumber}
                  onChangeText={setPassportNumber}
                  placeholder="Enter your passport number"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Government ID (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={governmentId}
                  onChangeText={setGovernmentId}
                  placeholder="Enter government ID number"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <TextInput
                    style={styles.input}
                    value={age}
                    onChangeText={setAge}
                    placeholder="Age"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Gender</Text>
                  <TextInput
                    style={styles.input}
                    value={gender}
                    onChangeText={setGender}
                    placeholder="Gender"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>

            {/* Progress Indicator */}
            {mintingStep !== 'profile' && (
              <View style={styles.progressSection}>
                <Text style={styles.sectionTitle}>Minting Progress</Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressStep, styles.progressStepComplete]}>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={[styles.progressText, styles.progressTextComplete]}>Profile Saved</Text>
                  </View>
                  <View style={[styles.progressStep, mintingStep === 'wallet' || mintingStep === 'minting' || mintingStep === 'complete' ? styles.progressStepActive : styles.progressStepInactive]}>
                    <Ionicons name={mintingStep === 'complete' ? "checkmark-circle" : "wallet"} size={20} color={mintingStep === 'complete' ? "white" : mintingStep === 'wallet' || mintingStep === 'minting' ? "#667eea" : "#999"} />
                    <Text style={[styles.progressText, mintingStep === 'complete' ? styles.progressTextComplete : mintingStep === 'wallet' || mintingStep === 'minting' ? styles.progressTextActive : styles.progressTextInactive]}>Wallet Connected</Text>
                  </View>
                  <View style={[styles.progressStep, mintingStep === 'minting' || mintingStep === 'complete' ? styles.progressStepActive : styles.progressStepInactive]}>
                    <Ionicons name={mintingStep === 'complete' ? "checkmark-circle" : "diamond"} size={20} color={mintingStep === 'complete' ? "white" : mintingStep === 'minting' ? "#667eea" : "#999"} />
                    <Text style={[styles.progressText, mintingStep === 'complete' ? styles.progressTextComplete : mintingStep === 'minting' ? styles.progressTextActive : styles.progressTextInactive]}>NFT Minted</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Mint Button */}
            <TouchableOpacity
              style={[styles.mintButton, loading && styles.mintButtonDisabled]}
              onPress={mintingStep === 'profile' ? handleMintTouristId : handleMintNFT}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#ccc', '#999'] : mintingStep === 'profile' ? ['#667eea', '#764ba2'] : ['#ff6b6b', '#ee5a24']}
                style={styles.mintButtonGradient}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.mintButtonText}>
                      {mintingStep === 'profile' ? 'Saving Profile...' : 'Minting NFT...'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.mintButtonContent}>
                    <Ionicons 
                      name={mintingStep === 'profile' ? "save" : "diamond"} 
                      size={24} 
                      color="white" 
                    />
                    <Text style={styles.mintButtonText}>
                      {mintingStep === 'profile' ? 'Save Profile & Continue' : 'Create Digital ID'}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              {mintingStep === 'profile' 
                ? '* Required fields. Your data will be encrypted and secured using blockchain technology.'
                : 'Make sure you have at least 0.01 MATIC for gas fees'
              }
            </Text>
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
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    padding: 20,
  },
  infoCard: {
    marginBottom: 30,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  infoCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoCardText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  photoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 16,
  },
  photoContainer: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#667eea',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f2f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  formSection: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2d3436',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  mintButton: {
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mintButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  mintButtonGradient: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  mintButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mintButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 30,
  },
  progressSection: {
    marginBottom: 30,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  progressStep: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  progressStepComplete: {
    backgroundColor: '#2ecc71',
  },
  progressStepActive: {
    backgroundColor: '#e8f0fe',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  progressStepInactive: {
    backgroundColor: '#f8f9fa',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  progressTextComplete: {
    color: 'white',
  },
  progressTextActive: {
    color: '#667eea',
  },
  progressTextInactive: {
    color: '#999',
  },
});
