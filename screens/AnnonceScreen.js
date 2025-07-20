import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons'; 
import { useNavigation } from '@react-navigation/native';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { translate } from '../translations'; 
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function CreateAnnonceScreen() {
  const [nomPrenom, setNomPrenom] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [dateArrivee, setDateArrivee] = useState('');
  const [villeDepart, setVilleDepart] = useState('');
  const [villeArrivee, setVilleArrivee] = useState('');
  const [dateLimiteDepot, setDateLimiteDepot] = useState('');
  const [adressePays, setAdressePays] = useState('');
  const [adresseVille, setAdresseVille] = useState('');
  const [adresseRue, setAdresseRue] = useState('');
  const [poids, setPoids] = useState('');
  const [price, setPrice] = useState('');
  const [selectedDevise, setSelectedDevise] = useState('CFA');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDatePickerLimite, setShowDatePickerLimite] = useState(false);
  const [showDatePickerDepart, setShowDatePickerDepart] = useState(false);
  const [showDatePickerArrivee, setShowDatePickerArrivee] = useState(false); 
  const navigation = useNavigation();
  const { language, changeLanguage  } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const { themeMode, setThemeMode } = useTheme();
  const isDarkMode = themeMode === 'dark';  
  const colors = {
  background: isDarkMode ? '#1E1E1E' : '#fff',
  text: isDarkMode ? '#fff' : '#000',
  border: isDarkMode ? '#444' : '#E0DADA',
  inputBackground: isDarkMode ? '#333' : '#EFF1F2',
  cardBackground: isDarkMode ? '#2A2A2A' : '#fff',
  subtleText: isDarkMode ? '#999' : '#C7CECF',
  };
  const styles = createStyles(colors);

useEffect(() => {
  async function fetchUserSettings(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('language, theme')
      .eq('auth_id', userId)
      .single();

    if (error) {
      console.log('Erreur récupération profil:', error.message);
    }

    if (data) {
      console.log('Theme récupéré:', data.theme);
      if (data.language) {
        changeLanguage(data.language);
      }
      if (data.theme) {
        setThemeMode(data.theme.toLowerCase()); // forcer en minuscules
      }
    }
    setIsLoading(false);
  }

  async function getUserAndLang() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchUserSettings(user.id);
    } else {
      setIsLoading(false);
    }
  }

  getUserAndLang();
}, []);

  const formatDate = (date) => {
    const d = new Date(date);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const year = `${d.getFullYear()}`.slice(-4);
    return `${day}/${month}/${year}`;
  };
  const conversionRates = {
    'CFA': 1,               // Franc CFA (XOF)
    'EUR': 1 / 655.957,      // Euro
    'USD': 1 / 600,          // Dollar américain (approx.)
    'GBP': 1 / 770,          // Livre sterling (approx.)
    'CAD': 1 / 450,          // Dollar canadien (approx.)
    'NGN': 1 / 1.3,          // Naira nigérian (approx.)
    'MAD': 1 / 66,           // Dirham marocain (approx.)
    'DZD': 1 / 45,           // Dinar algérien (approx.)
    'CNY': 1 / 85,           // Yuan chinois (approx.)
  };

  const convertAmount = (amount, fromDevise, toDevise) => {
    if (!conversionRates[fromDevise] || !conversionRates[toDevise]) return amount;
    const amountInFCFA = parseFloat(amount) / conversionRates[fromDevise];
    return amountInFCFA * conversionRates[toDevise];
  };



const handlePublish = async () => {
  if (
    !nomPrenom.trim() ||
    !dateDepart.trim() ||
    !dateArrivee.trim() ||
    !villeDepart.trim() ||
    !villeArrivee.trim() ||
    !dateLimiteDepot.trim() ||
    !adressePays.trim() ||
    !adresseVille.trim() ||
    !adresseRue.trim() ||
    !poids.trim() ||
    !price.trim()
  ) {
    setErrorMessage('⚠️ Tous les champs sont obligatoires.');
    return;
  }

  // Authentification
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    Alert.alert('Erreur', 'Utilisateur non authentifié');
    return;
  }

  // Insertion dans Supabase
  const { error } = await supabase.from('annonces').insert({
    user_id: user.id,
    nom_prenom: nomPrenom,
    date_depart: dateDepart,
    date_arrivee: dateArrivee,
    ville_depart: villeDepart,
    ville_arrivee: villeArrivee,
    date_limite_depot: dateLimiteDepot,
    adresse_pays: adressePays,
    adresse_ville: adresseVille,
    adresse_rue: adresseRue,
    poids_max_kg: poids,
    prix_valeur: isNaN(parseFloat(price)) ? 0 : parseFloat(price),
    prix_devise: selectedDevise,
  });

  if (error) {
    Alert.alert('Erreur', error.message);
  } else {
    setErrorMessage(''); 
    Alert.alert('Succès', 'Annonce publiée avec succès !');
    setNomPrenom('');
    setDateDepart('');
    setDateArrivee('');
    setVilleDepart('');
    setVilleArrivee('');
    setDateLimiteDepot('');
    setAdressePays('');
    setAdresseVille('');
    setAdresseRue('');
    setPoids('');
    setPrice('');
    setSelectedDevise('CFA');

  }
};

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Navbar />
       <Image source={require('../assets/gp_image.png')} style={styles.gp_image} />

    <View style={styles.headerWrapper}>
      <Text style={styles.title}>{translate('Créer une annonce', language)}</Text>
      <View style={styles.titleUnderline} />
    </View>

  <ScrollView contentContainerStyle={styles.container}>
    {/* Ton formulaire */}
    <View style={[styles.formWrapper, { width: '100%' }]}>
      
      <Text style={styles.label}>{translate('Nom & Prénom', language)}</Text>
      <TextInput
        placeholder={translate("Entrer votre nom & prénom", language)}
        placeholderTextColor={isDarkMode ? '#BBB' : '#C7CECF'}
        style={styles.lineInput}
        value={nomPrenom}
        onChangeText={setNomPrenom}
      />

      <View style={styles.rowGroup}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{translate('Date de départ', language)}</Text>
          <TouchableOpacity onPress={() => setShowDatePickerDepart(true)}>
            <TextInput
              placeholder={translate("JJ/MM/AA", language)}
              placeholderTextColor={isDarkMode ? '#BBB' : '#C7CECF'}
              style={styles.boxInput}
              value={dateDepart}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showDatePickerDepart && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePickerDepart(false);
                if (selectedDate) {
                  setDateDepart(formatDate(selectedDate));
                }
              }}
            />
          )}
        </View>

        <Text style={styles.separatordate}>/</Text>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{translate("Date d'arrivée", language)}</Text>
          <TouchableOpacity onPress={() => setShowDatePickerArrivee(true)}>
            <TextInput
              placeholder={translate("JJ/MM/AA", language)}
              placeholderTextColor={isDarkMode ? '#BBB' : '#C7CECF'}
              style={styles.boxInput}
              value={dateArrivee}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showDatePickerArrivee && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePickerArrivee(false);
                if (selectedDate) {
                  setDateArrivee(formatDate(selectedDate));
                }
              }}
            />
          )}
        </View>
      </View>

      <View style={styles.rowGrouptext}>
        <Text style={styles.label}>{translate('Ville de départ', language)}</Text>
        <Text style={styles.label}>{translate("Ville d'arrivée", language)}</Text>
      </View>

      <View style={styles.rowGroup}>
        <TextInput
          placeholder={translate("Ville de départ", language)}
          placeholderTextColor={isDarkMode ? '#BBB' : '#C7CECF'}
          style={styles.lineInput}
          value={villeDepart}
          onChangeText={setVilleDepart}
        />
        <Text style={styles.separator}>/</Text>
        <TextInput
          placeholder={translate("Ville d'arrivée", language)}
          placeholderTextColor={isDarkMode ? '#BBB' : '#C7CECF'}
          style={styles.lineInput}
          value={villeArrivee}
          onChangeText={setVilleArrivee}
        />
      </View>

      <Text style={styles.label}>{translate('Date limite de dépôt', language)}</Text>
      <TouchableOpacity onPress={() => setShowDatePickerLimite(true)}>
        <TextInput
          placeholder={translate("JJ/MM/AA", language)}
          placeholderTextColor={isDarkMode ? '#BBB' : '#C7CECF'}
          style={styles.boxInput}
          value={dateLimiteDepot}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
      {showDatePickerLimite && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePickerLimite(false);
            if (selectedDate) {
              setDateLimiteDepot(formatDate(selectedDate));
            }
          }}
        />
      )}

      <Text style={styles.label}>{translate('Adresse', language)}</Text>
      <View style={styles.rowGroup}>
        <TextInput
          placeholder={translate("Pays", language)}
          placeholderTextColor="#E0DADA"
          style={styles.addressInput}
          value={adressePays}
          onChangeText={setAdressePays}
        />
        <TextInput
          placeholder={translate("Ville", language)}
          placeholderTextColor="#E0DADA"
          style={styles.addressInput}
          value={adresseVille}
          onChangeText={setAdresseVille}
        />
        <TextInput
          placeholder={translate("Rue", language)}
          placeholderTextColor="#E0DADA"
          style={styles.addressInput}
          value={adresseRue}
          onChangeText={setAdresseRue}
        />
      </View>

      <Text style={styles.label}>{translate('Poids & Prix', language)}</Text>
      <View style={styles.rowGroup}>
        <TextInput
          placeholder="0 - 100kg"
          placeholderTextColor="#E0DADA"
          style={styles.roundInputkg}
          value={poids}
          onChangeText={setPoids}
        />
        <Text style={styles.separator}>/</Text>
        <TextInput
          placeholder={translate("Prix", language)}
          placeholderTextColor={isDarkMode ? '#BBB' : '#C7CECF'}
          value={price !== '' && !isNaN(parseFloat(price)) ? parseFloat(price).toFixed(2) : ''}
          onChangeText={(text) => setPrice(text)}
          keyboardType="numeric"
          style={[styles.input, { flex: 1 }]}
        />


          <View style={styles.devise}>
            <Text style={styles.deviseText}>{selectedDevise}</Text>

            <Picker
              selectedValue={selectedDevise}
              onValueChange={(itemValue) => {
                const converted = convertAmount(price, selectedDevise, itemValue);
                setSelectedDevise(itemValue);
                setPrice(converted.toString());
              }}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#000"
            >
              {Object.keys(conversionRates).map((dev) => (
                <Picker.Item label={dev} value={dev} key={dev} />
              ))}
            </Picker>
          </View>
        
      </View>

      <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
        <Text style={styles.publishText}>{translate('Publier', language)}</Text>
      </TouchableOpacity>

    </View>
  </ScrollView>


      {/* BARRE DE NAVIGATION BAS */}
      <Sidebar language={language} />
    </View>
  );
}


const createStyles = (colors) => StyleSheet.create({
  formWrapper: {
    backgroundColor: colors.background,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  container: {
    paddingBottom: 90,
    paddingHorizontal: 0,
  },
  titleUnderline: {
    height: 4,
    backgroundColor: '#520056',
    width: '120%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  headerWrapper: {
    width: '100%',
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingBottom: 6,
    paddingTop: 18,
    borderBottomWidth: 0,
    position: 'relative',
    zIndex: 10,
    marginTop: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  label: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  lineInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.text,
  },
  boxInput: {
    backgroundColor: colors.inputBackground,
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
    flex: 1,
  },
  rowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  rowGrouptext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 100,
    marginTop: 10,
  },
  separator: {
    marginHorizontal: 6,
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.subtleText,
  },
  separatordate: {
    marginHorizontal: 9,
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.subtleText,
    marginTop: 45,
  },
  addressInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    marginTop: 5,
    backgroundColor: colors.cardBackground,
    color: colors.text,
  },
  roundInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 10,
    marginTop: 5,
    backgroundColor: colors.cardBackground,
    color: colors.text,
  },
  roundInputkg: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 100,
    padding: 10,
    marginTop: 5,
    backgroundColor: colors.cardBackground,
    color: colors.text,
  },
  publishButton: {
    backgroundColor: '#4095A4',
    paddingVertical: 12,
    paddingHorizontal: 70,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 30,
    alignSelf: 'center',
  },
  publishText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 5,
    backgroundColor: colors.cardBackground,
    fontSize: 14,
    color: colors.text,
  },
  devise: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    backgroundColor: colors.cardBackground,
    width: 120,
  },
  deviseText: {
    fontSize: 10,
    color: colors.text,
    flex: 1,
  },
  picker: {
    height: 40,
    width: 70,
  },
  pickerItem: {
    fontSize: 14,
    color: colors.text,
  },
  gp_image: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    width: '100%',
    height: 230,
    resizeMode: 'cover',
  },
});
