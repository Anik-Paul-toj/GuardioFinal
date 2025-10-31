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
import { auth } from '../../config/firebase';
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Digital ID</Text>
          <Text style={styles.subtitle}>
            {hasValidID ? 'Your secure digital identity' : 'Create your digital identity'}
          </Text>
        </View>

        {hasValidID ? (
          /* Digital ID Card */
          <View style={styles.idCardContainer}>
            <LinearGradient 
              colors={['#667eea', '#764ba2']} 
              style={styles.idCard}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Digital ID Card</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>

              {/* User Photo and Info */}
              <View style={styles.cardContent}>
                <View style={styles.photoContainer}>
                  {userProfile?.photoUrl ? (
                    <Image source={{ uri: userProfile.photoUrl }} style={styles.userPhoto} />
                  ) : (
                    <View style={styles.defaultPhoto}>
                      <Ionicons name="person" size={40} color="white" />
                    </View>
                  )}
                </View>
                
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userProfile?.fullName || 'User Name'}</Text>
                  <Text style={styles.userDetails}>
                    {userProfile?.nationality || 'Nationality'} • Age {userProfile?.age || '--'}
                  </Text>
                  {userProfile?.blockchainData?.tokenId && (
                    <Text style={styles.tokenId}>
                      ID: #{userProfile.blockchainData.tokenId}
                    </Text>
                  )}
                </View>
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.footerText}>Secure Digital ID</Text>
                </View>
                <View style={styles.footerItem}>
                  <Ionicons name="time" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.footerText}>
                    Created {userProfile?.blockchainData?.mintedAt ? 
                      new Date(userProfile.blockchainData.mintedAt).toLocaleDateString() : 
                      'Recently'
                    }
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : (
          /* Create ID Prompt */
          <View style={styles.createIdContainer}>
            <LinearGradient 
              colors={['#f39c12', '#e67e22']} 
              style={styles.createIdCard}
            >
              <Ionicons name="id-card-outline" size={64} color="white" />
              <Text style={styles.createIdTitle}>Create Your Digital ID</Text>
              <Text style={styles.createIdDescription}>
                Secure your identity with our trusted digital ID system. 
                Perfect for tourist services and emergency identification.
              </Text>
              <TouchableOpacity style={styles.createIdButton} onPress={handleCreateID}>
                <Text style={styles.createIdButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#e67e22" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* ID Features */}
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

        {/* Actions */}
        {hasValidID && (
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>ID Actions</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleVerifyID}>
              <LinearGradient colors={['#2ecc71', '#27ae60']} style={styles.actionButtonGradient}>
                <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                <Text style={styles.actionButtonText}>Verify ID Status</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient colors={['#3498db', '#2980b9']} style={styles.actionButtonGradient}>
                <Ionicons name="share-outline" size={24} color="white" />
                <Text style={styles.actionButtonText}>Share ID (QR Code)</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient colors={['#95a5a6', '#7f8c8d']} style={styles.actionButtonGradient}>
                <Ionicons name="download-outline" size={24} color="white" />
                <Text style={styles.actionButtonText}>Download Backup</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    color: '#636e72',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#636e72',
    textAlign: 'center',
  },
  idCardContainer: {
    padding: 20,
  },
  idCard: {
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userDetails: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 4,
  },
  tokenId: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  createIdContainer: {
    padding: 20,
  },
  createIdCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createIdTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  createIdDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createIdButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  createIdButtonText: {
    color: '#e67e22',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 16,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#636e72',
    lineHeight: 20,
  },
  actionsSection: {
    padding: 20,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
