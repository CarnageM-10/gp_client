import React, { useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { enableScreens } from 'react-native-screens';
enableScreens();

import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import EmailResetRequestScreen from './screens/EmailResetRequestScreen';
import SearchDeliveryRequestsScreen from './screens/SearchDeliveryRequestsScreen';
import AnnonceDetailScreen from './screens/AnnonceDetailScreen';
import EditAnnonceScreen from './screens/EditAnnonceScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SearchResultsScreen from './screens/SearchResultsScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatDetailScreen from './screens/ChatDetailScreen';
import LivraisonListScreenClient from './screens/LivraisonListScreenClient';
import LivraisonDetailScreenClient from './screens/LivraisonDetailScreenClient';
import PublicTrackingInputScreen from './screens/PublicTrackingInputScreen';
import PublicTrackingResult from './screens/PublicTrackingResult';


import { I18nextProvider, useTranslation } from 'react-i18next';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { supabase } from './lib/supabase';
import FlashMessage from "react-native-flash-message";

const Stack = createNativeStackNavigator();

function SplashScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigation.replace('Login');
      } else {
        navigation.replace('Login');
      }
    };
    checkSession();
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image source={require('./assets/logo.png')} style={styles.logo} />
      <ActivityIndicator size="large" color={theme.colors.text} style={{ marginTop: 20 }} />
      {/* Exemple traduction */}
      <Text style={{ color: theme.colors.text, marginTop: 10 }}>{t('Loading...')}</Text>
    </View>
  );
}

function MainApp() {
  const { theme } = useTheme();

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="EmailResetRequest" component={EmailResetRequestScreen} />
        <Stack.Screen name="SearchDeliveryRequests" component={SearchDeliveryRequestsScreen} />
        <Stack.Screen name="AnnonceDetail" component={AnnonceDetailScreen} />
        <Stack.Screen name="EditAnnonce" component={EditAnnonceScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="SearchResultsScreen" component={SearchResultsScreen} />
        <Stack.Screen name="ConfirmationScreen" component={ConfirmationScreen} />
        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
        <Stack.Screen name="Messages" component={ChatListScreen} />
        <Stack.Screen name="LivraisonList" component={LivraisonListScreenClient} />
        <Stack.Screen name="LivraisonDetail" component={LivraisonDetailScreenClient} />
        <Stack.Screen name="PublicTrackingInput" component={PublicTrackingInputScreen} />
        <Stack.Screen name="PublicTrackingResult" component={PublicTrackingResult} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
          <MainApp />
          <FlashMessage position="top" />
      </ThemeProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 400,
    height: 400,
    resizeMode: 'contain',
  },
});
