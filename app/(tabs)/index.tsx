import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  RefreshControl,
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
  touristIdMinted?: boolean;
  [key: string]: any;
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color: readonly [string, string];
  onPress: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, onPress }) => (
  <TouchableOpacity style={styles.featureCard} onPress={onPress}>
    <LinearGradient colors={color} style={styles.featureCardGradient}>
      <Ionicons name={icon as any} size={32} color="white" />
      <Text style={styles.featureCardTitle}>{title}</Text>
      <Text style={styles.featureCardDescription}>{description}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasTouristId, setHasTouristId] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadUserProfile(user.uid);
      } else {
        setUser(null);
        setUserProfile(null);
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
      // Check if user has completed tourist ID
      setHasTouristId(profile?.touristIdMinted === true);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const onRefresh = async () => {
    if (user) {
      setRefreshing(true);
      await loadUserProfile(user.uid);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            try {
              await auth.signOut();
              router.replace('/auth');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appTitle}>Guardio</Text>
          <Text style={styles.subtitle}>Your Digital Tourist ID Platform</Text>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Tourist ID Status Card */}
        {!hasTouristId ? (
          <TouchableOpacity 
            style={styles.mintCard}
            onPress={() => router.push('/mint-tourist-id')}
          >
            <LinearGradient
              colors={['#ff6b6b', '#ee5a24']}
              style={styles.mintCardGradient}
            >
              <View style={styles.mintCardContent}>
                <Ionicons name="shield-outline" size={48} color="white" />
                <Text style={styles.mintCardTitle}>Mint Your Tourist ID</Text>
                <Text style={styles.mintCardSubtitle}>
                  Create your secure blockchain-based digital tourist identity
                </Text>
                <View style={styles.mintButton}>
                  <Text style={styles.mintButtonText}>Get Started</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.idStatusCard}>
            <LinearGradient
              colors={['#00b894', '#00a085']}
              style={styles.idStatusGradient}
            >
              <View style={styles.idStatusContent}>
                <Ionicons name="shield-checkmark" size={48} color="white" />
                <Text style={styles.idStatusTitle}>Tourist ID Active</Text>
                <Text style={styles.idStatusSubtitle}>
                  Your digital identity is secured on the blockchain
                </Text>
                <TouchableOpacity 
                  style={styles.viewIdButton}
                  onPress={() => router.push('/(tabs)/explore')}
                >
                  <Text style={styles.viewIdButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Platform Features</Text>
          
          <View style={styles.featuresGrid}>
            <FeatureCard
              icon="document-text-outline"
              title="Identity Verification"
              description="Secure passport & ID verification"
              color={['#74b9ff', '#0984e3']}
              onPress={() => router.push('/personal-id')}
            />
            
            <FeatureCard
              icon="globe-outline"
              title="Travel Records"
              description="Track your travel history"
              color={['#a29bfe', '#6c5ce7']}
              onPress={() => Alert.alert('Coming Soon', 'Travel records feature will be available soon!')}
            />
            
            <FeatureCard
              icon="lock-closed-outline"
              title="Blockchain Security"
              description="Encrypted NFT protection"
              color={['#fd79a8', '#e84393']}
              onPress={() => Alert.alert('Blockchain', 'Your data is secured using blockchain technology!')}
            />
            
            <FeatureCard
              icon="card-outline"
              title="Digital Wallet"
              description="Manage your tourist assets"
              color={['#fdcb6e', '#e17055']}
              onPress={() => Alert.alert('Coming Soon', 'Digital wallet feature will be available soon!')}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  mintCard: {
    marginBottom: 30,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mintCardGradient: {
    borderRadius: 16,
    padding: 24,
  },
  mintCardContent: {
    alignItems: 'center',
  },
  mintCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  mintCardSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  mintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  mintButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  idStatusCard: {
    marginBottom: 30,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  idStatusGradient: {
    borderRadius: 16,
    padding: 24,
  },
  idStatusContent: {
    alignItems: 'center',
  },
  idStatusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  idStatusSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  viewIdButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  viewIdButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  featuresContainer: {
    marginTop: 10,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCard: {
    width: (width - 56) / 2,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  featureCardGradient: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureCardDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
