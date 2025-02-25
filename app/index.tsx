import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function App() {
  const { session } = useAuth();
  return <Redirect href={session ? "/home" : "/auth/login"} />;
} 