import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { translate } from '../translations';
import { supabase } from '../lib/supabase';

const Sidebar = ({ language }) => {
  const navigation = useNavigation();
  const { theme, themeMode } = useTheme();
  const styles = makeStyles(theme, themeMode);

  const [userPhotoUrl, setUserPhotoUrl] = useState(null);

  useEffect(() => {
    async function fetchUserProfile() {
      // Récupère l'utilisateur connecté
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log('Erreur ou pas d’utilisateur connecté:', userError);
        return;
      }

      // Récupère avatar_url depuis profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('auth_id', user.id)  // ici auth_id = uuid de user connecté
        .single();

      if (error) {
        console.log('Erreur récupération avatar_url:', error.message);
      } else if (data?.avatar_url) {
        setUserPhotoUrl(data.avatar_url);
      }
    }

    fetchUserProfile();
  }, []);

  return (
    <View style={styles.sidebarWrapper}>
      <View style={styles.sidebar}>
        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => navigation.navigate('AnnonceDetail')}
        >
          <Image
            source={require('../assets/truck.png')}
            style={styles.sidebarIcon}
          />
          <Text style={styles.sidebarText}>{translate('Annonces', language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => navigation.navigate('Suivi')}
        >
          <Image
            source={require('../assets/fast-delivery.png')}
            style={styles.sidebarIcon}
          />
          <Text style={styles.sidebarText}>{translate('Suivi livraison', language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => navigation.navigate('Messages')}
        >
          <Image
            source={require('../assets/chat.png')}
            style={styles.sidebarIcon}
          />
          <Text style={styles.sidebarText}>{translate('Messages', language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => navigation.navigate('Profile')}
        >
          {userPhotoUrl ? (
            <Image
              source={{ uri: userPhotoUrl }}
              style={styles.sidebarIconProfil}
            />
          ) : (
            <Image
              source={require('../assets/user.png')}
              style={styles.sidebarIconProfil}
            />
          )}
          <Text style={styles.sidebarText}>{translate('Profil', language)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const makeStyles = (theme, themeMode) =>
  StyleSheet.create({
    sidebarWrapper: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: 13,
      borderTopRightRadius: 13,
      borderWidth: 1,
      borderColor: theme.colors.separator,
      overflow: 'hidden',
    },
    sidebar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      backgroundColor: theme.colors.card,
    },
    sidebarItem: {
      alignItems: 'center',
    },
    sidebarIcon: {
      width: 32,
      height: 32,
      tintColor: themeMode === 'dark' ? theme.colors.icon : undefined,
    },
    sidebarIconProfil: {
      width: 38,
      height: 38,
      borderRadius: 19, // rond pour photo profil
    },
    sidebarText: {
      fontSize: 14,
      marginTop: 4,
      color: theme.colors.text,
    },
  });

export default Sidebar;
