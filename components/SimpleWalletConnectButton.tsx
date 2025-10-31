import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import directWalletService from '../services/directWalletService';

interface SimpleWalletConnectButtonProps {
  onConnected?: (address: string) => void;
}

export default function SimpleWalletConnectButton({ onConnected }: SimpleWalletConnectButtonProps) {
  const [connecting, setConnecting] = React.useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    
    try {
      // Initialize the service first
      await directWalletService.initialize();
      
      // Connect wallet directly (no QR)
      await directWalletService.connectWallet();
      
      // Check if connected
      const isConnected = directWalletService.isWalletConnected();
      if (isConnected) {
        const address = directWalletService.getWalletAddress();
        Alert.alert('Connected!', `Wallet: ${address?.substring(0, 6)}...${address?.substring(38)}`);
        onConnected?.(address || '');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      Alert.alert('Connection Failed', error.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleConnect}
      disabled={connecting}
    >
      <LinearGradient
        colors={connecting ? ['#bdc3c7', '#95a5a6'] : ['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <Ionicons 
          name={connecting ? "hourglass" : "wallet"} 
          size={20} 
          color="white" 
        />
        <Text style={styles.text}>
          {connecting ? 'Opening MetaMask...' : 'Open MetaMask'}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    marginVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
