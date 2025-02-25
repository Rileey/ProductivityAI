import React from 'react';
import { List } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <>
      <List.Item
        title="Partner Settings"
        description="Manage your accountability partner"
        left={props => <List.Icon {...props} icon="account-multiple" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/settings/partner')}
      />
    </>
  );
} 