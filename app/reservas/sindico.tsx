import BottomMenu from '@/components/BottomMenu';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Appbar, Button, Card, Chip, Dialog, Divider, IconButton, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

// Configuração do calendário para português
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// Interfaces
interface PartyRoom { id: string; name: string; description: string; capacity: number; available: boolean; condominiumId: string; }
interface User { id: string; fullName: string; }
interface UserCache { [key: string]: string; }
interface MarkedDates { [date: string]: { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string; }; }
type DecodedToken = { userId: string; email: string; userType: string; };

export default function SindicoScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [partyRooms, setPartyRooms] = useState<PartyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCache, setUserCache] = useState<UserCache>({});
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<PartyRoom | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ensureCondominiumId = useCallback(async () => {
    const candidates = ['condominiumId', 'condoId', 'condominioId'];
    for (const key of candidates) {
      const val = await AsyncStorage.getItem(key);
      if (val) return val;
    }
    const token = await AsyncStorage.getItem('token');
    if (!token) return null;
    try {
      let list: any[] = [];
      try {
        const res = await api.get<any[]>('/condominiums', { headers: { Authorization: `Bearer ${token}` } });
        list = Array.isArray(res.data) ? res.data : [];
      } catch (err: any) {
        return null;
      }
      return list.length > 0 ? String(list[0].id) : null;
    } catch {
      return null;
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setCurrentUserId(decoded.userId);
      } catch {}

      const roomsResponse = await api.get('/partyrooms/', { headers: { Authorization: `Bearer ${token}` } });
      const rooms: PartyRoom[] = roomsResponse.data;
      
      const newUsers: UserCache = {};
      const newMarkedDates: MarkedDates = {};
      
      for (const room of rooms) {
         const allMatches = [...room.description.matchAll(/\[RESERVADO_EM:(.*?)\]\[USER_ID:(.*?)\]/g)];
         for (const match of allMatches) {
             const date = match[1];
             const userId = match[2];
             newMarkedDates[date] = { marked: true, dotColor: '#0095FF' };
             
             if (!userCache[userId] && !newUsers[userId]) {
                 try {
                    const uRes = await api.get<User>(`/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
                    newUsers[userId] = uRes.data.fullName;
                 } catch {
                    newUsers[userId] = 'Usuário Desconhecido';
                 }
             }
         }
      }

      setUserCache(prev => ({ ...prev, ...newUsers }));
      setMarkedDates(newMarkedDates);
      setPartyRooms(rooms);

    } catch (error) {
      // Silent error
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );

  const handleCreateRoom = async () => {
    if (!newName.trim() || !newCapacity.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    const condoId = await ensureCondominiumId();
    if (!condoId) return;

    try {
      setCreating(true);
      const token = await AsyncStorage.getItem('token');
      const imageSeed = `room-${Math.floor(Math.random()*1000)}`;
      
      await api.post('/partyrooms/', {
        name: newName.trim(),
        capacity: Number(newCapacity),
        description: `${newDescription.trim()} [IMG_SEED:${imageSeed}]`,
        available: true,
        condominiumId: condoId,
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setCreateVisible(false);
      setNewName(''); setNewCapacity(''); setNewDescription('');
      await fetchAllData();
      Alert.alert('Sucesso', 'Espaço criado!');
    } catch (err) {
      Alert.alert('Erro', 'Falha ao criar espaço.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      setDeleting(true);
      const token = await AsyncStorage.getItem('token');
      await api.delete(`/partyrooms/${roomToDelete.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setDeleteVisible(false);
      setRoomToDelete(null);
      await fetchAllData();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível excluir.');
    } finally {
      setDeleting(false);
    }
  };

  const handleClearReservation = async (room: PartyRoom) => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      Alert.alert("Liberar Espaço", "Deseja remover TODAS as reservas deste espaço?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Confirmar", style: "destructive", onPress: async () => {
              try {
                  setLoading(true);
                  const cleanDesc = room.description.replace(/\[RESERVADO_EM:.*?\]\[USER_ID:.*?\]/g, '').trim();
                  await api.put(`/partyrooms/${room.id}`, {
                      ...room, available: true, description: cleanDesc
                  }, { headers: { Authorization: `Bearer ${token}` } });
                  await fetchAllData();
                  Alert.alert("Sucesso", "Reservas limpas.");
              } catch {
                  Alert.alert("Erro", "Falha ao liberar.");
              } finally { setLoading(false); }
          }}
      ]);
  };

  const handleReserve = async (room: PartyRoom) => {
      if (!selectedDate) {
          Alert.alert("Selecione uma data", "Clique no calendário para escolher o dia.");
          return;
      }
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      try {
          setLoading(true);
          const newDesc = `${room.description} [RESERVADO_EM:${selectedDate}][USER_ID:${currentUserId}]`;
          
          await api.put(`/partyrooms/${room.id}`, {
              ...room, description: newDesc
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          await fetchAllData();
          Alert.alert("Sucesso", "Reserva realizada.");
      } catch {
          Alert.alert("Erro", "Falha ao reservar.");
      } finally { setLoading(false); }
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
      
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: '#F8F9FA', elevation: 0 }}>
         {/* REMOVIDO ÍCONE DE MENU */}
         <Appbar.Content title="Gerenciar Espaços" titleStyle={{ fontWeight: '600', fontSize: 18, color: '#1A1A1A' }} />
         <Appbar.Action icon={() => null} /> 
      </Appbar.Header>

      <View style={styles.container}>
         
         <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setCreateVisible(true)}
            activeOpacity={0.9}
         >
            <Feather name="plus" size={20} color="#FFF" />
            <Text style={styles.addButtonText}>Novo Espaço</Text>
         </TouchableOpacity>

         <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            
            <Card style={styles.calendarCard}>
                <Card.Content style={{ padding: 0 }}>
                    <Calendar
                        onDayPress={(day: DateData) => setSelectedDate(selectedDate === day.dateString ? null : day.dateString)}
                        markedDates={{
                            ...markedDates,
                            ...(selectedDate && {
                                [selectedDate]: { 
                                    selected: true, 
                                    selectedColor: '#0095FF', 
                                    marked: markedDates[selectedDate]?.marked 
                                }
                            })
                        }}
                        theme={{
                            todayTextColor: '#0095FF',
                            arrowColor: '#0095FF',
                            selectedDayBackgroundColor: '#0095FF',
                            dotColor: '#0095FF',
                            textDayFontWeight: '500',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '500',
                        }}
                    />
                </Card.Content>
            </Card>
            
            <Text style={styles.sectionTitle}>
                {selectedDate 
                    ? `Reservas para ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}` 
                    : 'Todos os Espaços'}
            </Text>

            {partyRooms.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={{ color: '#8E8E93' }}>Nenhum espaço cadastrado.</Text>
                </View>
            )}

            {partyRooms.map((room) => {
                const allMatches = [...room.description.matchAll(/\[RESERVADO_EM:(.*?)\]\[USER_ID:(.*?)\]/g)];
                const reservationsForDate = selectedDate 
                    ? allMatches.filter(m => m[1] === selectedDate)
                    : allMatches;
                
                // Verifica se há reservas no geral para habilitar/desabilitar o botão Liberar
                const hasAnyReservation = allMatches.length > 0;

                const cleanDesc = room.description.replace(/\[.*?\]/g, '').trim();
                
                return (
                    <Card key={room.id} style={styles.roomCard}>
                        <View style={styles.cardContent}>
                            
                            <View style={styles.cardHeaderRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <View style={styles.iconBox}>
                                        <Feather name="home" size={20} color="#0095FF" />
                                    </View>
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={styles.roomTitle} numberOfLines={1}>{room.name}</Text>
                                        <Text style={styles.roomCapacity}>Capacidade: {room.capacity} pessoas</Text>
                                    </View>
                                </View>
                                
                                <Chip 
                                    style={{ backgroundColor: '#E3F2FD', height: 34, alignItems: 'center', justifyContent: 'center' }} 
                                    textStyle={{ color: '#0095FF', fontSize: 11, fontWeight: 'bold', lineHeight: 14, textAlignVertical: 'center' }}
                                >
                                    {reservationsForDate.length > 0 ? `${reservationsForDate.length} reserva(s)` : 'Disponível'}
                                </Chip>
                            </View>

                            {cleanDesc ? (
                                <Text style={styles.roomDesc} numberOfLines={2}>{cleanDesc}</Text>
                            ) : null}
                            
                            <Divider style={{ marginVertical: 12, backgroundColor: '#F0F0F0' }} />

                            {selectedDate && reservationsForDate.length > 0 && (
                                <View style={styles.reservationsList}>
                                    <Text style={styles.reservationsTitle}>Quem reservou hoje:</Text>
                                    {reservationsForDate.map((match, i) => (
                                        <View key={i} style={styles.reservationItem}>
                                            <Feather name="user" size={14} color="#666" />
                                            <Text style={styles.reservationText}>
                                                {userCache[match[2]] || 'Carregando nome...'}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <View style={styles.actionButtons}>
                                <Button 
                                    mode="contained" 
                                    onPress={() => handleReserve(room)}
                                    style={[styles.actionBtn, { backgroundColor: '#0095FF', flex: 1 }]}
                                    contentStyle={{ height: 40, justifyContent: 'center', alignItems: 'center' }}
                                    labelStyle={{ fontSize: 12, fontWeight: '600', marginVertical: 0 }}
                                    compact
                                >
                                    {selectedDate ? 'Reservar Dia' : 'Reservar'}
                                </Button>

                                <Button 
                                    mode="outlined" 
                                    onPress={() => handleClearReservation(room)}
                                    // DESABILITA SE NÃO TIVER NENHUMA RESERVA
                                    disabled={!hasAnyReservation || loading}
                                    style={[
                                      styles.actionBtn, 
                                      { 
                                        borderColor: hasAnyReservation ? '#0095FF' : '#E0E0E0', 
                                        flex: 1 
                                      }
                                    ]}
                                    contentStyle={{ height: 40, justifyContent: 'center', alignItems: 'center' }}
                                    textColor={hasAnyReservation ? "#0095FF" : "#A0A0A0"}
                                    labelStyle={{ fontSize: 12, fontWeight: '600', marginVertical: 0 }}
                                    compact
                                >
                                    Liberar
                                </Button>

                                <IconButton 
                                    icon="delete-outline" 
                                    iconColor="#FF3B30" 
                                    size={22} 
                                    onPress={() => { setRoomToDelete(room); setDeleteVisible(true); }}
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
                <Dialog.Title style={{ color: '#1A1A1A', fontWeight: 'bold', fontSize: 18 }}>Novo Espaço</Dialog.Title>
                <Dialog.Content>
                    <TextInput label="Nome" value={newName} onChangeText={setNewName} mode="outlined" style={styles.modalInput} outlineColor="#E0E0E0" activeOutlineColor="#0095FF"/>
                    <TextInput label="Capacidade" value={newCapacity} onChangeText={setNewCapacity} keyboardType="number-pad" mode="outlined" style={styles.modalInput} outlineColor="#E0E0E0" activeOutlineColor="#0095FF"/>
                    <TextInput label="Descrição (Opcional)" value={newDescription} onChangeText={setNewDescription} multiline mode="outlined" style={styles.modalInput} outlineColor="#E0E0E0" activeOutlineColor="#0095FF"/>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setCreateVisible(false)} textColor="#666">Cancelar</Button>
                    <Button onPress={handleCreateRoom} loading={creating} textColor="#0095FF" labelStyle={{ fontWeight: 'bold' }}>Criar</Button>
                </Dialog.Actions>
            </Dialog>

            <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)} style={{ backgroundColor: '#fff', borderRadius: 16 }}>
                <Dialog.Title style={{ color: '#FF3B30', fontSize: 18 }}>Excluir Espaço?</Dialog.Title>
                <Dialog.Content>
                    <Text variant="bodyMedium" style={{ color: '#333' }}>
                        Tem certeza que deseja excluir "{roomToDelete?.name}"? Essa ação não pode ser desfeita.
                    </Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setDeleteVisible(false)} textColor="#666">Cancelar</Button>
                    <Button onPress={handleDeleteRoom} loading={deleting} textColor="#FF3B30" labelStyle={{ fontWeight: 'bold' }}>Excluir</Button>
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

  calendarCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 24
  },
  
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
    marginBottom: 12
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
  roomDesc: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginTop: 4
  },
  
  reservationsList: {
    backgroundColor: '#F5F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  reservationsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0095FF',
    marginBottom: 6
  },
  reservationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  reservationText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6
  },

  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
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