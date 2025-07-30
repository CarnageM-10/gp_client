import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function LivraisonDetailScreenClient({ route }) {
  const { id, annonce_id } = route.params;
  const [etapes, setEtapes] = useState([]);
  const [commentaire, setCommentaire] = useState('');
  const [rating, setRating] = useState(0);
  const [annonce, setAnnonce] = useState(null);
  const [livreeAt, setLivreeAt] = useState(null);
  const [envoye, setEnvoye] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);

  useEffect(() => {
    fetchEtapes();
    fetchAnnonce();
    fetchDeliveryInfo();
  }, []);

  const fetchEtapes = async () => {
    const { data, error } = await supabase
      .from('livraison_etapes')
      .select('*')
      .eq('delivery_request_id', id);

    setEtapes(data || []);

    const livreeStep = data?.find((e) => e.status === 'livree');

    if (livreeStep) {
      setLivreeAt(livreeStep.create_at);
      if (livreeStep.commentaire || livreeStep.rating) {
        setCommentaire(livreeStep.commentaire || '');
        setRating(livreeStep.rating || 0);
        setEnvoye(true);
      }
    }
  };

  const fetchAnnonce = async () => {
    const { data } = await supabase
      .from('annonces')
      .select('*')
      .eq('id', annonce_id)
      .single();

    if (data) {
      setAnnonce(data);
    }
  };

  const fetchDeliveryInfo = async () => {
    const { data, error } = await supabase
      .from('delivery_requests')
      .select('colis_name, adresse_livraison, nom_prenom')
      .eq('id', id)
      .single();

    if (data) {
      setDeliveryInfo(data);
    } else {
      console.error('Erreur fetchDeliveryInfo:', error);
    }
  };

  const currentSteps = etapes.map((e) => e.etape);
  const isEtape = (e) => currentSteps.includes(e);

  const handleStarPress = (index) => {
    if (!envoye) setRating(index);
  };

  const handleSubmit = async () => {
    const { error } = await supabase
      .from('livraison_etapes')
      .update({ commentaire, rating })
      .eq('delivery_request_id', id)
      .eq('status', 'livree');

    if (error) {
      alert("Erreur lors de l'envoi.");
      return;
    }

    setEnvoye(true);
    alert('Merci pour votre retour !');
  };

  const renderStep = (etapeCode, label) => (
    <View style={styles.step}>
      <View style={styles.verticalLine} />
      {isEtape(etapeCode) ? (
        <Image source={require('../assets/juste.png')} style={styles.icon} />
      ) : (
        <Text style={styles.bullet}>⚫</Text>
      )}
      <Text style={styles.stepText}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.page}>
      <Navbar />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.container}>
            <View style={styles.titleAndInfoBox}>
              <Text style={styles.title}>Suivi de votre livraison</Text>
              {deliveryInfo && (
                <Text style={styles.infoText}>
                  Le paquet <Text style={styles.bold}>"{deliveryInfo.colis_name}"</Text> à destination de{' '}
                  <Text style={styles.bold}>{deliveryInfo.adresse_livraison}</Text> pour{' '}
                  <Text style={styles.bold}>{deliveryInfo.nom_prenom}</Text> est en cours d’acheminement.
                </Text>
              )}
            </View>

            <View style={styles.trackingWrapper}>
              {renderStep('en_cours', 'Récupération du colis')}
              {renderStep('en_cours', 'Vérification du colis')}
              {renderStep('en_cours', 'Paiement effectué')}
              {renderStep('recupere', 'Départ du colis')}
              {renderStep('recupere', 'Arrivée du colis')}
              {renderStep('termine', 'Livraison effectuée')}
            </View>

            {isEtape('termine') && (
              <>
                <Text style={styles.deliveryDate}>
                  Date de livraison :{' '}
                  {livreeAt
                    ? new Date(livreeAt).toLocaleString()
                    : 'Non disponible'}
                </Text>

                <TextInput
                  placeholder="Laissez un commentaire"
                  value={commentaire}
                  onChangeText={setCommentaire}
                  style={styles.input}
                  multiline
                  editable={!envoye}
                />

                <View style={styles.ratingWrapper}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleStarPress(i)}
                    >
                      <Text style={styles.star}>{i <= rating ? '⭐' : '☆'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {!envoye && (
                  <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Envoyer</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <Sidebar language="fr" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    flex: 1,
  },
  titleAndInfoBox: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 5,
    borderLeftColor: '#2196F3',
    padding: 15,
    marginBottom: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
  },
  trackingWrapper: {
    position: 'relative',
    paddingLeft: 20,
    marginBottom: 10,
  },
  verticalLine: {
    position: 'absolute',
    left: 9,
    top: 20,
    bottom: -10,
    width: 2,
    backgroundColor: '#000',
    zIndex: -1,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  bullet: {
    fontSize: 14,
    width: 20,
    marginRight: 10,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 16,
  },
  deliveryDate: {
    marginBottom: 10,
    fontStyle: 'italic',
    color: '#333',
  },
  input: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  ratingWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  star: {
    fontSize: 24,
    marginHorizontal: 5,
    color: '#f1c40f',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});