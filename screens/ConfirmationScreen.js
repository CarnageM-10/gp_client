// ConfirmationScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ConfirmationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>✅ Votre demande de livraison a bien été envoyée, veuillez patienter.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    lineHeight: 28,
  },
});
