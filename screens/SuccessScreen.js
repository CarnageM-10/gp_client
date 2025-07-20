import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SuccessScreen({ navigation }) {

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Félicitations, votre dossier a été validé ! {'\n'}
        Vous avez désormais accès à l’application.
      </Text>
      <Button title="Se déconnecter" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:20 },
  message: { fontSize: 18, marginBottom: 20, textAlign: 'center' }
});
