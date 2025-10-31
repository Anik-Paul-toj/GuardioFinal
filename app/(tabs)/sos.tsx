import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface EmergencyContact {
  name: string;
  number: string;
  type: 'police' | 'medical' | 'fire' | 'tourist';
  icon: string;
  color: readonly [string, string];
}

const emergencyContacts: EmergencyContact[] = [
  {
    name: 'Police',
    number: '911',
    type: 'police',
    icon: 'shield-checkmark',
    color: ['#3498db', '#2980b9']
  },
  {
    name: 'Medical Emergency',
    number: '911',
    type: 'medical',
    icon: 'medical',
    color: ['#e74c3c', '#c0392b']
  },
  {
    name: 'Fire Department',
    number: '911',
    type: 'fire',
    icon: 'flame',
    color: ['#e67e22', '#d35400']
  },
  {
    name: 'Tourist Helpline',
    number: '1-800-TOURIST',
    type: 'tourist',
    icon: 'information-circle',
    color: ['#9b59b6', '#8e44ad']
  }
];

export default function SOSScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [sosActive, setSosActive] = useState(false);
  const [meshConnected, setMeshConnected] = useState(true);

  useEffect(() => {
    getLocationPermission();
  }, []);

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const triggerSOS = () => {
    Alert.alert(
      'Emergency SOS',
      'This will send your location to emergency contacts and authorities. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            setSosActive(true);
            // In real implementation, this would trigger actual SOS
            Alert.alert('SOS Sent!', 'Emergency services have been notified of your location.');
            setTimeout(() => setSosActive(false), 5000);
          }
        }
      ]
    );
  };

  const callEmergency = (contact: EmergencyContact) => {
    Alert.alert(
      `Call ${contact.name}`,
      `Do you want to call ${contact.number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            Linking.openURL(`tel:${contact.number}`);
          }
        }
      ]
    );
  };

  const shareLocation = () => {
    if (location) {
      const locationText = `My current location: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
      // In real app, this would use proper sharing
      Alert.alert('Location Shared', 'Your location has been shared with trusted contacts.');
    } else {
      Alert.alert('Location Unavailable', 'Unable to get your current location.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Services</Text>
          <Text style={styles.subtitle}>Get help when you need it most</Text>
        </View>

        {/* SOS Button */}
        <View style={styles.sosSection}>
          <TouchableOpacity
            style={[styles.sosButton, sosActive && styles.sosButtonActive]}
            onPress={triggerSOS}
            disabled={sosActive}
          >
            <LinearGradient
              colors={sosActive ? ['#c0392b', '#8b0000'] : ['#e74c3c', '#c0392b']}
              style={styles.sosButtonGradient}
            >
              <Ionicons 
                name={sosActive ? "checkmark-circle" : "warning"} 
                size={64} 
                color="white" 
              />
              <Text style={styles.sosButtonText}>
                {sosActive ? 'SOS SENT' : 'EMERGENCY SOS'}
              </Text>
              <Text style={styles.sosButtonSubtext}>
                {sosActive ? 'Help is on the way' : 'Tap to send emergency alert'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Status Indicators */}
        <View style={styles.statusSection}>
          <View style={styles.statusCard}>
            <Ionicons 
              name={location ? "location" : "location-outline"} 
              size={24} 
              color={location ? "#27ae60" : "#e74c3c"} 
            />
            <Text style={styles.statusText}>
              Location: {location ? 'Available' : 'Unavailable'}
            </Text>
          </View>
          <View style={styles.statusCard}>
            <Ionicons 
              name={meshConnected ? "wifi" : "wifi-outline"} 
              size={24} 
              color={meshConnected ? "#27ae60" : "#e74c3c"} 
            />
            <Text style={styles.statusText}>
              Mesh Network: {meshConnected ? 'Connected' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <View style={styles.contactsGrid}>
            {emergencyContacts.map((contact, index) => (
              <TouchableOpacity
                key={index}
                style={styles.contactCard}
                onPress={() => callEmergency(contact)}
              >
                <LinearGradient colors={contact.color} style={styles.contactCardGradient}>
                  <Ionicons name={contact.icon as any} size={32} color="white" />
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactNumber}>{contact.number}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={shareLocation}>
            <LinearGradient colors={['#3498db', '#2980b9']} style={styles.actionButtonGradient}>
              <Ionicons name="share-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>Share My Location</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient colors={['#f39c12', '#e67e22']} style={styles.actionButtonGradient}>
              <Ionicons name="people-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>Contact Trusted People</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient colors={['#2ecc71', '#27ae60']} style={styles.actionButtonGradient}>
              <Ionicons name="medical-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>Medical Information</Text>
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
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 100,
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
  sosSection: {
    padding: 20,
    alignItems: 'center',
  },
  sosButton: {
    width: width * 0.8,
    height: 200,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosButtonActive: {
    elevation: 4,
  },
  sosButtonGradient: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sosButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  sosButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  statusSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  statusCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#2d3436',
    fontWeight: '500',
  },
  contactsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 16,
  },
  contactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactCard: {
    width: (width - 60) / 2,
    height: 120,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  contactCardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  contactNumber: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 4,
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
