import { Redirect } from 'expo-router';

export default function Index() {
  // TESTING MODE: Redirect directly to home page
  return <Redirect href="/(tabs)" />;

  /* Uncomment this code when you want to enable authentication:
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('=== Starting Auth Check ===');
      
      // First check AsyncStorage
      const storedUser = await getUserFromStorage();
      console.log('Stored user from AsyncStorage:', storedUser ? 'Found' : 'Not found');
      
      // Then check Firebase auth state
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('Firebase auth state:', firebaseUser ? firebaseUser.uid : 'No user');
        
        if (firebaseUser) {
          // User is signed in with Firebase
          // Make sure AsyncStorage is in sync
          if (!storedUser) {
            console.log('Syncing user to AsyncStorage');
            await saveUserToStorage({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              lastLogin: new Date().toISOString(),
            });
          }
          setIsAuthenticated(true);
        } else if (storedUser) {
          // AsyncStorage has user but Firebase doesn't - possible session issue
          console.log('User in storage but not in Firebase - keeping authenticated');
          setIsAuthenticated(true);
        } else {
          // No user in either place
          console.log('No authenticated user found');
          setIsAuthenticated(false);
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
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  console.log('Redirecting to:', isAuthenticated ? '/(tabs)' : '/auth');
  
  // Redirect based on authentication status
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/auth'} />;
  */
}

