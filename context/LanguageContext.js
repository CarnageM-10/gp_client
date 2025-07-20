// context/LanguageContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr');
  const [isLoading, setIsLoading] = useState(true);

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    await AsyncStorage.setItem('appLanguage', lang);
  };

  useEffect(() => {
    (async () => {
      const savedLang = await AsyncStorage.getItem('appLanguage');
      if (savedLang) setLanguage(savedLang);
      setIsLoading(false);
    })();
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isLoading }}>
      {!isLoading && children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
