import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { Link, router } from 'expo-router';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const theme = useTheme();

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signUp(email, password, fullName);
      
      if (result?.confirmEmail) {
        // Show confirmation message
        Alert.alert(
          "Check your email",
          "Please check your email for a confirmation link to complete your registration.",
          [{ text: "OK", onPress: () => router.push('/auth/login') }]
        );
      }
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
        Create Account
      </Text>
      
      {error ? (
        <Text 
          style={[styles.error, { color: theme.colors.error }]}
        >
          {error}
        </Text>
      ) : null}
      
      <TextInput
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
        mode="outlined"
      />

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
        onPress={handleSignUp}
        loading={loading}
        style={styles.button}
      >
        Sign Up
      </Button>
      
      <Link href="/auth/login" asChild>
        <Button 
          mode="text"
          textColor={theme.colors.primary}
        >
          Already have an account? Login
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