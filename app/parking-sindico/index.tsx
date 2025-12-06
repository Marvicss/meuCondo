import BottomMenu from '@/components/BottomMenu';
import { API_URL } from '@/constants/envs';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
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
  TouchableOpacity,
  View
} from 'react-native';
import { Appbar, Button, Card, Chip, Dialog, Divider, IconButton, Portal, Text, TextInput, useTheme } from 'react-native-paper';


type ParkingSpace = {
  id: string;
  name: string;
  description?: string | null;
  capacity: number;
  available: boolean; 
  condominiumId: string;
};

export default function ParkingSindicoScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Criação
  const [createVisible, setCreateVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  // Estados de Exclusão
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<ParkingSpace | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --- BUSCAR DADOS ---
  const fetchParkingData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_URL}/parkings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Ordena por nome
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
      fetchParkingData();
    }, [fetchParkingData])
  );

  // --- AÇÃO: CRIAR VAGA ---
  const handleCreateSpace = async () => {
    if (!newName.trim()) {
      Alert.alert('Erro', 'Digite o nome da vaga.');
      return;
    }
    try {
      setCreating(true);
      const token = await AsyncStorage.getItem('token');
      // Pega o ID do condomínio da primeira vaga ou do storage
      const condoId = await AsyncStorage.getItem('condominiumId') || parkingSpaces[0]?.condominiumId || '1';

      await fetch(`${API_URL}/parkings/`, {
        method: 'POST',
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: newName,
            description: "Vaga de Estacionamento",
            capacity: 1,
            available: true, // Nasce disponível
            condominiumId: condoId
        })
      });
      
      setCreateVisible(false);
      setNewName('');
      fetchParkingData();
    } catch (err) {
      Alert.alert('Erro', 'Falha ao criar vaga.');
    } finally {
      setCreating(false);
    }
  };

  // --- AÇÃO: EXCLUIR VAGA ---
  const handleDeleteSpace = async () => {
    if (!roomToDelete) return;
    try {
      setDeleting(true);
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/parkings/${roomToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteVisible(false);
      setRoomToDelete(null);
      fetchParkingData();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível excluir.');
    } finally {
      setDeleting(false);
    }
  };

  // --- AÇÃO: RESERVAR (OCUPAR) ---
  const handleReserve = async (space: ParkingSpace) => {
    // Se available for false, está ocupada
    if (!space.available) {
        Alert.alert("Aviso", "Esta vaga já está ocupada.");
        return;
    }

    Alert.alert("Reservar Vaga", `Deseja marcar a ${space.name} como ocupada?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;

                const decoded: any = jwtDecode(token);
                const myUserId = decoded.userId || decoded.sub || decoded.id;

                // Montamos o payload igual ao DTO
                const payload = {
                    ...space,
                    available: false, // Marca como indisponível
                    description: `Ocupado pelo Síndico [USER_ID:${myUserId}]` // Salva quem reservou na descrição
                };

                const response = await fetch(`${API_URL}/parkings/${space.id}`, {
                    method: 'PUT', // Geralmente atualizações completas usam PUT
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    fetchParkingData();
                } else {
                    const err = await response.text();
                    Alert.alert("Erro", `Servidor recusou: ${err}`);
                }
            } catch {
                Alert.alert("Erro", "Falha ao reservar.");
            }
        }}
    ]);
  };

  // --- AÇÃO: LIBERAR (DESOCUPAR) ---
  const handleLiberar = async (space: ParkingSpace) => {
    if (space.available) return; // Se já está true, não faz nada

    Alert.alert("Liberar Vaga", `Deseja liberar a ${space.name}?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", style: "destructive", onPress: async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                
                // Reseta para disponível e limpa a descrição
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
                    fetchParkingData();
                } else {
                    Alert.alert("Erro", "Falha ao liberar.");
                }
            } catch {
                Alert.alert("Erro", "Falha ao liberar.");
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

      <Appbar.Header mode="center-aligned" style={{ backgroundColor: '#F8F9FA', elevation: 0 }}>
         <Appbar.Content title="Gerenciar Estacionamento" titleStyle={{ fontWeight: '600', fontSize: 18, color: '#1A1A1A' }} />
      </Appbar.Header>

      <View style={styles.container}>
         
         <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setCreateVisible(true)}
            activeOpacity={0.9}
         >
            <Feather name="plus" size={20} color="#FFF" />
            <Text style={styles.addButtonText}>Nova Vaga</Text>
         </TouchableOpacity>

         <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            
            <Text style={styles.sectionTitle}>Todas as Vagas</Text>

            {parkingSpaces.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={{ color: '#8E8E93' }}>Nenhuma vaga cadastrada.</Text>
                </View>
            )}

            {parkingSpaces.map((space) => {
                // Lógica INVERSA: se available é true, está livre. Se false, ocupado.
                const isOccupied = !space.available; 
                
                const statusColor = isOccupied ? '#FF3B30' : '#0095FF';
                const statusText = isOccupied ? 'Ocupada' : 'Livre';
                const chipBg = isOccupied ? '#FFEBEE' : '#E3F2FD';

                // Tentar extrair ID da descrição se existir
                const hasUserId = space.description?.includes('USER_ID');

                return (
                    <Card key={space.id} style={styles.roomCard}>
                        <View style={styles.cardContent}>
                            
                            <View style={styles.cardHeaderRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <View style={styles.iconBox}>
                                        <FontAwesome5 name="car-alt" size={18} color="#0095FF" />
                                    </View>
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={styles.roomTitle} numberOfLines={1}>{space.name}</Text>
                                        <Text style={styles.roomCapacity}>
                                            {isOccupied && hasUserId ? 'Reservado pelo App' : (space.description || 'Vaga Padrão')}
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

                            <View style={styles.actionButtons}>
                                
                                {/* BOTÃO RESERVAR */}
                                <Button 
                                    mode="contained" 
                                    onPress={() => handleReserve(space)}
                                    disabled={isOccupied} 
                                    style={[styles.actionBtn, { backgroundColor: isOccupied ? '#E0E0E0' : '#0095FF', flex: 1 }]}
                                    contentStyle={{ height: 40 }}
                                    labelStyle={{ fontSize: 12, fontWeight: '600' }}
                                    compact
                                >
                                    Estacionar
                                </Button>

                                {/* BOTÃO LIBERAR */}
                                <Button 
                                    mode="outlined" 
                                    onPress={() => handleLiberar(space)}
                                    disabled={!isOccupied}
                                    style={[
                                      styles.actionBtn, 
                                      { 
                                        borderColor: isOccupied ? '#0095FF' : '#E0E0E0', 
                                        flex: 1 
                                      }
                                    ]}
                                    contentStyle={{ height: 40 }}
                                    textColor={isOccupied ? "#0095FF" : "#A0A0A0"}
                                    labelStyle={{ fontSize: 12, fontWeight: '600' }}
                                    compact
                                >
                                    Liberar
                                </Button>

                                <IconButton 
                                    icon="delete-outline" 
                                    iconColor="#FF3B30" 
                                    size={22} 
                                    onPress={() => { setRoomToDelete(space); setDeleteVisible(true); }}
                                    style={{ margin: 0, marginLeft: 4 }}
                                />
                            </View>
                        </View>
                    </Card>
                );
            })}
         </ScrollView>

         <Portal>
            <Dialog visible={createVisible} onDismiss={() => setCreateVisible(false)} style={{ backgroundColor: '#fff', borderRadius: 16 }}>
                <Dialog.Title style={{ color: '#1A1A1A', fontWeight: 'bold', fontSize: 18 }}>Nova Vaga</Dialog.Title>
                <Dialog.Content>
                    <TextInput 
                        label="Nome da Vaga (ex: 102-A)" 
                        value={newName} 
                        onChangeText={setNewName} 
                        mode="outlined" 
                        style={styles.modalInput} 
                        outlineColor="#E0E0E0" 
                        activeOutlineColor="#0095FF"
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setCreateVisible(false)} textColor="#666">Cancelar</Button>
                    <Button onPress={handleCreateSpace} loading={creating} textColor="#0095FF" labelStyle={{ fontWeight: 'bold' }}>Criar</Button>
                </Dialog.Actions>
            </Dialog>

            <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)} style={{ backgroundColor: '#fff', borderRadius: 16 }}>
                <Dialog.Title style={{ color: '#FF3B30', fontSize: 18 }}>Excluir Vaga?</Dialog.Title>
                <Dialog.Content>
                    <Text variant="bodyMedium" style={{ color: '#333' }}>
                        Tem certeza que deseja excluir "{roomToDelete?.name}"?
                    </Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setDeleteVisible(false)} textColor="#666">Cancelar</Button>
                    <Button onPress={handleDeleteSpace} loading={deleting} textColor="#FF3B30" labelStyle={{ fontWeight: 'bold' }}>Excluir</Button>
                </Dialog.Actions>
            </Dialog>
         </Portal>

      </View>
      
      <BottomMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  container: { flex: 1, paddingHorizontal: 16 },
  
  addButton: {
    backgroundColor: '#0095FF',
    borderRadius: 30,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#0095FF',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  addButtonText: { color: '#fff', fontWeight: '600', marginLeft: 8, fontSize: 15 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    marginLeft: 4
  },
  
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12
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
    backgroundColor: '#E3F2FD', 
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
  },
  
  modalInput: {
    marginBottom: 12,
    backgroundColor: '#fff'
  }
});