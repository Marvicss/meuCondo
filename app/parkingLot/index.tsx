import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

const COLORS = {
  primaryBlue: '#2F80ED',
  primaryYellow: '#F2C94C',
  textPrimary: '#333333',
  textSecondary: '#555555',
  backgroundLight: '#F9F9F9',
  white: '#FFFFFF',
  red: '#EB5757',
  green: '#27AE60',
  grey: '#BDBDBD',
};

const API_BASE_URL = 'https://meu-condo.vercel.app/api';

interface ParkingLot {
  id: number;
  spotNumber: string;
  block?: string;
  occupied: boolean;
  spotType: string;
  condominiumId: number;
}

export default function ParkingLotIndexScreen() {
  const router = useRouter();
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<number | null>(1);

  const fetchParkingLots = async (condoId: number | null) => {
    if (!condoId) {
      setParkingLots([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/parking-lots?condominiumId=${condoId}`);
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
      }
      const data: ParkingLot[] = await response.json();
      setParkingLots(data);
    } catch (e: any) {
      console.error("Falha ao buscar vagas:", e);
      setError(e.message || 'Falha ao carregar dados.');
      Alert.alert("Erro", `Não foi possível carregar as vagas: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCondominiumId) {
      fetchParkingLots(selectedCondominiumId);
    } else {
      setLoading(false);
      setParkingLots([]);
    }
  }, [selectedCondominiumId]);

  const renderItem = ({ item }: { item: ParkingLot }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <FontAwesome name="car" size={24} color={COLORS.primaryBlue} />
        <Text style={styles.itemSpotNumber}>{item.spotNumber}</Text>
      </View>
      {item.block && <Text style={styles.itemDetail}><Text style={styles.bold}>Bloco:</Text> {item.block}</Text>}
      <Text style={styles.itemDetail}><Text style={styles.bold}>Tipo:</Text> {item.spotType}</Text>
      <View style={[
        styles.statusBadge,
        { backgroundColor: item.occupied ? COLORS.red : COLORS.green }
      ]}>
        <Text style={styles.statusText}>
          {item.occupied ? 'OCUPADA' : 'LIVRE'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.screenContainer, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        <Text style={{ marginTop: 10, color: COLORS.textSecondary }}>Carregando vagas...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Vagas do Condomínio',
        }} 
      />
      <View style={styles.screenContainer}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erro: {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchParkingLots(selectedCondominiumId)}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        )}
        <FlatList
          data={parkingLots}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            !error && !loading ? (
              <View style={styles.center}>
                <FontAwesome name="info-circle" size={48} color={COLORS.grey} />
                <Text style={styles.emptyText}>
                  {selectedCondominiumId ? "Nenhuma vaga encontrada." : "Selecione um condomínio."}
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
        <TouchableOpacity style={styles.reloadButton} onPress={() => fetchParkingLots(selectedCondominiumId)}>
          <FontAwesome name="refresh" size={20} color={COLORS.white} />
          <Text style={styles.reloadButtonText}>Recarregar</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20, backgroundColor: COLORS.backgroundLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.primaryBlue, marginBottom: 24, textAlign: 'center' }, // Pode ser removido se o Stack.Screen já define o título no header
  itemContainer: { backgroundColor: COLORS.white, padding: 16, marginBottom: 12, borderRadius: 10, shadowColor: COLORS.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemSpotNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginLeft: 10 },
  itemDetail: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 5 },
  bold: { fontWeight: 'bold' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start', marginTop: 8 },
  statusText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  errorContainer: { alignItems: 'center', marginVertical: 20, padding: 15, backgroundColor: '#ffebee', borderRadius: 8 },
  errorText: { fontSize: 16, color: COLORS.red, textAlign: 'center', marginBottom: 10 },
  retryButton: { backgroundColor: COLORS.primaryYellow, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  retryButtonText: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  emptyText: { fontSize: 16, textAlign: 'center', marginTop: 20, color: COLORS.textSecondary },
  reloadButton: { backgroundColor: COLORS.primaryBlue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 25, marginVertical: 10, marginHorizontal: 20, shadowColor: COLORS.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  reloadButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});