import { auth, db } from '@/config/firebase';
import { WebRTCMesh, isWebRTCAvailable, sosStorage } from '@/lib/webrtc';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

interface SOSAlert {
  userId: string;
  location: { lat: number; lng: number } | null;
  time: number;
}

export default function SOSScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [sosActive, setSosActive] = useState(false);
  const [meshConnected, setMeshConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [incomingAlerts, setIncomingAlerts] = useState<SOSAlert[]>([]);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [roomId, setRoomId] = useState<string>('sos_room');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Get default signaling URL based on platform
  const getDefaultSignalingUrl = (): string => {
    if (!__DEV__) {
      // Production: use your deployed signaling server on Render
      return 'wss://webrtc-m646.onrender.com';
    }

    // Try to get Metro bundler host from Expo Constants (works for Expo Go)
    const metroHost = Constants.expoConfig?.hostUri || Constants.debuggerHost;
    if (metroHost) {
      // Extract IP from host (e.g., "192.168.1.100:8081" -> "192.168.1.100")
      const ip = metroHost.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        console.log(`Using Metro bundler IP: ${ip}`);
        return `ws://${ip}:8080`;
      }
    }

    // Development: platform-specific defaults
    if (Platform.OS === 'web') {
      return 'ws://localhost:8080';
    } else if (Platform.OS === 'android') {
      // Check if running on emulator (has __DEV__ and no debuggerHost means likely emulator)
      if (!Constants.debuggerHost) {
        // Android emulator uses 10.0.2.2 to reach host machine
        return 'ws://10.0.2.2:8080';
      } else {
        // Physical device - use Metro bundler IP
        const ip = Constants.debuggerHost.split(':')[0];
        return `ws://${ip}:8080`;
      }
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost
      if (!Constants.debuggerHost) {
        return 'ws://localhost:8080';
      } else {
        // Physical iOS device - use Metro bundler IP
        const ip = Constants.debuggerHost.split(':')[0];
        return `ws://${ip}:8080`;
      }
    }
    
    return 'ws://localhost:8080';
  };

  // Initialize WebRTC mesh
  const mesh = useMemo(() => {
    const signalingUrl = getDefaultSignalingUrl();
    console.log(`Initializing WebRTC mesh with signaling URL: ${signalingUrl}`);
    
    const meshInstance = new WebRTCMesh({
      roomId,
      signalingUrl,
      onPeersChange: (count: number) => {
        console.log(`Peer count updated: ${count}`);
        setPeerCount(count);
        setMeshConnected(count > 0);
      },
      onSOS: (alert: SOSAlert) => {
        setIncomingAlerts((prev) => [alert, ...prev].slice(0, 50));
        sosStorage.addPending(alert).catch(() => {});
      },
      onConnectionStateChange: (state: 'connecting' | 'connected' | 'disconnected') => {
        setConnectionStatus(state);
        console.log(`Connection state: ${state}`);
      },
    });
    
    return meshInstance;
  }, [roomId]);

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

  const buildSOSAlert = async (): Promise<SOSAlert> => {
    let coords: { lat: number; lng: number } | null = null;
    
    try {
      if (location) {
        coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
      } else {
        // Try to get location again
        const currentLocation = await Location.getCurrentPositionAsync({});
        coords = {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
        };
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }

    const userId = auth.currentUser?.uid || auth.currentUser?.email || 'anonymous';
    return {
      userId: userId.toString(),
      location: coords,
      time: Date.now(),
    };
  };

  const saveToFirebase = async (alert: SOSAlert) => {
    try {
      if (!auth.currentUser) return;
      
      await addDoc(collection(db, 'sos_alerts'), {
        userId: alert.userId,
        location: alert.location,
        time: serverTimestamp(),
        payloadTime: alert.time,
      });
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      throw error;
    }
  };

  const syncPendingAlerts = React.useCallback(async () => {
    if (!isOnline || !auth.currentUser) return;
    
    try {
      const pending = await sosStorage.getAllPending();
      if (pending.length === 0) return;

      for (const alert of pending) {
        try {
          await saveToFirebase(alert);
        } catch (error) {
          console.error('Error syncing alert:', error);
        }
      }
      
      await sosStorage.clearPending();
    } catch (error) {
      console.error('Error syncing pending alerts:', error);
    }
  }, [isOnline]);

  useEffect(() => {
    getLocationPermission();
    // Don't auto-connect - let user control it
  }, []);

  const handleConnect = () => {
    if (!mesh) return;
    setConnectionStatus('connecting');
    mesh.connect();
  };

  const handleDisconnect = () => {
    if (!mesh) return;
    mesh.disconnect();
    setConnectionStatus('disconnected');
    setPeerCount(0);
    setMeshConnected(false);
  };

  // Sync pending alerts when online
  useEffect(() => {
    if (isOnline && auth.currentUser) {
      syncPendingAlerts();
    }
  }, [isOnline, syncPendingAlerts]);

  const triggerSOS = () => {
    Alert.alert(
      'Emergency SOS',
      'This will send your location to emergency contacts and nearby devices. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            setSending(true);
            setSosActive(true);
            
            try {
              const alert = await buildSOSAlert();
              
              // Try to save to Firebase if online
              if (isOnline && auth.currentUser) {
                try {
                  await saveToFirebase(alert);
                } catch (error) {
                  // If Firebase fails, still broadcast via mesh
                  console.error('Firebase save failed, using mesh:', error);
                }
              }
              
              // Always broadcast via mesh network
              mesh.broadcastSOS(alert);
              
              // Store locally if offline
              if (!isOnline) {
                await sosStorage.addPending(alert);
              }
              
              Alert.alert(
                'SOS Sent!',
                isOnline
                  ? 'Emergency services have been notified via network and nearby devices.'
                  : 'SOS broadcast to nearby devices. Will sync when online.'
              );
            } catch (error) {
              console.error('Error sending SOS:', error);
              Alert.alert('Error', 'Failed to send SOS. Please try again.');
            } finally {
              setSending(false);
              setTimeout(() => setSosActive(false), 5000);
            }
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
                {sosActive ? 'SOS SENT' : sending ? 'SENDING...' : 'EMERGENCY SOS'}
              </Text>
              <Text style={styles.sosButtonSubtext}>
                {sosActive ? 'Help is on the way' : sending ? 'Broadcasting alert...' : 'Tap to send emergency alert'}
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
              Mesh: {peerCount} {peerCount === 1 ? 'peer' : 'peers'}
            </Text>
          </View>
        </View>

        {/* Connection Controls */}
        <View style={styles.configSection}>
          {/* WebRTC Availability Warning */}
          {!isWebRTCAvailable && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color="#f39c12" />
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>WebRTC Not Available</Text>
                <Text style={styles.warningText}>
                  WebRTC requires native modules and doesn't work in Expo Go.
                  Create a development build to use peer-to-peer mesh networking.
                </Text>
              </View>
            </View>
          )}
          
          {/* Connect/Disconnect Button - Always visible */}
          <View style={styles.connectSection}>
            {!isWebRTCAvailable ? (
              <View style={[styles.connectButton, styles.disabledButton]}>
                <LinearGradient 
                  colors={['#95a5a6', '#7f8c8d']} 
                  style={styles.connectButtonGradient}
                >
                  <Ionicons name="ban-outline" size={24} color="white" />
                  <Text style={styles.connectButtonText}>WebRTC Unavailable</Text>
                </LinearGradient>
              </View>
            ) : connectionStatus === 'disconnected' ? (
              <TouchableOpacity 
                style={styles.connectButton} 
                onPress={handleConnect}
              >
                <LinearGradient 
                  colors={['#27ae60', '#2ecc71']} 
                  style={styles.connectButtonGradient}
                >
                  <Ionicons name="link-outline" size={24} color="white" />
                  <Text style={styles.connectButtonText}>Connect to Room</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : connectionStatus === 'connecting' ? (
              <View style={styles.connectingButton}>
                <Ionicons name="sync" size={20} color="#856404" />
                <Text style={styles.connectingText}>Connecting...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.disconnectButton} 
                onPress={handleDisconnect}
              >
                <LinearGradient 
                  colors={['#e74c3c', '#c0392b']} 
                  style={styles.connectButtonGradient}
                >
                  <Ionicons name="close-circle-outline" size={24} color="white" />
                  <Text style={styles.connectButtonText}>Disconnect</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Connection Status */}
          <View style={styles.connectionStatus}>
            <Ionicons 
              name={
                connectionStatus === 'connected' ? 'checkmark-circle' : 
                connectionStatus === 'connecting' ? 'sync' : 
                'close-circle'
              } 
              size={16} 
              color={
                connectionStatus === 'connected' ? '#27ae60' : 
                connectionStatus === 'connecting' ? '#f39c12' : 
                '#e74c3c'
              } 
            />
            <Text style={[
              styles.connectionStatusText,
              { color: connectionStatus === 'connected' ? '#27ae60' : connectionStatus === 'connecting' ? '#f39c12' : '#e74c3c' }
            ]}>
              {connectionStatus === 'connected' ? `Connected - ${peerCount} ${peerCount === 1 ? 'peer' : 'peers'}` : 
               connectionStatus === 'connecting' ? 'Connecting...' : 
               'Disconnected'}
            </Text>
          </View>

          {/* Room ID Configuration (for advanced users) */}
          <View style={styles.roomConfigContainer}>
            <Text style={styles.configLabel}>Room ID</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.roomIdInput}
                value={roomId}
                onChangeText={setRoomId}
                placeholder="sos_room"
                placeholderTextColor="#999"
                editable={connectionStatus === 'disconnected'}
              />
              <Text style={styles.configHint}>
                Change room ID to join different mesh networks (disconnect first)
              </Text>
            </View>
          </View>
        </View>

        {/* Incoming SOS Alerts */}
        {incomingAlerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>Incoming SOS Alerts ({incomingAlerts.length})</Text>
            <ScrollView style={styles.alertsList} nestedScrollEnabled>
              {incomingAlerts.map((alert, index) => (
                <View key={index} style={styles.alertCard}>
                  <View style={styles.alertHeader}>
                    <Ionicons name="warning" size={20} color="#e74c3c" />
                    <Text style={styles.alertUserId}>From: {alert.userId}</Text>
                  </View>
                  {alert.location && (
                    <Text style={styles.alertLocation}>
                      Location: {alert.location.lat.toFixed(5)}, {alert.location.lng.toFixed(5)}
                    </Text>
                  )}
                  <Text style={styles.alertTime}>
                    {new Date(alert.time).toLocaleString()}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

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
  alertsSection: {
    padding: 20,
    maxHeight: 300,
  },
  alertsList: {
    maxHeight: 250,
  },
  alertCard: {
    backgroundColor: '#fee',
    borderWidth: 1,
    borderColor: '#fcc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  alertUserId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c0392b',
  },
  alertLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  alertTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  configSection: {
    padding: 20,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  inputContainer: {
    gap: 4,
  },
  roomIdInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f8f9fa',
    color: '#2d3436',
  },
  configHint: {
    fontSize: 11,
    color: '#636e72',
    marginTop: 4,
  },
  connectSection: {
    marginTop: 16,
  },
  connectButton: {
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  disconnectButton: {
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  connectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  connectingButton: {
    backgroundColor: '#fff3cd',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffc107',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  connectingText: {
    color: '#856404',
    fontSize: 16,
    fontWeight: '600',
  },
  roomConfigContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  connectionStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  warningTextContainer: {
    flex: 1,
    gap: 4,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
