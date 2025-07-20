import React, { useState } from 'react';
import {
  View,
  TextInput,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [number, setNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Pour l'œil

  const navigation = useNavigation();

  const validatePassword = (pwd) => {
    // Minimum 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async () => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      alert('Format d’email invalide, il doit contenir un "@" et un "."');
      return;
    }

    if (!validatePassword(cleanPassword)) {
      alert('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          name,
          number,
        },
      },
    });

    if (error) {
      alert('Erreur : ' + error.message);
      return;
    }

    alert('Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte mail.');
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('../assets/register.png')} style={styles.topImage} />

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nom"
            placeholderTextColor="black"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="black"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Numéro"
            placeholderTextColor="black"
            keyboardType="phone-pad"
            value={number}
            onChangeText={setNumber}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Mot de passe"
              placeholderTextColor="black"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Image
                source={
                  showPassword
                    ? require('../assets/eye-off.png')
                    : require('../assets/eye.png')
                }
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSubmit} style={{ marginTop: 10, alignSelf: 'flex-end' }}>
            <View style={styles.logoGroup}>
              <Text style={styles.logoText}>Register</Text>
              <Image source={require('../assets/contracter.png')} style={styles.logo} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.registerButton}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
  },
  topImage: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
    marginBottom: 30,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    color: 'black',
    fontSize: 16,
    marginBottom: 25,
    paddingVertical: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    width: 24,
    height: 24,
    tintColor: 'black',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    alignItems: 'flex-end',
  },
  registerButton: {
    fontSize: 16,
    color: 'black',
    textDecorationLine: 'underline',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginRight: 10,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
});
