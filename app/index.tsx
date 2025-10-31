import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to auth screen on app start
    router.replace('/auth');
  }, []);

  return null;
}
