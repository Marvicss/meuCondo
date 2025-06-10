import { FontAwesome } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primaryBlue: '#2F80ED',
  primaryYellow: '#F2C94C',
  textPrimary: '#333333',
  textSecondary: '#555555',
  backgroundLight: '#F9F9F9',
  white: '#FFFFFF',
  red: '#EB5757',
  green: '#27AE60',
};

const API_BASE_URL = 'https://meu-condo.vercel.app';

interface ParkingLot {
  id: string;
  name: string;
  description: string;
  available: boolean;
  condominiumId: string;
  capacity?: number;
}

export default function ParkingLotDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParkingDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZTYyOTEwYy1lYjM4LTQ0ZDYtOWQyNi1mZjg3OTQ0MWExNzciLCJlbWFpbCI6ImJtZm1sdWNhc0BnbWFpbC5jb20iLCJ1c2VyVHlwZSI6IkFETUlOIiwiaWF0IjoxNzQ5NTczNzgyLCJleHAiOjE3NDk2NjAxODJ9.jX6sy1gm4rCybfpVbK_4MuqE1Uet_arm5TU4uHkBX_A";
      
      const response = await fetch(`${API_BASE_URL}/parkings/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Não foi possível buscar os detalhes da vaga.`);
      }

      const data: ParkingLot = await response.json();
      setParkingLot(data);

    } catch (e: any) {
      setError(e.message);
      Alert.alert("Erro", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingDetails();
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.primaryBlue} style={{ flex: 1, backgroundColor: COLORS.backgroundLight }} />;
  }

  if (error) {
    return (
        <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Ocorreu um erro ao carregar os detalhes.</Text>
            <TouchableOpacity onPress={fetchParkingDetails}>
                <Text style={styles.retryText}>Tentar Novamente</Text>
            </TouchableOpacity>
        </View>
    );
  }

  if (!parkingLot) {
    return <View style={styles.centerContainer}><Text>Vaga não encontrada.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: parkingLot.name }} />
      
      <View style={styles.card}>
        <View style={styles.header}>
            <FontAwesome name="product-hunt" size={32} color={COLORS.primaryBlue} />
            <Text style={styles.title}>{parkingLot.name}</Text>
        </View>

        <Text style={styles.description}>{parkingLot.description}</Text>
        
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={[
                styles.statusBadge,
                { backgroundColor: parkingLot.available ? COLORS.green : COLORS.red }
            ]}>
                <Text style={styles.statusText}>
                    {parkingLot.available ? 'LIVRE' : 'OCUPADA'}
                </Text>
            </View>
        </View>

        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => router.push({ pathname: `/parkingLot/edit/[id]`, params: { id: parkingLot.id } })}
        >
            <FontAwesome name="pencil" size={16} color={COLORS.textPrimary} />
            <Text style={styles.editButtonText}>Editar Vaga</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundLight,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 15,
        marginBottom: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginLeft: 15,
        flex: 1,
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 20,
        lineHeight: 24,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginRight: 10,
    },
    statusBadge: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    statusText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center'
    },
    retryText: {
        fontSize: 16,
        color: COLORS.primaryBlue,
        fontWeight: 'bold',
        marginTop: 10,
    },
    editButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primaryYellow,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    editButtonText: {
        color: COLORS.textPrimary,
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    }
});
