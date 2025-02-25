import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { Link, router } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, session } = useAuth();
  const theme = useTheme();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (session) {
      router.replace('/(protected)');
    }
  }, [session]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signIn(email, password);
      router.replace('/(protected)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text 
        variant="headlineMedium" 
        style={[styles.title, { color: theme.colors.primary }]}
      >
        Welcome Back
      </Text>
      
      {error ? (
        <Text 
          style={[styles.error, { color: theme.colors.error }]}
        >
          {error}
        </Text>
      ) : null}
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        mode="outlined"
      />
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
      />
      
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        style={styles.button}
      >
        Login
      </Button>
      
      <Link href="/auth/signup" asChild>
        <Button 
          mode="text"
          textColor={theme.colors.primary}
        >
          Don't have an account? Sign Up
        </Button>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
    marginBottom: 10,
  },
  error: {
    marginBottom: 10,
    textAlign: 'center',
  },
}); 