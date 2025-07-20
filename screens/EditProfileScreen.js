import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { translate } from '../translations';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';


// ... imports (inchangés)

const EditProfileScreen = () => {
  const { themeMode } = useTheme();
  const isDarkMode = themeMode === 'dark';
  const [language, setLanguage] = useState('fr');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState(null);
  const [newValue, setNewValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDeleteAvatar, setShowConfirmDeleteAvatar] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const navigation = useNavigation();



  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    card: isDarkMode ? '#1E1E1E' : '#F4F4F4',
    border: isDarkMode ? '#333' : '#DDD',
  };

  const confirmDeleteAvatar = () => {
  setShowConfirmDeleteAvatar(false);
  handleDeleteAvatar();
  };

  useEffect(() => {
    const loadData = async () => {
      const dataProfile = await fetchProfileData();
      if (dataProfile) {
        setProfile(dataProfile);
        setLanguage(dataProfile.language || 'fr');
      } else {
        setLanguage('fr');
      }
      setLoading(false);
    };
    loadData();
  }, []);

const fetchProfileData = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.log('Erreur getSession:', error);
    return null;
  }
  if (!data?.session?.user) {
    console.log('Aucun utilisateur connecté');
    return null;
  }
  const user = data.session.user;

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (profileError) {
    console.log('Erreur fetch profile:', profileError);
    return null;
  }

  return profileData;
};

  const handleEdit = (field) => {
    setEditField(field);
    setNewValue(profile[field] || '');
  };

  const handleSaveField = () => {
    setProfile({ ...profile, [editField]: newValue });
    setEditField(null);
    setNewValue('');
  };

    const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const updates = {
        name: profile.name,
        first_name: profile.first_name,
        number: profile.number,
        location: profile.location,
    };

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('auth_id', user.id);

    if (error) {
        console.error('Erreur de mise à jour', error);
        showMessage({
        message: "Erreur lors de la mise à jour",
        description: error.message,
        type: "danger",
        });
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
    mediaType: 'image', // au singulier, string
    quality: 0.7,
  });



  if (!result.canceled) {
    const { data: { user } } = await supabase.auth.getUser();
    const uploadedUrl = await uploadImageToSupabase(result.assets[0].uri, user.id);

    if (uploadedUrl) {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: uploadedUrl })
        .eq('auth_id', user.id);

      if (!error) {
        setProfile(prev => ({ ...prev, avatar_url: uploadedUrl }));
      } else {
        console.error('Erreur de mise à jour avatar_url :', error);
      }
    }
  }
};

const uploadImageToSupabase = async (uri, userId) => {
  try {
    // 1. Lire l'image (URI déjà cropée ou non)
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

    // 2. Base64 -> buffer
    const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    // 3. Liste tous les fichiers dans avatars/{userId}
    const folderPath = `avatars/${userId}`;
    const { data: listData, error: listError } = await supabase.storage
      .from('avatars')
      .list(folderPath);

    if (listError) {
      console.warn('Erreur listage dossier avatars:', listError.message);
    } else {
      // 4. Supprime tous les fichiers existants dans ce dossier
      const filesToDelete = listData.map(file => `${folderPath}/${file.name}`);
      if (filesToDelete.length > 0) {
        const { error: removeError } = await supabase.storage
          .from('avatars')
          .remove(filesToDelete);
        if (removeError) {
          console.warn('Erreur suppression fichiers avatars:', removeError.message);
        }
      }
    }

    // 5. Upload nouvelle image (toujours nommée profile.jpg)
    const fileExt = 'jpg'; // ou détecter selon le format de ton image
    const fileName = `profile.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 6. Récupérer URL publique
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl + `?t=${Date.now()}`;
  } catch (error) {
    console.error("Erreur upload image avec suppression précédente :", error);
    return null;
  }
};

const handleDeleteAvatar = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const folderPath = `avatars/${user.id}`;
  const filePath = `${folderPath}/profile.jpg`;

  // Supprime le fichier avatar
  const { error: deleteError } = await supabase.storage
    .from('avatars')
    .remove([filePath]);

  if (deleteError) {
    console.error('Erreur suppression avatar:', deleteError.message);
    return;
  }

  // Met à jour la base de données pour supprimer le lien avatar_url
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('auth_id', user.id);

  if (updateError) {
    console.error('Erreur mise à jour avatar_url:', updateError.message);
    return;
  }

  // Met à jour le state local
  setProfile(prev => ({ ...prev, avatar_url: null }));
};



if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Navbar />

      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>

          {/* Profil */}
          <View style={styles.profileBlock}>
            <View>
            <Image
            source={profile.avatar_url ? { uri: profile.avatar_url } : require('../assets/user.png')}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
            <Image source={require('../assets/edit.png')} style={styles.editIconImage} />
          </TouchableOpacity>

        </View>

            <View style={{ marginLeft: 20 }}>
              <Text style={[styles.name, { color: colors.text }]}>
                {profile.first_name} {profile.name}
              </Text>
              <Text style={[styles.email, { color: colors.text }]}>{profile.email}</Text>
            </View>
          </View>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={styles.deleteAvatarButton}
              onPress={() => setShowConfirmDeleteAvatar(true)}
              disabled={isDeleting}
            >
              <Image source={require('../assets/delete.png')} style={{ width: 24, height: 24, opacity: isDeleting ? 0.5 : 1 }} />
            </TouchableOpacity>
          </View>


          <View style={styles.separator} />

          {[
            { label: translate('Nom', language), key: 'name' },
            { label: translate('Prenom', language), key: 'first_name' },
            { label: translate('Numero', language), key: 'number' },
            { label: translate('Location', language), key: 'location' },
            { label: 'Email', key: 'email', isEmail: true }
          ].map(({ label, key, isEmail }) => (
            <TouchableOpacity
              key={key}
              style={[styles.fieldRow, { borderColor: colors.border }]}
              onPress={() => isEmail ? setShowEmailModal(true) : handleEdit(key)}
            >
              <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                {profile[key] || '–'}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Image source={require('../assets/delete.png')} style={{ width: 20, height: 20, marginRight: 6 }} />
              <Text style={styles.deleteButtonText}>{translate('Supprimer', language)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>{translate('Enregistrer', language)}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Sidebar language={language} />
      </View>

      {/* Modal */}
      <Modal visible={showEmailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContain, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nouvelle adresse email</Text>
            <TextInput
              placeholder="ex: moi@email.com"
              placeholderTextColor="#888"
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Message d'info */}
            {emailMessage ? (
              <Text style={{ color: emailMessage.startsWith('✅') ? 'green' : 'red', marginVertical: 10 }}>
                {emailMessage}
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const { data: { user }, error: userError } = await supabase.auth.getUser();
                    if (userError || !user) {
                      setEmailMessage("❌ Utilisateur non connecté.");
                      return;
                    }

                    const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
                    if (authError) {
                      setEmailMessage("❌ Erreur Auth : " + authError.message);
                      return;
                    }

                    const { error: profileError } = await supabase
                      .from('profiles')
                      .update({ email: newEmail })
                      .eq('auth_id', user.id);

                    if (profileError) {
                      setEmailMessage("⚠️ Email modifié dans Auth, mais échec dans `profiles` : " + profileError.message);
                    }

                    setEmailMessage("✅ Un email de confirmation a été envoyé à la nouvelle adresse. Veuillez cliquer sur le lien dans cet email pour valider la modification.");

                    setTimeout(async () => {
                      setShowEmailModal(false);
                      await supabase.auth.signOut();
                      navigation.navigate('Login');
                    }, 4000);
                  } catch (e) {
                    console.error("Erreur inattendue :", e);
                    setEmailMessage("❌ Erreur inattendue.");
                  }
                }}
                style={[styles.modalButton, { backgroundColor: '#007AFF',marginRight: 10  }]}
              >
                <Text style={styles.modalButtonText}>{translate('Valider', language)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowEmailModal(false);
                  setEmailMessage('');
                }}
                style={[styles.modalButton, { backgroundColor: '#999' }]}
              >
                <Text style={styles.modalButtonText}>{translate('Annuler', language)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    {emailMessage !== '' && (
      <View style={styles.toastMessage}>
        <Text style={{ color: colors.text }}>{emailMessage}</Text>
      </View>
    )}


      <Modal visible={showConfirmDeleteAvatar} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Voulez-vous supprimer votre photo de profil ?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
              <TouchableOpacity onPress={() => setShowConfirmDeleteAvatar(false)}>
                <Text style={{ color: 'gray', fontSize: 18 }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeleteAvatar}>
                <Text style={{ color: 'red', fontSize: 18 }}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal visible={!!editField} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {translate('Modifier', language)} {translate(editField, language)}
            </Text>

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={newValue}
              onChangeText={setNewValue}
              placeholder={translate(editField, language)}
              placeholderTextColor="#999"
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={handleSaveField} style={[styles.modalButton, { backgroundColor: '#007AFF' }]}>
                <Text style={styles.modalButtonText}>{translate('Enregistrer', language)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setEditField(null)} // ou la fonction qui ferme le modal
                style={[styles.modalButton, { backgroundColor: '#999' }]}
              >
                <Text style={styles.modalButtonText}>{translate('Annuler', language)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  editIconImage: {
    width: 20,
    height: 20,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  separator: {
    height: 1,
    marginVertical: 20,
    backgroundColor: '#ccc',
  },
  infoBlock: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 14,
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // pousse image à gauche, bouton à droite
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  },
  modalContain: {
    width: '85%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalInput: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  toastMessage: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 12,
    backgroundColor: '#444',
    borderRadius: 8,
    alignItems: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '400',
  },


});

export default EditProfileScreen;
