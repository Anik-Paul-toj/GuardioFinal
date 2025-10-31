import { Image } from 'expo-image';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => router.replace('/auth') }
      ]
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to Guardio!</ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">You're successfully logged in!</ThemedText>
        <ThemedText>
          This is the main app screen. You can navigate through the tabs and explore the features.
        </ThemedText>
        
        <TouchableOpacity style={styles.idButton} onPress={() => router.push('/personal-id')}>
          <ThemedText style={styles.idButtonText}>Complete Digital Tourist ID</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">App Features</ThemedText>
        <ThemedText>
          Explore the app by navigating through the different tabs. This demo shows a complete authentication flow with a beautiful UI.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  idButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  idButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
