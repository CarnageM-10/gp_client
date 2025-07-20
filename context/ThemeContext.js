import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const lightTheme = {
  dark: false,
  colors: {
    card: '#fff',
    separator: '#ccc',
    icon: '#000',    // couleur icône light
    text: '#000',
    background: '#f5f5f5',
    primary: '#1e90ff',
    border: '#ccc',
    notification: '#1e90ff',
    danger: '#e74c3c',
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
  },
};

export const darkTheme = {
  dark: true,
  colors: {
    card: '#121212',
    separator: '#444',
    icon: '#bbbbbb',    // couleur icône dark
    text: '#eee',
    background: '#000',
    primary: '#1e90ff',
    border: '#444',
    notification: '#1e90ff',
    danger: '#ff4d4d', 
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
  },
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  const changeTheme = async (mode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem('themeMode', mode);
  };

  useEffect(() => {
    (async () => {
      const savedMode = await AsyncStorage.getItem('themeMode');
      if (savedMode) setThemeMode(savedMode);
      setIsLoading(false);
    })();
  }, []);

  const value = {
    theme: themeMode === 'light' ? lightTheme : darkTheme,
    themeMode,
    changeTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      { children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
