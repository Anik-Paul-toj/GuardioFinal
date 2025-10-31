import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../config/firebase';
import { getUserProfile } from '../services/userService';

interface UserProfile {
  fullName: string;
  nationality: string;
  passportNumber: string;
  governmentId?: string;
  age: string;
  gender: string;
  photo?: string;
  createdAt?: any;
}

export default function UserProfileView() {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No profile data found</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadUserProfile}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={48} color="#667eea" />
        <Text style={styles.title}>Digital Tourist ID</Text>
      </View>

      {/* Profile Photo */}
      {profileData.photo && (
        <View style={styles.photoContainer}>
          <Image source={{ uri: profileData.photo }} style={styles.profilePhoto} />
          <Text style={styles.photoLabel}>Profile Photo</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Full Name:</Text>
          <Text style={styles.value}>{profileData.fullName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Nationality:</Text>
          <Text style={styles.value}>{profileData.nationality}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Passport Number:</Text>
          <Text style={styles.value}>{profileData.passportNumber}</Text>
        </View>

        {profileData.governmentId && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Government ID:</Text>
            <Text style={styles.value}>{profileData.governmentId}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.label}>Age:</Text>
          <Text style={styles.value}>{profileData.age}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Gender:</Text>
          <Text style={styles.value}>{profileData.gender}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Created:</Text>
          <Text style={styles.value}>
            {profileData.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadUserProfile}>
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.refreshButtonText}>Refresh Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  photoLabel: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
