import { Redirect } from 'expo-router';

export default function Index() {
  // Use Redirect component which safely waits for router to be ready
  return <Redirect href="/auth" />;
}
