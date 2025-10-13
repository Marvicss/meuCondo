import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Text, useTheme, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Usaremos para o ícone do carro
import BottomMenu from '@/components/BottomMenu';

// --- DEFINIÇÃO DE TIPOS ---
type ParkingLot = {
  id: string;
  name: string;
  description: string;
  available: boolean;
};

export default function ParkingLotPage() {
  const theme = useTheme(); // Puxa o tema dinâmico
  const router = useRouter();
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect para buscar os dados sempre que a tela é focada
  useFocusEffect(
    useCallback(() => {
      const fetchParkings = async () => {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            router.replace('/login');
            return;
          }
          // Lógica com fetch, como solicitado
          const response = await fetch("https://meu-condo.vercel.app/parkings/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Falha ao buscar vagas');
          
          const data = await response.json();
          if (Array.isArray(data)) {
            setParkingLots(data);
          }
        } catch (err) {
          console.error("Erro ao buscar estacionamentos:", err);
          Alert.alert("Erro", "Não foi possível carregar as vagas.");
        } finally {
          setLoading(false);
        }
      };
      fetchParkings();
    }, [router])
  );

  if (loading) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Vagas do Condomínio" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>

      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.container}>
          {parkingLots.length > 0 ? (
            parkingLots.map((lot) => (
              <Card key={lot.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Card.Title
                  title={lot.name}
                  titleStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
                  left={(props) => <MaterialCommunityIcons {...props} name="car" color={theme.colors.primary} />}
                  right={(props) => (
                    <Chip 
                      {...props}
                      icon={lot.available ? 'check-circle' : 'close-circle'}
                      textStyle={{ color: lot.available ? '#34C759' : theme.colors.error }}
                      style={{ backgroundColor: lot.available ? '#E9F9EE' : theme.colors.errorContainer, marginRight: 8 }}
                    >
                      {lot.available ? 'Disponível' : 'Indisponível'}
                    </Chip>
                  )}
                />
                <Card.Content>
                  <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                    {lot.description}
                  </Text>
                </Card.Content>
                <Card.Actions>
                  <Button 
                    mode="contained" 
                    onPress={() => router.push(`/parking/${lot.id}`)}
                  >
                    Ver detalhes
                  </Button>
                </Card.Actions>
              </Card>
            ))
          ) : (
            <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: 40 }}>
              Nenhuma vaga de estacionamento encontrada.
            </Text>
          )}
        </ScrollView>
        <BottomMenu />
      </View>
    </SafeAreaView>
  );
}

// --- ESTILOS SIMPLIFICADOS ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});