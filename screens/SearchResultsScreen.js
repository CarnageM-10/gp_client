import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function SearchResultsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { annonces, deliveryRequest } = route.params; // correction ici
  const { language } = useLanguage();
  const { themeMode } = useTheme();

  const isDarkMode = themeMode === 'dark';
  const colors = {
    background: isDarkMode ? '#1E1E1E' : '#fff',
    text: isDarkMode ? '#fff' : '#000',
    cardBackground: isDarkMode ? '#2A2A2A' : '#f0f0f0',
    contactButton: '#007AFF',
  };

const handleContact = async (annonce) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté.');
      return;
    }

    // Étape 1 : Mettre à jour deliveryRequest avec annonce_id
    const { error: updateError } = await supabase
      .from('delivery_requests')
      .update({ annonce_id: annonce.id })
      .eq('id', deliveryRequest.id);

    if (updateError) {
      console.error('Erreur lors de la mise à jour de deliveryRequest :', updateError.message);
      Alert.alert('Erreur', 'Impossible de lier la demande à l’annonce.');
      return;
    }

    // Étape 2 : Vérifie si un chat existe déjà avec ce GP, ce client et cette demande
    const { data: existingChat, error: chatCheckError } = await supabase
      .from('chats')
      .select('id')
      .eq('client_auth_id', user.id)
      .eq('gp_auth_id', annonce.user_id)
      .eq('delivery_request_id', deliveryRequest.id)
      .single();

    if (chatCheckError && chatCheckError.code !== 'PGRST116') {
      console.error('Erreur vérification chat existant :', chatCheckError.message);
      Alert.alert('Erreur', "Impossible de vérifier les discussions existantes.");
      return;
    }

    if (existingChat) {
      Alert.alert('Info', 'Une demande est déjà en attente.');
      return;
    }

    // Étape 3 : Création du chat
    const { error: chatError } = await supabase
      .from('chats')
      .insert([{
        client_auth_id: user.id,
        gp_auth_id: annonce.user_id,
        delivery_request_id: deliveryRequest.id,
        status: 'en_attente',
      }]);

    if (chatError) {
      console.error('Erreur création chat :', chatError.message);
      Alert.alert('Erreur', 'Impossible de contacter ce GP.');
      return;
    }

    Alert.alert('Demande envoyée', 'Le GP a reçu votre demande.');
    navigation.navigate('ConfirmationScreen');

  } catch (err) {
    console.error('Erreur inattendue :', err);
    Alert.alert('Erreur', 'Une erreur est survenue.');
  }
};

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.title, { color: colors.text }]}>{item.nom_prenom}</Text>
      <Text style={{ color: colors.text }}>
        Départ : {item.ville_depart} ({item.date_depart})
      </Text>
      <Text style={{ color: colors.text }}>
        Arrivée : {item.ville_arrivee} ({item.date_arrivee})
      </Text>

      <TouchableOpacity
        style={[styles.contactBtn, { backgroundColor: colors.contactButton }]}
        onPress={() => handleContact(item)}
      >
        <Text style={styles.contactText}>Contacter</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Navbar />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.header, { color: colors.text }]}>Résultats de la recherche</Text>
        <FlatList
          data={annonces}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      </View>
      <Sidebar language={language} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactBtn: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  contactText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
