import UserProfileView from '@/components/UserProfileView';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Your Digital Tourist ID
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          View your saved profile information
        </ThemedText>
      </ThemedView>
      <UserProfileView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
  },
});
