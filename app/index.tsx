import { Redirect } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../config/firebase';
import { getUserFromStorage, saveUserToStorage } from '../services/authStorageService';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('=== Starting Auth Check ===');
      
      // Check Firebase auth state (persists automatically)
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('Firebase auth state:', firebaseUser ? firebaseUser.uid : 'No user');
        
        if (firebaseUser) {
          // User is signed in with Firebase
          console.log('User is authenticated:', firebaseUser.email);
          
          // Sync to AsyncStorage if needed
          const storedUser = await getUserFromStorage();
          if (!storedUser) {
            console.log('Syncing user to AsyncStorage');
            await saveUserToStorage({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              lastLogin: new Date().toISOString(),
            });
          }
          
          setIsAuthenticated(true);
        } else {
          // No Firebase user - check AsyncStorage as fallback
          const storedUser = await getUserFromStorage();
          if (storedUser) {
            console.log('User in storage but not in Firebase - clearing storage');
            setIsAuthenticated(false);
          } else {
            console.log('No authenticated user found');
            setIsAuthenticated(false);
          }
        }
        
        setIsChecking(false);
      });

      // Cleanup subscription
      return () => unsubscribe();
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setIsChecking(false);
    }
  };

  // Show loading indicator while checking auth state
  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  console.log('Redirecting to:', isAuthenticated ? '/(tabs)' : '/auth');
  
  // Redirect based on authentication status
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/auth'} />;
}
