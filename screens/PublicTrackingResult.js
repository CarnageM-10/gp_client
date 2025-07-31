import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import Invitebar from '../components/Invitebar';

export default function PublicTrackingResult({ route }) {
  const { trackingNumber } = route.params;
  const [deliveryId, setDeliveryId] = useState(null);
  const [etapes, setEtapes] = useState([]);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchTracking();
  }, []);

  const fetchTracking = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('delivery_requests')
      .select('id, colis_name, adresse_livraison, nom_prenom')
      .eq('numero_suivi', trackingNumber)
      .single();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setDeliveryId(data.id);
    setDeliveryInfo(data);

    const { data: stepsData } = await supabase
      .from('livraison_etapes')
      .select('*')
      .eq('delivery_request_id', data.id);

    setEtapes(stepsData || []);
    setLoading(false);
  };

  const currentSteps = etapes.map((e) => e.etape);
  const isEtape = (e) => currentSteps.includes(e);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Numéro de suivi introuvable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Invitebar />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>📦 Suivi de votre livraison</Text>

        {deliveryInfo && (
          <Text style={styles.infoText}>
            Le paquet <Text style={styles.bold}>"{deliveryInfo.colis_name}"</Text> à destination de{' '}
            <Text style={styles.bold}>{deliveryInfo.adresse_livraison}</Text> pour{' '}
            <Text style={styles.bold}>{deliveryInfo.nom_prenom}</Text> est en cours d’acheminement.
          </Text>
        )}

        <View style={styles.trackingWrapper}>
          {renderStep('colis récupéré', '📤 Colis récupéré')}
          {renderStep('vérification du colis', '🔎 Vérification')}
          {renderStep('paiement effectué', '💳 Paiement effectué')}
          {renderStep('livraison en cours', '🚚 Départ du colis')}
          {renderStep('livraison en cours', '🛬 Arrivée du colis')}
          {renderStep('livraison effectué', '📬 Livraison effectuée')}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1E2A38',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  trackingWrapper: {
    position: 'relative',
    paddingLeft: 20,
    marginTop: 10,
  },
  verticalLine: {
    position: 'absolute',
    left: 9,
    top: 20,
    bottom: -10,
    width: 2,
    backgroundColor: '#007BFF',
    zIndex: -1,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  bullet: {
    fontSize: 16,
    width: 20,
    marginRight: 10,
    textAlign: 'center',
    color: '#888',
  },
  stepText: {
    fontSize: 16,
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFound: {
    fontSize: 18,
    color: 'red',
  },
});
