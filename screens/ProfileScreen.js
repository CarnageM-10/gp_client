import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Switch,
  Pressable,
  ScrollView,
  Modal,
  Dimensions
} from 'react-native';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { translate } from '../translations'; 

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState({});
  const [language, setLanguage] = useState('fr');
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const { theme, changeTheme } = useTheme();

  // Génération dynamique des styles en fonction du thème
  const styles = makeStyles(theme);

  useEffect(() => {
  const loadProfile = async () => {
    const data = await fetchProfileData();
    if (data) {
      if (data.avatar_url && !data.avatar_url.startsWith('http')) {
        const url = await getAvatarUrl(data.avatar_url);
        setProfile({ ...data, avatar_url: url });
      } else {
        setProfile(data);
      }
      setLanguage(data.language || 'fr');
    }
  };
  loadProfile();
}, []);


  const toggleNotifications = async () => {
    const updated = { ...profile, notifications_enabled: !profile.notifications_enabled };
    setProfile(updated);
    await updateProfileData({ notifications_enabled: updated.notifications_enabled });
  };

  const toggleMessages = async (value) => {
    const updated = { ...profile, messages_enabled: value };
    setProfile(updated);
    await updateProfileData({ messages_enabled: value });
  };

  const changeThemeInProfile = async (value) => {
    const updated = { ...profile, theme: value };
    setProfile(updated);
    await updateProfileData({ theme: value });
  };

  const changeLanguage = async (value) => {
    setLanguage(value);
    const updated = { ...profile, language: value };
    setProfile(updated);
    await updateProfileData({ language: value });
  };

  const fetchProfileData = async () => {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError) {
      console.error('Erreur fetch profile:', profileError.message);
      return null;
    }

    return profile;
  };

  const updateProfileData = async (updates) => {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('auth_id', user.id);

    if (updateError) {
      console.error('Erreur update profile:', updateError.message);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erreur lors de la déconnexion:', error.message);
    } else {
      navigation.replace('Login');
    }
  };
    const getAvatarUrl = async (path) => {
    if (!path) return null;
    const { data, error } = await supabase.storage
      .from('your-bucket-name')
      .getPublicUrl(path);
    if (error) {
      console.error('Erreur getPublicUrl:', error.message);
      return null;
    }
    return data.publicUrl;
  };


return (
  <View style={styles.screen}>
    <Navbar />

    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Profil */}
        <View style={styles.topBlock}>
        {profile.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : (
          <Image
            source={require('../assets/user.png')}
            style={styles.profileImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.infoBlock}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
        </View>
      </View>


        <View style={styles.separator} />

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('EditProfile')}>
          <Image source={require('../assets/people.png')} style={styles.icon} />
          <Text style={styles.label}>{translate('Mon profil', language)}</Text>
          <Image source={require('../assets/chevron.png')} style={styles.chevron} />
        </TouchableOpacity>

        <View style={styles.row}>
          <Image source={require('../assets/chat.png')} style={styles.icon} />
          <Text style={styles.label}>{translate('Notifications', language)}</Text>
          <Switch value={profile.notifications_enabled} onValueChange={toggleNotifications} />
        </View>

        {/* Messages */}
        <View style={styles.row}>
          <Image source={require('../assets/notif.png')} style={styles.icon} />
          <Text style={styles.label}>{translate('Messages', language)}</Text>
          <TouchableOpacity onPress={() => setShowMessageOptions(true)}>
            <Text style={styles.toggleText}>
              {profile.messages_enabled ? translate('Activé', language) : translate('Désactivé', language)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal Messages */}
        <Modal
          visible={showMessageOptions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMessageOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{translate('Gérer les messages', language)}</Text>
              <Pressable onPress={() => { toggleMessages(true); setShowMessageOptions(false); }}>
                <Text style={styles.modalOption}>{translate('Activer', language)}</Text>
              </Pressable>
              <Pressable onPress={() => { toggleMessages(false); setShowMessageOptions(false); }}>
                <Text style={styles.modalOption}>{translate('Désactiver', language)}</Text>
              </Pressable>
              <Pressable onPress={() => setShowMessageOptions(false)}>
                <Text style={styles.modalCancel}>{translate('Annuler', language)}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Thème */}
        <View style={styles.row}>
          <Image source={require('../assets/theme.png')} style={styles.icon} />
          <Text style={styles.label}>{translate('Thème', language)}</Text>
          <TouchableOpacity onPress={() => setShowThemeOptions(true)}>
            <Image source={require('../assets/down-arrow.png')} style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* Modal Thème */}
        <Modal
          visible={showThemeOptions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowThemeOptions(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{translate('Choisir le thème', language)}</Text>
              <Pressable
                onPress={() => {
                  changeTheme('light');
                  changeThemeInProfile('light');
                  setShowThemeOptions(false);
                }}
              >
                <Text style={[styles.modalOption, theme === 'light' && { fontWeight: 'bold', color: '#007AFF' }]}>
                  {translate('Light', language)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  changeTheme('dark');
                  changeThemeInProfile('dark');
                  setShowThemeOptions(false);
                }}
              >
                <Text style={[styles.modalOption, theme === 'dark' && { fontWeight: 'bold', color: '#007AFF' }]}>
                  {translate('Dark', language)}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Langue */}
        <View style={styles.row}>
          <Image source={require('../assets/langue.png')} style={styles.icon} />
          <Text style={styles.label}>
            {translate('Langue', language)} ({profile.language === 'fr' ? 'FR' : 'EN'})
          </Text>
          <TouchableOpacity onPress={() => setShowLanguageOptions(true)}>
            <Image source={require('../assets/down-arrow.png')} style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* Modal Langue */}
        <Modal
          visible={showLanguageOptions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLanguageOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{translate('Choisir la langue', language)}</Text>
              <Pressable onPress={() => { changeLanguage('fr'); setShowLanguageOptions(false); }}>
                <Text style={styles.modalOption}>🇫🇷 {translate('Français', language)}</Text>
              </Pressable>
              <Pressable onPress={() => { changeLanguage('en'); setShowLanguageOptions(false); }}>
                <Text style={styles.modalOption}>🇬🇧 {translate('English', language)}</Text>
              </Pressable>
              <Pressable onPress={() => setShowLanguageOptions(false)}>
                <Text style={styles.modalCancel}>{translate('Annuler', language)}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

      </View>

      {/* Support & Déconnexion */}
      <View style={styles.container}>
        <View style={styles.downBlock}>
          <TouchableOpacity style={styles.row}>
            <Image source={require('../assets/support.png')} style={styles.icon} />
            <Text style={styles.label}>{translate('Support & Information', language)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.row}>
          <Image source={require('../assets/sup_client.png')} style={styles.icon} />
          <Text style={styles.label}>{translate("Centre d'aide", language)}</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Image source={require('../assets/compliant.png')} style={styles.icon} />
          <Text style={styles.label}>{translate('Mentions Légales', language)}</Text>
        </View>

        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <Image source={require('../assets/out.png')} style={styles.icon} />
          <Text style={styles.label}>{translate('Déconnexion', language)}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

    <View style={styles.sidebarContainer}>
      <Sidebar language={language} />
    </View>
  </View>
);

};

const { height } = Dimensions.get('window');

const makeStyles = (theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  scrollContainer: {
    paddingBottom: 0,
  },
  container: {
    backgroundColor: theme.colors.card,
    margin: 10,
    padding: 17,
    borderRadius: 7,
    elevation: 3,
  },
  downBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  infoBlock: {
    marginLeft: 15,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.colors.text,  // texte principal bien visible
  },
  email: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.colors.text,  // texte principal
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.separator,  // noir très léger pour séparateur
    marginVertical: 15,
    width: '110%',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: theme.colors.icon,  // icône très légère noir clair
  },
  label: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.text,  // texte principal
  },
  chevron: {
    width: 16,
    height: 16,
    tintColor: theme.colors.icon,  // icône très légère
  },
  toggleText: {
    color: theme.colors.primary,
  },
  sidebarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 20,
    width: 280,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 15,
    color: theme.colors.text,
  },
  modalOption: {
    fontSize: 16,
    paddingVertical: 10,
    width: '100%',
    textAlign: 'center',
    color: theme.colors.text,
  },
  modalCancel: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});

export default ProfileScreen;
