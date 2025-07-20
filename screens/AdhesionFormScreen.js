import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { WebView } from 'react-native-webview'; 
import { supabase } from '../lib/supabase';
import { Buffer } from 'buffer';
import * as Print from 'expo-print';
import { useNavigation } from '@react-navigation/native';


export default function AdhesionFormScreen() {
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [passportFiles, setPassportFiles] = useState([]);
  const [housingFiles, setHousingFiles] = useState([]);
  const [statusFiles, setStatusFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const navigation = useNavigation();

  const FULL_CONTRACT_TEXT = `
    Ce contrat lie l'utilisateur à GP Express pour une mission de transport ou de livraison. 
    En signant ce contrat, le signataire accepte les conditions générales d'utilisation, 
    les engagements de bonne conduite et l'autorisation de transmettre ses pièces justificatives 
    à des fins de validation d'identité. 

    1. Engagement de confidentialité
    2. Véracité des documents fournis
    3. Responsabilité en cas de perte ou de dégradation des biens
    4. Durée de validité : 12 mois
    5. Résiliation et conditions

    Merci de lire attentivement avant de signer.

    Vous avez signé ce document.
  `;

  const pickDocument = async (type) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      const fileData = {
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType,
      };

      if (type === 'passport') setPassportFiles(prev => [...prev, fileData]);
      if (type === 'housing') setHousingFiles(prev => [...prev, fileData]);
      if (type === 'status') setStatusFiles(prev => [...prev, fileData]);
    }
  };

  const openPreview = (file) => {
    setPreviewFile(file);
    setPreviewModalVisible(true);
  };

  const closePreview = () => {
    setPreviewModalVisible(false);
    setPreviewFile(null);
  };

  const handleDelete = (type, index) => {
    if (type === 'passport') setPassportFiles(prev => prev.filter((_, i) => i !== index));
    if (type === 'housing') setHousingFiles(prev => prev.filter((_, i) => i !== index));
    if (type === 'status') setStatusFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSign = () => {
    setHasSigned(true);
    setPrivacyModalVisible(false);
  };

  const renderFileItem = (files, type) => {
    return files.map((file, index) => (
      <View key={index} style={styles.uploadedFileRow}>
        <Text numberOfLines={1} style={styles.fileName}>{file.name}</Text>
        <TouchableOpacity onPress={() => openPreview(file)}>
          <Image source={require('../assets/eye-off.png')} style={styles.actionIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(type, index)}>
          <Image source={require('../assets/trash.png')} style={styles.actionIcon} />
        </TouchableOpacity>
      </View>
    ));
  };

const uploadFile = async (file, folderName, userFolder) => {
  try {
    const fileExt = file.name.split('.').pop();
    const safeName = folderName.replace(/\s+/g, '_'); // évite les espaces
    const filePath = `${userFolder}/${safeName}.${fileExt}`;
    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload du fichier
    const { error: uploadError } = await supabase.storage
      .from('adhesion-files')
      .upload(filePath, Buffer.from(base64, 'base64'), {
        contentType: file.mimeType,
      });

    if (uploadError) {
      console.error('Erreur upload fichier:', uploadError.message);
      return null;
    }

    // Récupération de l'URL publique
    const { data, error: publicUrlError } = supabase.storage
      .from('adhesion-files')
      .getPublicUrl(filePath);

    if (publicUrlError) {
      console.error('Erreur getPublicUrl:', publicUrlError.message);
      return null;
    }

    return data.publicUrl;
  } catch (err) {
    console.error('Erreur lecture ou upload fichier:', err);
    return null;
  }
};

  const uploadMultipleFiles = async (files, folderName, userFolder) => {
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const displayName = i === 0 ? folderName : `${folderName}(${i + 1})`; // housing, housing(2), ...
    const url = await uploadFile(file, displayName, userFolder);
    if (url) urls.push(url);
  }
    return urls;
  };


const uploadContractPDF = async (folderName, userName, userEmail) => {
  try {
    console.log('Début génération PDF contrat');

    const html = `
      <html>
        <body>
          <h2>CONTRAT D’ADHÉSION – GP EXPRESS</h2>
          <p>${FULL_CONTRACT_TEXT.replace(/\n/g, '<br>')}</p>
          <hr>
          <p>Signé par : <strong>${userName} (${userEmail})</strong><br/>
          Date : ${new Date().toLocaleString()}<br/>
          Signature validée : ${hasSigned ? 'Oui' : 'Non'}</p>
        </body>
      </html>
    `;

    console.log('HTML prêt pour PDF');

    const { uri } = await Print.printToFileAsync({ html });
    console.log('PDF généré, uri:', uri);

    const base64File = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('PDF lu en base64, taille:', base64File.length);

    const fileName = `${folderName}/contract_${Date.now()}.pdf`;
    console.log('Nom du fichier pour upload:', fileName);

    const { error: uploadError } = await supabase.storage
      .from('adhesion-files')
      .upload(fileName, Buffer.from(base64File, 'base64'), {
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('Erreur upload contract PDF:', uploadError);
      return null;
    }

    console.log('Upload PDF réussi');

    const { data, error: publicUrlError } = supabase.storage
      .from('adhesion-files')
      .getPublicUrl(fileName);

    if (publicUrlError) {
      console.error('Erreur getPublicUrl contrat:', publicUrlError);
      return null;
    }

    console.log('URL publique du contrat:', data.publicUrl);

    return data.publicUrl;
  } catch (err) {
    console.error('Erreur génération/upload contrat PDF:', err);
    return null;
  }
};


const handleSubmit = async () => {
  if (!userName || !userEmail) {
    Alert.alert('Erreur', 'Veuillez saisir votre nom et votre email.');
    return;
  }

  if (passportFiles.length === 0 || housingFiles.length === 0) {
    Alert.alert('Erreur', 'Veuillez fournir au moins un document passeport et logement.');
    return;
  }

  if (!hasSigned) {
    Alert.alert('Erreur', 'Veuillez lire et signer le contrat.');
    return;
  }

  try {
    const userFolderName = `${userName.trim().replace(/\s+/g, '_')}-${userEmail.trim().replace(/\s+/g, '_')}`;

    // Upload fichiers passeport, logement, statut
    const passportUrls = await uploadMultipleFiles(passportFiles, 'passport', userFolderName);
    const housingUrls = await uploadMultipleFiles(housingFiles, 'housing', userFolderName);
    const statusUrls = await uploadMultipleFiles(statusFiles, 'status', userFolderName);

    // Upload contrat PDF signé
    const contractUrl = await uploadContractPDF(userFolderName, userName, userEmail);
    if (!contractUrl) {
      Alert.alert('Erreur', 'Erreur lors de l\'upload du contrat signé.');
      return;
    }

    // Récupération utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      Alert.alert('Erreur', 'Utilisateur non connecté.');
      return;
    }

    // Insertion dans la table adhesions avec toutes les URLs
    const { data, error } = await supabase
      .from('adhesions')
      .insert([{
        user_id: user.id,
        nom: userName,
        email: userEmail,
        is_validated: false,
        created_at: new Date().toISOString(),
      }]);

    if (error) {
      console.error('Erreur insertion adhésion:', error);
      Alert.alert('Erreur', 'Impossible d’enregistrer votre dossier.');
      return;
    }

    Alert.alert('Succès', 'Tous les fichiers et le contrat ont été uploadés.');

    setUserName('');
    setUserEmail('');
    setPassportFiles([]);
    setHousingFiles([]);
    setStatusFiles([]);
    setHasSigned(false);
    navigation.replace('WaitingValidation');

  } catch (err) {
    console.error('Erreur inattendue:', err);
    Alert.alert('Erreur', 'Une erreur est survenue, veuillez réessayer.');
  }
};


  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Formulaire d'adhésion</Text>

      <View style={styles.field}>
        <TouchableOpacity style={styles.filePickerRow}>
          <Image source={require('../assets/folder.png')} style={styles.iconSmall} />
          <Text style={styles.filePickerTextSmall}>Document</Text>
          <Image source={require('../assets/down-arrow.png')} style={styles.downArrowIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Passeport */}
        <Text style={styles.subLabel}>Passeport ou carte d'identité</Text>
        <TouchableOpacity onPress={() => pickDocument('passport')}>
          <Image source={require('../assets/file.png')} style={styles.fileFull} />
        </TouchableOpacity>
        {renderFileItem(passportFiles, 'passport')}

        {/* Logement */}
        <Text style={styles.subLabel}>Justificatif de logement</Text>
        <TouchableOpacity onPress={() => pickDocument('housing')}>
          <Image source={require('../assets/file.png')} style={styles.fileFull} />
        </TouchableOpacity>
        {renderFileItem(housingFiles, 'housing')}

        {/* Statut */}
        <Text style={styles.subLabel}>Statut juridique (optionnel)</Text>
        <TouchableOpacity onPress={() => pickDocument('status')}>
          <Image source={require('../assets/file.png')} style={styles.fileFull} />
        </TouchableOpacity>
        {renderFileItem(statusFiles, 'status')}

        {/* Lire et signer */}
        <Text style={styles.subLabel}>Contrat :</Text>
        <TouchableOpacity onPress={() => setPrivacyModalVisible(true)} style={styles.contractButton}>
          {hasSigned && (
            <Image
              source={require('../assets/juste.png')}
              style={styles.justeIcon}
            />
          )}
          <Text style={styles.contractText}> Lire et signer</Text>
        </TouchableOpacity>

        <Text style={styles.subLabel}>Nom complet</Text>
          <TextInput
            style={styles.input}
            placeholder="Entrez le nom"
            value={userName}
            onChangeText={setUserName}
          />

          <Text style={styles.subLabel}>Adresse email</Text>
          <TextInput
            style={styles.input}
            placeholder="Entrez votre mail"
            value={userEmail}
            onChangeText={setUserEmail}
            keyboardType="email-address"
          />

        <TouchableOpacity 
          style={[styles.confirmButton, { opacity: hasSigned ? 1 : 0.5 }]} 
          onPress={handleSubmit} 
          disabled={!hasSigned}
        >
          <Text style={styles.confirmText}>Confirmer</Text>
        </TouchableOpacity>



      </ScrollView>

      {/* Modal de prévisualisation */}
      <Modal visible={previewModalVisible} animationType="slide" onRequestClose={closePreview}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={closePreview} style={{ padding: 10, backgroundColor: '#ccc' }}>
            <Text style={{ fontSize: 18 }}>Fermer</Text>
          </TouchableOpacity>
          {previewFile && previewFile.mimeType === 'application/pdf' ? (
            <WebView
              source={{ uri: previewFile.uri }}
              style={{ flex: 1 }}
            />
          ) : (
            <Image
              source={{ uri: previewFile?.uri }}
              style={{ flex: 1, resizeMode: 'contain' }}
            />
          )}
        </View>
      </Modal>

      {/* Modal politique de confidentialité */}
      <Modal visible={privacyModalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalText}>
              Ceci est notre politique de confidentialité. En cliquant sur "Signer", vous acceptez nos termes et conditions.
            </Text>
          </ScrollView>
          <TouchableOpacity onPress={handleSign} style={styles.signButton}>
            <Text style={styles.signText}>Signer</Text>
          </TouchableOpacity>


        </View>
      </Modal>
      

      {/* Barre navigation */}
      <View style={styles.sidebarWrapper}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.sidebarItem}>
            <Image source={require('../assets/truck.png')} style={styles.sidebarIcon} />
            <Text style={styles.sidebarText}>Annonces</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem}>
            <Image source={require('../assets/fast-delivery.png')} style={styles.sidebarIcon} />
            <Text style={styles.sidebarText}>Suivi liraison</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem}>
            <Image source={require('../assets/chat.png')} style={styles.sidebarIcon} />
            <Text style={styles.sidebarText}>Discussions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem}>
            <Image source={require('../assets/user.png')} style={styles.sidebarIconProfil} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

}

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logo: {
  width: 170,
  height: 170,
  resizeMode: 'contain',
  alignSelf: 'flex-end',
  marginRight: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -46,
    alignSelf: 'center',         
    width: '90%',
    textAlign: 'center',          
  },


  form: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  field: {
    marginTop: 20,
    width: '100%',
  },
  subLabel: {
    fontSize: 14,
    marginTop: 25,
  },
    filePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEDEA',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 19,
    width: '80%',
    borderWidth: 1,
    borderColor: '#c4c6c5', 
    marginLeft: 15,
  },
  downArrowIcon: {
    width: 18,      
    height: 18,
    marginLeft: 'auto',  
    resizeMode: 'contain',
  },
  filePickerText: {
    fontSize: 16,
    color: 'black',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
    resizeMode: 'contain',
  },
    iconSmall: {
    width: 20,  
    height: 24,
    marginRight: 10,
    resizeMode: 'contain',
  },
    filePickerTextSmall: {
    fontSize: 14, 
    color: 'black',
    fontWeight: 'bold',
  },
  fileFull: {
    width: '100%',
    height: 115,
    resizeMode: 'cover',
    borderRadius: 8,
    marginTop: 10,
  },
  contractButton: {
    marginTop: 20,
    backgroundColor: '#E7D8D8',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractText: {
    fontSize: 14,
    color: '#000',
  },
  checkmark: {
    marginLeft: 10,
    fontSize: 18,
  },
  confirmButton: {
    marginTop: 30,
    backgroundColor: '#4095A4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  modalText: {
    fontSize: 16,
    lineHeight: 22,
  },
  signButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  signText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sidebarWrapper: {
    backgroundColor: '#fff',
    borderWidth: 1,                         
    borderColor: 'rgba(15, 15, 15, 0.2)',     
    borderTopLeftRadius: 13,                
    borderTopRightRadius: 13,               
    overflow: 'hidden',                     
  },
  sidebar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#fff',  
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,

  },
  sidebarItem: {
    alignItems: 'center',
  },
  sidebarIcon: {
    width: 32,
    height: 32,
  },
  sidebarIconProfil: {
    width: 38,
    height: 38,
  },
  sidebarText: {
    fontSize: 14,
    marginTop: 4,
  },
  justeIcon: {
  width: 20,
  height: 20,
  marginLeft: 4,
  resizeMode: 'contain',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginLeft: 10,
  },
  uploadedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF0F0',
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    justifyContent: 'space-between',
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    marginRight: 10,
  },
  actionIcon: {
    width: 22,
    height: 22,
    marginLeft: 10,
    resizeMode: 'contain',
  },
  input: {
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 10,
  borderRadius: 8,
  marginBottom: 15,
  backgroundColor: '#fff',
  },
  subLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },

});


