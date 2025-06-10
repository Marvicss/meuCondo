import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

const API_BASE_URL = 'https://meu-condo.vercel.app';

interface ParkingLot {
  id: string;
  name: string;
  description: string;
  available: boolean;
}

export default function ParkingLotIndexScreen() {
  const router = useRouter();
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const condominiumId = "9f743880-52dd-4b65-949d-0cdc726d4752";

  const fetchParkingLots = useCallback(async () => {
    setLoading(true);
    try {
      const authToken = await AsyncStorage.getItem("token");
      if (!authToken) {
        Alert.alert("Autenticação necessária", "Faça o login para continuar.");
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/parkings?condominiumId=${condominiumId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar as vagas. Tente novamente.");
      }

      const data = await response.json();
      setParkingLots(data);
    } catch (e: any) {
      Alert.alert("Erro", e.message);
    } finally {
      setLoading(false);
    }
  }, [condominiumId]);

  useFocusEffect(
    useCallback(() => {
      fetchParkingLots();
    }, [fetchParkingLots])
  );

  const renderItem = ({ item }: { item: ParkingLot }) => (
    <TouchableOpacity onPress={() => router.push({ pathname: `/parkingLot/[id]`, params: { id: item.id } })}>
      <View style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <FontAwesome name="car" size={24} color={COLORS.primaryBlue} />
          <Text style={styles.itemSpotNumber}>{item.name}</Text>
        </View>
        <Text style={styles.itemDetail}>{item.description}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.available ? COLORS.green : COLORS.red }]}>
          <Text style={styles.statusText}>{item.available ? 'LIVRE' : 'OCUPADA'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screenContainer}>
      <FlatList
        data={parkingLots}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <FontAwesome name="info-circle" size={48} color={COLORS.grey} />
              <Text style={styles.emptyText}>Nenhuma vaga encontrada.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 90 }}
        refreshing={loading}
        onRefresh={fetchParkingLots}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/parkingLot/new')}>
        <FontAwesome name="plus" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: COLORS.backgroundLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  itemContainer: { backgroundColor: 'white', padding: 16, marginHorizontal: 16, marginVertical: 8, borderRadius: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemSpotNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginLeft: 10 },
  itemDetail: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 12, marginTop: 4 },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start' },
  statusText: { color: 'white', fontWeight: 'bold' },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 30,
    elevation: 8,
  },
});
