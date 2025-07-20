import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export default function EmailResetRequestScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Merci de renseigner votre e-mail.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://gp-express-function-link.netlify.app/reset-password.html',
    });

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Succès', 'Vérifie ta boîte mail pour continuer.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'), 
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Réinitialiser mon mot de passe</Text>
      <TextInput
        style={styles.input}
        placeholder="Adresse e-mail"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TouchableOpacity onPress={handleResetRequest} style={styles.button}>
        <Text style={styles.buttonText}>
          {loading ? 'Envoi en cours...' : 'Envoyer l’e-mail'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    padding: 10,
    marginBottom: 20,
    color: 'black',
  },
  button: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
