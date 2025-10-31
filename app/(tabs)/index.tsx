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
  View
} from 'react-native';
import { auth } from '../../config/firebase';
import { removeUserFromStorage } from '../../services/authStorageService';
import { getUserProfile } from '../../services/userService';

const { width } = Dimensions.get('window');

interface UserProfile {
  touristIdMinted?: boolean;
  fullName?: string;
  [key: string]: any;
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  colors: readonly [string, string];
  onPress: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, colors, onPress }) => (
  <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.8}>
    <LinearGradient colors={colors} style={styles.featureCardGradient}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon as any} size={40} color="white" />
      </View>
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
              // Sign out from Firebase
              await auth.signOut();
              
              // Clear user data from AsyncStorage
              await removeUserFromStorage();
              
              console.log('User logged out successfully');
              
              // Navigate to auth screen
              router.replace('/auth');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
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
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>Good Morning</Text>
            <Text style={styles.userName}>{userProfile?.fullName || user?.email?.split('@')[0] || 'Traveler'}!</Text>
          </View>
          
          <TouchableOpacity style={styles.profileIcon} onPress={handleLogout}>
            <Ionicons name="person-circle" size={40} color="#667eea" />
          </TouchableOpacity>
        </View>

        {/* Tourist ID Status Banner */}
        {!hasTouristId ? (
          <TouchableOpacity 
            style={styles.bannerCard}
            onPress={() => router.push('/mint-tourist-id')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FF6B9D', '#FFA07A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <View>
                  <Text style={styles.bannerTitle}>Get Your Digital ID</Text>
                  <Text style={styles.bannerSubtitle}>Secure your travel identity</Text>
                  <TouchableOpacity style={styles.bannerButton}>
                    <Text style={styles.bannerButtonText}>Reserve Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </TouchableOpacity>
                </View>
                <View style={styles.bannerIconContainer}>
                  <Ionicons name="shield-checkmark" size={80} color="rgba(255,255,255,0.3)" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.bannerCard}>
            <LinearGradient
              colors={['#00D084', '#00C9A7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <View>
                  <Text style={styles.bannerTitle}>Digital ID Active</Text>
                  <Text style={styles.bannerSubtitle}>Your identity is verified</Text>
                  <TouchableOpacity 
                    style={styles.bannerButton}
                    onPress={() => router.push('/(tabs)/my-id')}
                  >
                    <Text style={styles.bannerButtonText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </TouchableOpacity>
                </View>
                <View style={styles.bannerIconContainer}>
                  <Ionicons name="checkmark-circle" size={80} color="rgba(255,255,255,0.3)" />
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Features Grid */}
        <View style={styles.contentSection}>
          <View style={styles.featuresGrid}>
            <FeatureCard
              icon="shield-checkmark-outline"
              title="Digital ID"
              description="Secure identity verification"
              colors={['#FFB800', '#FFA500']}
              onPress={() => router.push('/personal-id')}
            />
            
            <FeatureCard
              icon="pulse-outline"
              title="SOS Alert"
              description="Emergency assistance"
              colors={['#00D9FF', '#00B8D4']}
              onPress={() => router.push('/(tabs)/sos')}
            />
            
            <FeatureCard
              icon="location-outline"
              title="Tracking"
              description="Real-time location"
              colors={['#FF6B9D', '#E91E63']}
              onPress={() => router.push('/(tabs)/tracking')}
            />
            
            <FeatureCard
              icon="globe-outline"
              title="Explore"
              description="Discover places"
              colors={['#9C27B0', '#7B1FA2']}
              onPress={() => router.push('/(tabs)/explore')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/my-id')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="card-outline" size={24} color="#2196F3" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View My ID</Text>
              <Text style={styles.actionSubtitle}>Access your digital identity</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => Alert.alert('Coming Soon', 'Travel history feature will be available soon!')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="airplane-outline" size={24} color="#9C27B0" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Travel History</Text>
              <Text style={styles.actionSubtitle}>View your travel records</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => Alert.alert('Security', 'Your data is protected with blockchain technology!')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="lock-closed-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Security Settings</Text>
              <Text style={styles.actionSubtitle}>Manage your privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

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
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingSection: {
    flex: 1,
    marginLeft: 15,
  },
  greetingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Banner Card Styles
  bannerCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bannerGradient: {
    padding: 25,
    minHeight: 160,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 15,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 5,
  },
  bannerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bannerIconContainer: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  // Content Section
  contentSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 55) / 2,
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  featureCardGradient: {
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  featureCardDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },
  // Action Card Styles
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
});
