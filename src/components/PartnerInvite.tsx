import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Surface, IconButton } from 'react-native-paper';
import { colors } from '../theme/colors';
import { PartnerService } from '../services/PartnerService';
import { useAuth } from '../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PartnerInvite() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const handleInvite = async () => {
    if (!session?.user.id) return;
    setLoading(true);
    setError(null);

    try {
      await PartnerService.sendInvitation(session.user.id, { recipient_email: email });
      setEmail('');
      // Show success message or trigger a callback
    } catch (err) {
      setError('Failed to send invitation. Please try again.');
      console.error('Invitation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="account-plus" size={24} color={colors.primary} />
        <Text variant="titleMedium" style={styles.title}>Invite Partner</Text>
      </View>
      
      <Text style={styles.description}>
        Invite someone to be your accountability partner. They'll be able to see your tasks and help keep you on track.
      </Text>

      <View style={styles.form}>
        <TextInput
          mode="outlined"
          label="Partner's Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          right={<TextInput.Icon icon="email" />}
        />

        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        <Button
          mode="contained"
          onPress={handleInvite}
          loading={loading}
          disabled={loading || !email}
          style={styles.button}
        >
          Send Invitation
        </Button>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontWeight: '600',
  },
  description: {
    marginBottom: 16,
    color: colors.onSurfaceVariant,
  },
  form: {
    gap: 16,
  },
  button: {
    marginTop: 8,
  },
  error: {
    color: colors.error,
    fontSize: 14,
  },
}); 