import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Switch, Button, Divider, useTheme as usePaperTheme } from 'react-native-paper';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function Settings() {
  const { signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();

  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item
          title="Dark Mode"
          right={props => <Switch value={isDarkMode} onValueChange={toggleTheme} />}
        />
        <Divider />
        <List.Subheader>Notifications</List.Subheader>
        <List.Item
          title="Task Reminders"
          right={props => <Switch value={true} onValueChange={() => {}} />}
        />
        <List.Item
          title="Due Date Alerts"
          right={props => <Switch value={true} onValueChange={() => {}} />}
        />
      </List.Section>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained-tonal" 
          onPress={signOut}
          style={styles.button}
        >
          Sign Out
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
  },
  button: {
    borderRadius: 8,
  },
}); 