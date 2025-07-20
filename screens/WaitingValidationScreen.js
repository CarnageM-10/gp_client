import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export default function WaitingValidationScreen({ navigation }) {

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login'); // ou l’écran de login dans ta navigation
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
      Nous vous remercions pour l’envoi de vos documents.{'\n'}
      Notre équipe procédera à leur vérification dans les prochaines 24 heures.{'\n'}
      Nous vous invitons à revenir consulter le statut de votre dossier ultérieurement.{'\n'}
      {'\n'}
      Cordialement,{'\n'}
      L'équipe GP Express
    </Text>


      <Button title="Se déconnecter" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1, justifyContent:'center', alignItems:'center', padding:20
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  }
});
