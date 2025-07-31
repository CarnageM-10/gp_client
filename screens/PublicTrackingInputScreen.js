import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Invitebar from '../components/Invitebar';

export default function PublicTrackingInputScreen() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const navigation = useNavigation();

  const handleSubmit = () => {
    const trimmedNumber = trackingNumber.trim(); // suppression des espaces

    if (!trimmedNumber) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de suivi.');
      return;
    }

    navigation.navigate('PublicTrackingResult', { trackingNumber: trimmedNumber });
  };

  return (
    <View style={{ flex: 1 }}>
      <Invitebar />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.box}>
          <Text style={styles.icon}>📦</Text>
          <Text style={styles.title}>Suivre un colis</Text>

          <TextInput
            style={styles.input}
            placeholder="Numéro de suivi"
            placeholderTextColor="#888"
            value={trackingNumber}
            onChangeText={setTrackingNumber}
          />

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>🔍 Suivre</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 20,
  },
  box: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
