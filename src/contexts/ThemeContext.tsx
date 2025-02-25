import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof MD3LightTheme;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: MD3LightTheme,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const { session } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    if (session?.user.id) {
      loadUserThemePreference();
    }
  }, [session]);

  const loadUserThemePreference = async () => {
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('dark_mode')
        .single();
      
      if (data) {
        setIsDarkMode(data.dark_mode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (darkMode: boolean) => {
    if (!session?.user.id) return;

    try {
      await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: session.user.id,
          dark_mode: darkMode 
        });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    saveThemePreference(!isDarkMode);
  };

  const theme = isDarkMode ? MD3DarkTheme : MD3LightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext); 