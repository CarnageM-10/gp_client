import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, Alert
} from 'react-native';
import { supabase } from '../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { translate } from '../translations';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function CreateAnnonceScreen() {
  const [nomPrenom, setNomPrenom] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [villeDepart, setVilleDepart] = useState('');
  const [villeArrivee, setVilleArrivee] = useState('');
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [colisName, setColisName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDatePickerDepart, setShowDatePickerDepart] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();
  const { language, changeLanguage } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();
  const isDarkMode = themeMode === 'dark';
  const colors = {
    background: isDarkMode ? '#1E1E1E' : '#fff',
    text: isDarkMode ? '#fff' : '#000',
    inputBackground: isDarkMode ? '#333' : '#EFF1F2',
    border: isDarkMode ? '#444' : '#E0DADA',
    cardBackground: isDarkMode ? '#2A2A2A' : '#fff',
  };
  const styles = createStyles(colors);

  useEffect(() => {
    // Récupération du thème/langue utilisateur (inchangé)
    async function fetchSettings() { /* ... */ }
    fetchSettings();
  }, []);

const formatDate = (d) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  return `${y}-${m}-${day}`;
};


  const generateTrackingNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let res = 'GP-';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

const handlePublish = async () => {
  if (
    !nomPrenom.trim() || !colisName.trim() ||
    !dateDepart.trim() || !villeDepart.trim() ||
    !villeArrivee.trim() || !adresseLivraison.trim()
  ) {
    setErrorMessage('⚠ Tous les champs sont obligatoires.');
    return;
  }

  setErrorMessage(null);
  setIsLoading(true);

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setErrorMessage("❌ Utilisateur non connecté.");
      return;
    }

    // ✅ Création d'une seule fois de la demande
    const trackingNumber = generateTrackingNumber();
    const { data: deliveryRequest, error: insertError } = await supabase
      .from('delivery_requests')
      .insert([{
        nom_prenom: nomPrenom.trim(),
        colis_name: colisName.trim(),
        date_depart: dateDepart,
        ville_depart: villeDepart.trim(),
        ville_arrivee: villeArrivee.trim(),
        adresse_livraison: adresseLivraison.trim(),
        client_auth_id: user.id,
        numero_suivi: trackingNumber,
        status: 'en_attente',
      }])
      .select()
      .single();

    if (insertError) {
      setErrorMessage("❌ Erreur lors de la création de la demande.");
      return;
    }

    // 🔍 Recherche des annonces correspondantes
    const departNorm = villeDepart.trim();
    const arriveeNorm = villeArrivee.trim();

    const { data: matchingAnnonces, error: annoncesError } = await supabase
      .from('annonces')
      .select('*')
      .ilike('ville_depart', `%${departNorm}%`)
      .ilike('ville_arrivee', `%${arriveeNorm}%`)
      .eq('date_depart', dateDepart );

    if (annoncesError) {
      setErrorMessage("❌ Erreur lors de la recherche des annonces.");
      return;
    }

    if (!matchingAnnonces || matchingAnnonces.length === 0) {
      Alert.alert(
        translate("Aucune annonce trouvée", language),
        translate("Aucune correspondance n'a été trouvée.", language)
      );
      return;
    }

    // ✅ On passe à l'écran suivant à la fois les annonces et la demande créée
    navigation.navigate('SearchResultsScreen', {
      annonces: matchingAnnonces,
      deliveryRequest, // ← très important ici
    });

  } catch (err) {
    console.error(err);
    setErrorMessage("❌ Une erreur inattendue est survenue.");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Navbar />
      <Image source={require('../assets/gp_image.png')} style={styles.gp_image} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>{translate('Nom & Prénom', language)}</Text>
        <TextInput
          style={styles.lineInput}
          value={nomPrenom}
          onChangeText={setNomPrenom}
          placeholder={translate("Entrer votre nom & prénom", language)}
          placeholderTextColor={colors.text}
        />

        <Text style={styles.label}>{translate('Nom du colis', language)}</Text>
        <TextInput
          style={styles.lineInput}
          value={colisName}
          onChangeText={setColisName}
          placeholder={translate("Entrer le nom du colis", language)}
          placeholderTextColor={colors.text}
        />

        <Text style={styles.label}>{translate('Date de départ', language)}</Text>
        <TouchableOpacity onPress={() => setShowDatePickerDepart(true)}>
          <TextInput
            style={styles.lineInput}
            value={dateDepart}
            editable={false}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.text}
          />
        </TouchableOpacity>
        {showDatePickerDepart && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => {
              setShowDatePickerDepart(false);
              if (e.type === 'set' && d) setDateDepart(formatDate(d));
            }}
          />
        )}

        <Text style={styles.label}>{translate('Adresse de livraison', language)}</Text>
        <TextInput
          style={styles.lineInput}
          value={adresseLivraison}
          onChangeText={setAdresseLivraison}
          placeholder={translate("Adresse de livraison", language)}
          placeholderTextColor={colors.text}
        />

        <View style={styles.rowGroup}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{translate('Ville de départ', language)}</Text>
            <TextInput
              style={styles.lineInput}
              value={villeDepart}
              onChangeText={setVilleDepart}
              placeholder={translate("Ville de départ", language)}
              placeholderTextColor={colors.text}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{translate('Ville d’arrivée', language)}</Text>
            <TextInput
              style={styles.lineInput}
              value={villeArrivee}
              onChangeText={setVilleArrivee}
              placeholder={translate("Ville d’arrivée", language)}
              placeholderTextColor={colors.text}
            />
          </View>
        </View>

        {errorMessage ? (
          <Text style={{ color: 'red', marginVertical: 10 }}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.publishButton}
          disabled={isLoading}
          onPress={handlePublish}
        >
          <Text style={styles.publishText}>
            {isLoading ? translate('Recherche en cours...', language) : translate('Rechercher', language)}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Sidebar language={language} />
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  gp_image: { width: '100%', height: 150, resizeMode: 'contain' },
  label: { color: colors.text, marginTop: 15 },
  lineInput: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    color: colors.text
  },
  rowGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  publishButton: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  publishText: { color: '#fff', fontWeight: 'bold' }
});