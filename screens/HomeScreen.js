import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        Alert.alert('Erreur', 'Session non trouvée ou utilisateur non connecté.');
        navigation.navigate('Login');
        return;
      }

      const user = session.user;

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('name, email, number')
        .eq('auth_id', user.id)  // <-- Utilise auth_id ici (UUID)
        .single();

      if (profileError) {
        Alert.alert('Erreur', profileError.message);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [navigation]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      navigation.replace('Login');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Confirmation',
      'Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const {
                data: { session },
                error: sessionError,
              } = await supabase.auth.getSession();

              if (sessionError || !session?.user) {
                Alert.alert('Erreur', 'Utilisateur non connecté.');
                return;
              }

              const userId = session.user.id;

              // Appel à la fonction Edge pour suppression
              const { error: deleteError } = await supabase.functions.invoke('delete-user', {
                body: { user_id: userId },
              });

              if (deleteError) {
                Alert.alert('Erreur', deleteError.message);
              } else {
                Alert.alert('✅ Succès', 'Ton compte a été supprimé.');
                navigation.navigate('Login');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur inconnue', 'Une erreur est survenue.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Profil introuvable</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Nom :</Text>
        <Text style={styles.value}>{profile.name || 'Non renseigné'}</Text>

        <Text style={styles.label}>Email :</Text>
        <Text style={styles.value}>{profile.email}</Text>

        <Text style={styles.label}>Numéro :</Text>
        <Text style={styles.value}>{profile.number || 'Non renseigné'}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.logoutText}>🗑️ Supprimer mon compte</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    width: '90%',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '90%',
  },
  deleteButton: {
    backgroundColor: '#e53935',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '90%',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
});
