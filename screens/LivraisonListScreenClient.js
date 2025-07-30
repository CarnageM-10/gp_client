import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '../context/LanguageContext';

export default function LivraisonListScreenClient() {
  const navigation = useNavigation();
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const { themeMode } = useTheme();
  const isDarkMode = themeMode === 'dark';

  const colors = {
    background: isDarkMode ? '#1E1E1E' : '#fff',
    text: isDarkMode ? '#fff' : '#000',
    border: isDarkMode ? '#444' : '#E0DADA',
    cardBackground: isDarkMode ? '#2A2A2A' : '#fff',
    badgeGreen: '#4CAF50',
  };

  const styles = createStyles(colors);

  useEffect(() => {
    const fetchLivraisons = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Erreur récupération user:', userError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          delivery_request_id,
          delivery_requests (
            id,
            status,
            numero_suivi,
            annonce_id,
            annonces:annonce_id (
              nom_prenom
            )
          )
        `)
        .eq('client_auth_id', user.id);

      if (error) {
        console.error('Erreur récupération livraisons:', error);
        setLoading(false);
        return;
      }

      // On filtre localement selon le status de delivery_requests
      const filtered = data.filter(
        (item) =>
          item.delivery_requests?.status === 'acceptee' ||
          item.delivery_requests?.status === 'livree'
      );

      setLivraisons(filtered);
      setLoading(false);
    };

    fetchLivraisons();
  }, []);

  if (loading) {
    return <Text style={{ marginTop: 20, textAlign: 'center', color: colors.text }}>Chargement...</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Navbar />
      <View style={styles.container}>
        <FlatList
          data={livraisons}
          keyExtractor={(item) => item.delivery_request_id?.toString()}
          renderItem={({ item }) => {
            const request = item.delivery_requests;
            const nom = request?.annonces?.nom_prenom || 'Nom inconnu';
            const suivi = request?.numero_suivi || 'Non disponible';
            const status = request?.status;

            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => navigation.navigate('LivraisonDetail', {
                  id: request?.id,
                  annonce_id: request?.annonce_id,
                })}
              >
                <Text style={styles.nom}>GP- {nom}</Text>
                <Text style={styles.suivi}>Numéro du colis : {suivi}</Text>

                {status === 'livree' && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>Terminé</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
      <Sidebar language={language} />
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    item: {
      backgroundColor: colors.cardBackground,
      padding: 16,
      marginBottom: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
    },
    nom: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    suivi: {
      fontSize: 14,
      color: colors.text,
      marginTop: 4,
    },
    badgeContainer: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: colors.badgeGreen,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    badgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
  });
