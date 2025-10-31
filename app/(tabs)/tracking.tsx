import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface IoTDevice {
  id: string;
  name: string;
  type: 'tracker' | 'sensor' | 'beacon';
  status: 'online' | 'offline' | 'warning';
  battery: number;
  lastSeen: string;
  icon: string;
}

const mockIoTDevices: IoTDevice[] = [
  {
    id: '001',
    name: 'Smart Badge',
    type: 'tracker',
    status: 'online',
    battery: 85,
    lastSeen: '2 mins ago',
    icon: 'card'
  },
  {
    id: '002',
    name: 'Emergency Beacon',
    type: 'beacon',
    status: 'online',
    battery: 92,
    lastSeen: '1 min ago',
    icon: 'radio'
  },
  {
    id: '003',
    name: 'Health Monitor',
    type: 'sensor',
    status: 'warning',
    battery: 23,
    lastSeen: '5 mins ago',
    icon: 'fitness'
  }
];

export default function TrackingScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [autoSosEnabled, setAutoSosEnabled] = useState(false);
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [devices] = useState<IoTDevice[]>(mockIoTDevices);

  useEffect(() => {
    if (trackingEnabled) {
      startLocationTracking();
    }
  }, [trackingEnabled]);

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy || 0,
          timestamp: currentLocation.timestamp,
        });

        // Start watching position
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (newLocation) => {
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              accuracy: newLocation.coords.accuracy || 0,
              timestamp: newLocation.timestamp,
            });
          }
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to access your location. Please check permissions.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#27ae60';
      case 'warning': return '#f39c12';
      case 'offline': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return '#27ae60';
    if (battery > 20) return '#f39c12';
    return '#e74c3c';
  };

  const handleDevicePress = (device: IoTDevice) => {
    Alert.alert(
      device.name,
      `Status: ${device.status}\nBattery: ${device.battery}%\nLast seen: ${device.lastSeen}`,
      [{ text: 'OK' }]
    );
  };

  const shareLocation = () => {
    if (location) {
      Alert.alert(
        'Share Location',
        'Your current location will be shared with trusted contacts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share', onPress: () => {
            // In real app, this would share location
            Alert.alert('Location Shared', 'Your location has been shared successfully.');
          }}
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Location & Tracking</Text>
          <Text style={styles.subtitle}>Monitor your location and connected devices</Text>
        </View>

        {/* Current Location */}
        <View style={styles.locationSection}>
          <LinearGradient colors={['#3498db', '#2980b9']} style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={32} color="white" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>Current Location</Text>
                <Text style={styles.locationStatus}>
                  {trackingEnabled ? 'Live Tracking Active' : 'Tracking Disabled'}
                </Text>
              </View>
              <Switch
                value={trackingEnabled}
                onValueChange={setTrackingEnabled}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={trackingEnabled ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
            
            {location && trackingEnabled && (
              <View style={styles.locationDetails}>
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Latitude:</Text>
                  <Text style={styles.locationValue}>{location.latitude.toFixed(6)}</Text>
                </View>
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Longitude:</Text>
                  <Text style={styles.locationValue}>{location.longitude.toFixed(6)}</Text>
                </View>
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Accuracy:</Text>
                  <Text style={styles.locationValue}>{location.accuracy.toFixed(0)}m</Text>
                </View>
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Updated:</Text>
                  <Text style={styles.locationValue}>
                    {new Date(location.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Smart Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Smart Safety Features</Text>
          
          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Ionicons name="warning" size={24} color="#e74c3c" />
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Auto SOS Trigger</Text>
                <Text style={styles.featureDescription}>
                  Automatically send SOS if unusual activity detected
                </Text>
              </View>
              <Switch
                value={autoSosEnabled}
                onValueChange={setAutoSosEnabled}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={autoSosEnabled ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#27ae60" />
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Geofence Protection</Text>
                <Text style={styles.featureDescription}>
                  Alert contacts when you leave safe zones
                </Text>
              </View>
              <Switch
                value={geofenceEnabled}
                onValueChange={setGeofenceEnabled}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={geofenceEnabled ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* IoT Devices */}
        <View style={styles.devicesSection}>
          <Text style={styles.sectionTitle}>Connected IoT Devices</Text>
          
          {devices.map((device) => (
            <TouchableOpacity
              key={device.id}
              style={styles.deviceCard}
              onPress={() => handleDevicePress(device)}
            >
              <View style={styles.deviceIcon}>
                <Ionicons name={device.icon as any} size={24} color={getStatusColor(device.status)} />
              </View>
              
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceType}>{device.type.toUpperCase()}</Text>
                <Text style={styles.deviceLastSeen}>Last seen: {device.lastSeen}</Text>
              </View>
              
              <View style={styles.deviceStatus}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(device.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(device.status) }]}>
                  {device.status.toUpperCase()}
                </Text>
                <View style={styles.batteryContainer}>
                  <Ionicons name="battery-half" size={16} color={getBatteryColor(device.battery)} />
                  <Text style={[styles.batteryText, { color: getBatteryColor(device.battery) }]}>
                    {device.battery}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={shareLocation}>
            <LinearGradient colors={['#2ecc71', '#27ae60']} style={styles.actionButtonGradient}>
              <Ionicons name="share-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>Share Current Location</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient colors={['#9b59b6', '#8e44ad']} style={styles.actionButtonGradient}>
              <Ionicons name="map-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>View Location History</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient colors={['#f39c12', '#e67e22']} style={styles.actionButtonGradient}>
              <Ionicons name="settings-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>Tracking Settings</Text>
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
  locationSection: {
    padding: 20,
  },
  locationCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  locationDetails: {
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  locationValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'monospace',
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
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureInfo: {
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
  devicesSection: {
    padding: 20,
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 2,
  },
  deviceType: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 2,
  },
  deviceLastSeen: {
    fontSize: 12,
    color: '#95a5a6',
  },
  deviceStatus: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryText: {
    fontSize: 12,
    fontWeight: '500',
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
