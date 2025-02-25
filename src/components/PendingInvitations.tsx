import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, Button, ActivityIndicator } from 'react-native-paper';
import { colors } from '../theme/colors';
import { PartnerService } from '../services/PartnerService';
import { useAuth } from '../contexts/AuthContext';
import type { PartnerInvitationWithDetails } from '../types/partner';

export default function PendingInvitations() {
  const [invitations, setInvitations] = useState<PartnerInvitationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    if (!session?.user.id) return;
    try {
      const data = await PartnerService.getInvitations(session.user.id);
      setInvitations(data);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (invitationId: string, status: 'accepted' | 'declined') => {
    try {
      await PartnerService.respondToInvitation(invitationId, status);
      await loadInvitations(); // Refresh the list
    } catch (error) {
      console.error('Error responding to invitation:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Surface style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>Pending Invitations</Text>
      
      {invitations.map(invitation => (
        <View key={invitation.id} style={styles.invitationItem}>
          <View style={styles.invitationContent}>
            <Text style={styles.email}>
              {invitation.sender?.email || invitation.recipient_email}
            </Text>
            <Text style={styles.status}>{invitation.status}</Text>
          </View>
          
          {invitation.status === 'pending' && (
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={() => handleResponse(invitation.id, 'accepted')}
                style={styles.actionButton}
              >
                Accept
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleResponse(invitation.id, 'declined')}
                style={[styles.actionButton, styles.declineButton]}
              >
                Decline
              </Button>
            </View>
          )}
        </View>
      ))}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  title: {
    marginBottom: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  invitationItem: {
    marginBottom: 16,
  },
  invitationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: colors.onSurface,
  },
  status: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  declineButton: {
    borderColor: colors.error,
  },
}); 