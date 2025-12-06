import BottomMenu from '@/components/BottomMenu';
import { API_URL } from '@/constants/envs';
import { FontAwesome5 } from '@expo/vector-icons'; // Ícone de carro
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { Appbar, Button, Card, Chip, Divider, Text, useTheme } from 'react-native-paper';

// --- TIPO ---
type ParkingSpace = {
  id: string;
  name: string;
  description?: string | null;
  capacity: number;
  available: boolean;
  condominiumId: string;
};

export default function ParkingResidentScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- BUSCAR DADOS E ID DO USUÁRIO ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace('/login');
        return;
      }

      // 1. Identificar quem sou eu
      try {
        const decoded: any = jwtDecode(token);
        const myId = decoded.userId || decoded.sub || decoded.id;
        setCurrentUserId(myId);
      } catch (e) {
        console.log("Erro ao decodificar token");
      }

      // 2. Buscar vagas
      const response = await fetch(`${API_URL}/parkings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Ordena: Minhas vagas primeiro > Livres > Ocupadas
        setParkingSpaces(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
      } 
    } catch (err) {
       // Silent fail
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // --- AÇÃO: ESTACIONAR ---
  const handlePark = async (space: ParkingSpace) => {
    Alert.alert("Estacionar", `Confirmar vaga ${space.name}?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim", onPress: async () => {
            setProcessingId(space.id);
            try {
                const token = await AsyncStorage.getItem('token');
                
                // Payload para ocupar
                const payload = {
                    ...space,
                    available: false,
                    description: `Ocupado por Morador [USER_ID:${currentUserId}]`
                };

                const response = await fetch(`${API_URL}/parkings/${space.id}`, {
                    method: 'PUT',
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    fetchData();
                    Alert.alert("Sucesso", "Vaga reservada!");
                } else {
                    Alert.alert("Erro", "Não foi possível estacionar.");
                }
            } catch {
                Alert.alert("Erro", "Falha de conexão.");
            } finally {
                setProcessingId(null);
            }
        }}
    ]);
  };

  // --- AÇÃO: SAIR DA VAGA ---
  const handleLeave = async (space: ParkingSpace) => {
    Alert.alert("Sair", `Liberar a vaga ${space.name}?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, Sair", onPress: async () => {
            setProcessingId(space.id);
            try {
                const token = await AsyncStorage.getItem('token');
                
                // Payload para liberar
                const payload = {
                    ...space,
                    available: true,
                    description: "Vaga Disponível"
                };

                const response = await fetch(`${API_URL}/parkings/${space.id}`, {
                    method: 'PUT',
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    fetchData();
                    Alert.alert("Sucesso", "Vaga liberada!");
                }
            } catch {
                Alert.alert("Erro", "Falha ao liberar.");
            } finally {
                setProcessingId(null);
            }
        }}
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#0095FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* HEADER CLEAN */}
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: '#F8F9FA', elevation: 0 }}>
         <Appbar.Content title="Estacionamento" titleStyle={{ fontWeight: '600', fontSize: 18, color: '#1A1A1A' }} />
      </Appbar.Header>

      <View style={styles.container}>
         <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
            
            {parkingSpaces.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={{ color: '#8E8E93' }}>Nenhuma vaga encontrada.</Text>
                </View>
            )}

            {parkingSpaces.map((space) => {
                // Lógica de Status
                const isOccupied = !space.available;
                
                // Verifica se FUI EU que estacionei (procura meu ID na descrição)
                const isMySpot = isOccupied && currentUserId && space.description?.includes(currentUserId);

                // Definição de Cores e Textos
                let statusColor = '#0095FF'; // Azul (Livre)
                let statusText = 'Livre';
                let chipBg = '#E3F2FD';

                if (isMySpot) {
                    statusColor = '#22C55E'; // Verde (Minha Vaga)
                    statusText = 'Sua Vaga';
                    chipBg = '#DCFCE7';
                } else if (isOccupied) {
                    statusColor = '#FF3B30'; // Vermelho (Ocupada por outros)
                    statusText = 'Ocupada';
                    chipBg = '#FFEBEE';
                }

                const isProcessing = processingId === space.id;

                return (
                    <Card key={space.id} style={styles.roomCard}>
                        <View style={styles.cardContent}>
                            
                            {/* CABEÇALHO DO CARD */}
                            <View style={styles.cardHeaderRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <View style={[styles.iconBox, { backgroundColor: chipBg }]}>
                                        <FontAwesome5 name="car-alt" size={18} color={statusColor} />
                                    </View>
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={styles.roomTitle} numberOfLines={1}>{space.name}</Text>
                                        <Text style={styles.roomCapacity}>
                                            {isMySpot ? 'Você estacionou aqui' : (isOccupied ? 'Indisponível' : 'Disponível para uso')}
                                        </Text>
                                    </View>
                                </View>
                                
                                <Chip 
                                    style={{ backgroundColor: chipBg, height: 30, alignItems: 'center', justifyContent: 'center' }} 
                                    textStyle={{ color: statusColor, fontSize: 11, fontWeight: 'bold', lineHeight: 14 }}
                                >
                                    {statusText}
                                </Chip>
                            </View>

                            <Divider style={{ marginVertical: 12, backgroundColor: '#F0F0F0' }} />

                            {/* BOTÕES DE AÇÃO */}
                            <View style={styles.actionButtons}>
                                
                                {/* CASO 1: VAGA MINHA -> Botão de Sair */}
                                {isMySpot && (
                                    <Button 
                                        mode="outlined" 
                                        onPress={() => handleLeave(space)}
                                        loading={isProcessing}
                                        style={[styles.actionBtn, { borderColor: '#22C55E', flex: 1 }]}
                                        contentStyle={{ height: 40 }}
                                        textColor="#22C55E"
                                        labelStyle={{ fontSize: 12, fontWeight: 'bold' }}
                                    >
                                        Sair da Vaga
                                    </Button>
                                )}

                                {/* CASO 2: VAGA LIVRE -> Botão Estacionar */}
                                {!isOccupied && (
                                    <Button 
                                        mode="contained" 
                                        onPress={() => handlePark(space)}
                                        loading={isProcessing}
                                        style={[styles.actionBtn, { backgroundColor: '#0095FF', flex: 1 }]}
                                        contentStyle={{ height: 40 }}
                                        labelStyle={{ fontSize: 12, fontWeight: 'bold' }}
                                    >
                                        Estacionar
                                    </Button>
                                )}

                                {/* CASO 3: VAGA OCUPADA (Por outros) -> Botão Bloqueado */}
                                {isOccupied && !isMySpot && (
                                    <Button 
                                        mode="contained" 
                                        disabled
                                        style={[styles.actionBtn, { backgroundColor: '#E0E0E0', flex: 1 }]}
                                        contentStyle={{ height: 40 }}
                                        labelStyle={{ fontSize: 12, color: '#A0A0A0' }}
                                    >
                                        Ocupada
                                    </Button>
                                )}

                            </View>
                        </View>
                    </Card>
                );
            })}
         </ScrollView>
      </View>
      
      <BottomMenu />
    </SafeAreaView>
  );
}

// --- ESTILOS IGUAIS AO SINDICO ---
const styles = StyleSheet.create({
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  container: { flex: 1, paddingHorizontal: 16 },
  
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 20
  },

  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  cardContent: {
    padding: 16
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A'
  },
  roomCapacity: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2
  },

  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8
  },
  actionBtn: {
    borderRadius: 20,
    height: 40,
    justifyContent: 'center'
  }
});