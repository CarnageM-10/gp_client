import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { translate } from '../translations'; 
import { useTheme } from '../context/ThemeContext';

export default function AnnonceDetailScreen({ navigation }) {
  const { themeMode } = useTheme();
  const isDarkMode = themeMode === 'dark';
  
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('fr');
  const [profile, setProfile] = useState(null);
  
  
  // Couleurs dynamiques selon le mode
  const colors = {
    background: isDarkMode ? '#121212' : '#fff',
    cardBackground: isDarkMode ? '#1E293B' : '#4095A4',
    textPrimary: isDarkMode ? '#E0E0E0' : '#fff',
    textSecondary: isDarkMode ? '#B0B0B0' : '#e0f7fa',
    buttonEdit: isDarkMode ? '#3B82F6' : '#007bff',
    buttonDelete: isDarkMode ? '#EF4444' : '#dc3545',
    buttonBackground: isDarkMode ? '#2563EB' : '#4D90FE',
    tintColor: isDarkMode ? '#E0E0E0' : '#333333',
  };

  useEffect(() => {
    const loadData = async () => {
      const dataProfile = await fetchProfileData();
      if (dataProfile) {
        setProfile(dataProfile);
        setLanguage(dataProfile.language || 'fr');
      } else {
        setLanguage('fr');
      }
      await fetchAnnoncesByUser();
      setLoading(false);
    };
    loadData();
  }, []);

const fetchProfileData = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('language, theme')
    .eq('auth_id', user.id)
    .single();

  if (error || !data) return null;

  // Appliquer le thème
  return data;
};


  const fetchAnnoncesByUser = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      Alert.alert(translate('Erreur', language), translate('Utilisateur non connecté.', language));
      return;
    }
    const { data, error } = await supabase
      .from('annonces')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      Alert.alert(translate('Erreur', language), error.message);
    } else {
      setAnnonces(data);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      translate('Confirmation', language),
      translate("Es-tu sûr de vouloir supprimer cette annonce ?", language),
      [
        { text: translate('Annuler', language), style: 'cancel' },
        {
          text: translate('Supprimer', language),
          onPress: async () => {
            const { error } = await supabase.from('annonces').delete().eq('id', id);
            if (error) {
              Alert.alert(translate('Erreur', language), error.message);
            } else {
              setAnnonces(prev => prev.filter(item => item.id !== id));
              Alert.alert(translate('Succès', language), translate("L'annonce a bien été supprimée", language));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.textPrimary} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {annonces.length === 0 ? (
          <Text style={[styles.noAnnonceText, { color: colors.textPrimary }]}>
            {translate('Aucune annonce trouvée.', language)}
          </Text>
        ) : (
          annonces.map((annonce) => (
            <View key={annonce.id} style={[styles.annonceCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.userHeader}>
              <Image
                source={require('../assets/userlogo.png')}
                style={[styles.userLogo, { tintColor: colors.tintColor }]}
              />

                <Text style={[styles.userName, { color: colors.textPrimary }]}>{annonce.nom_prenom}</Text>
              </View>

              <View style={styles.annonceContent}>
                {[
                  'ville_depart', 'ville_arrivee',
                  'date_depart', 'date_arrivee', 'date_limite_depot',
                  'poids_max_kg', 'prix_valeur', 'prix_devise'
                ].map(key => (
                  <View key={key} style={styles.row}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{translate(key.replace(/_/g, ' '), language)} :</Text>
                    <Text style={[styles.value, { color: colors.textPrimary }]}>
                      {translate(annonce[key]?.toString() || '', language)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.buttonEdit }]}
                  onPress={() =>
                    navigation.navigate('EditAnnonce', {
                      annonceId: annonce.id,
                      annonceUserId: annonce.user_id,
                    })
                  }
                >
                  <Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.btnText}>{translate('Modifier', language)}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.buttonDelete }]}
                  onPress={() => handleDelete(annonce.id)}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                  <Text style={styles.btnText}>{translate('Supprimer', language)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Sidebar language={language} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  noAnnonceText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  annonceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  annonceContent: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  value: {
    fontWeight: '400',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
});
