import BottomMenu from '@/components/BottomMenu';
import CustomHeader from '@/components/CustomHeader';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Appbar, Button, Chip, Dialog, Divider, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

// Configuração do calendário
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
interface DecodedToken { userId: string; email: string; userType: string; }

export default function MoradorScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [partyRooms, setPartyRooms] = useState<PartyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Estados para o Modal de Reserva (Quantidade de Pessoas)
  const [reserveModalVisible, setReserveModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<PartyRoom | null>(null);
  const [guestCount, setGuestCount] = useState('');
  const [reserving, setReserving] = useState(false);
  
  // Busca IDs e Dados
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
      setPartyRooms(roomsResponse.data);

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

  // Função auxiliar para calcular ocupação
  const calculateOccupancy = (roomDescription: string, date: string) => {
    // Regex atualizado para capturar quantidade de convidados [GUESTS:N]
    // Formato esperado: [RESERVADO_EM:YYYY-MM-DD][USER_ID:123][GUESTS:5]
    const regex = /\[RESERVADO_EM:(.*?)\](?:\[USER_ID:.*?\])?(?:\[GUESTS:(\d+)\])?/g;
    const matches = [...roomDescription.matchAll(regex)];
    
    let totalGuests = 0;
    let reservationsCount = 0;

    matches.forEach(match => {
        if (match[1] === date) {
            reservationsCount++;
            // Se tiver o grupo de GUESTS (match[2]), usa ele. Senão, assume 1 pessoa (reserva simples antiga)
            const guests = match[2] ? parseInt(match[2], 10) : 1;
            totalGuests += guests;
        }
    });

    return { totalGuests, reservationsCount };
  };

  const openReserveModal = (room: PartyRoom) => {
      if (!selectedDate) {
          Alert.alert("Selecione uma data", "Clique no calendário para escolher o dia da reserva.");
          return;
      }
      
      const { totalGuests } = calculateOccupancy(room.description, selectedDate);
      
      if (totalGuests >= room.capacity) {
          Alert.alert("Esgotado", "Este espaço já atingiu a capacidade máxima para a data selecionada.");
          return;
      }

      setSelectedRoom(room);
      setGuestCount(''); // Reset input
      setReserveModalVisible(true);
  };

  const handleConfirmReserve = async () => {
      if (!selectedRoom || !selectedDate) return;
      
      const guests = parseInt(guestCount, 10);

      if (isNaN(guests) || guests <= 0) {
          Alert.alert("Inválido", "Por favor, insira uma quantidade válida de pessoas.");
          return;
      }

      const { totalGuests } = calculateOccupancy(selectedRoom.description, selectedDate);
      const vagasRestantes = selectedRoom.capacity - totalGuests;

      if (guests > vagasRestantes) {
          Alert.alert("Capacidade Excedida", `Só restam ${vagasRestantes} vagas para esta data.`);
          return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token || !currentUserId) {
          Alert.alert("Erro", "Sessão inválida.");
          return;
      }

      try {
          setReserving(true);
          
          // Adiciona a nova reserva com a quantidade de convidados
          const newReservationTag = ` [RESERVADO_EM:${selectedDate}][USER_ID:${currentUserId}][GUESTS:${guests}]`;
          const newDesc = selectedRoom.description + newReservationTag;
          
          await api.put(`/partyrooms/${selectedRoom.id}`, {
              ...selectedRoom, description: newDesc
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          setReserveModalVisible(false);
          await fetchAllData();
          Alert.alert("Sucesso", `Reserva confirmada para ${guests} pessoas!`);
      } catch {
          Alert.alert("Erro", "Não foi possível realizar a reserva.");
      } finally {
          setReserving(false);
      }
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
      
      {/* Header Clean - Sem ícones, apenas título */}
      <CustomHeader mode="center-aligned" style={{ backgroundColor: '#F8F9FA', elevation: 0 }}>
         <Appbar.Action icon={() => null} /> 
         <Appbar.Content title="Reservar Espaço" titleStyle={{ fontWeight: '600', fontSize: 18, color: '#1A1A1A' }} />
         <Appbar.Action icon={() => null} /> 
      </CustomHeader>

      <View style={styles.container}>
         <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            
            {/* Calendário Card */}
            <View style={styles.calendarContainer}>
                <Calendar
                    onDayPress={(day: DateData) => setSelectedDate(selectedDate === day.dateString ? null : day.dateString)}
                    markedDates={{
                        ...(selectedDate && {
                            [selectedDate]: { 
                                selected: true, 
                                selectedColor: '#0095FF'
                            }
                        })
                    }}
                    theme={{
                        calendarBackground: '#FFFFFF',
                        textSectionTitleColor: '#8E8E93',
                        dayTextColor: '#333',
                        todayTextColor: '#0095FF',
                        selectedDayBackgroundColor: '#0095FF',
                        selectedDayTextColor: '#FFF',
                        arrowColor: '#0095FF',
                        monthTextColor: '#1A1A1A',
                        textDayFontWeight: '400',
                        textMonthFontWeight: '600',
                    }}
                    style={{ borderRadius: 12 }}
                />
            </View>
            
            {/* Título da Seção */}
            <Text style={styles.sectionTitle}>
                {selectedDate 
                    ? `Disponibilidade para ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}` 
                    : 'Selecione uma data acima'}
            </Text>

            {partyRooms.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={{ color: '#8E8E93' }}>Nenhum espaço disponível.</Text>
                </View>
            )}

            {/* Lista de Espaços */}
            {partyRooms.map((room) => {
                const cleanDesc = room.description.replace(/\[.*?\]/g, '').trim();
                
                // Calcula ocupação baseada na data selecionada
                const { totalGuests } = selectedDate 
                    ? calculateOccupancy(room.description, selectedDate)
                    : { totalGuests: 0 };

                const vagasDisponiveis = room.capacity - totalGuests;
                const isFullyBooked = vagasDisponiveis <= 0;
                
                // Status para o Chip
                let statusLabel = "Disponível";
                let statusColor = "#0095FF";
                let statusBg = "#E3F2FD";

                if (!selectedDate) {
                    statusLabel = "Selecione data";
                    statusColor = "#666";
                    statusBg = "#F5F5F5";
                } else if (isFullyBooked) {
                    statusLabel = "Esgotado";
                    statusColor = "#D32F2F";
                    statusBg = "#FFEBEE";
                } else if (totalGuests > 0) {
                    statusLabel = `${vagasDisponiveis} vagas rest.`;
                }

                return (
                    <View key={room.id} style={styles.roomCard}>
                        <View style={styles.cardContent}>
                            
                            {/* Header do Card */}
                            <View style={styles.cardHeaderRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <View style={styles.iconBox}>
                                        <Feather name="map-pin" size={20} color="#0095FF" />
                                    </View>
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={styles.roomTitle} numberOfLines={1}>{room.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                            <Feather name="users" size={12} color="#8E8E93" style={{ marginRight: 4 }}/>
                                            <Text style={styles.roomCapacity}>Capacidade: {room.capacity}</Text>
                                        </View>
                                    </View>
                                </View>
                                
                                <Chip 
                                    style={{ backgroundColor: statusBg, height: 28, alignItems: 'center', justifyContent: 'center' }} 
                                    textStyle={{ color: statusColor, fontSize: 10, fontWeight: 'bold', lineHeight: 14 }}
                                >
                                    {statusLabel}
                                </Chip>
                            </View>

                            {cleanDesc ? (
                                <Text style={styles.roomDesc} numberOfLines={2}>{cleanDesc}</Text>
                            ) : null}
                            
                            <Divider style={{ marginVertical: 12, backgroundColor: '#F0F0F0' }} />

                            {/* Botão de Ação Único */}
                            <Button 
                                mode="contained" 
                                onPress={() => openReserveModal(room)}
                                disabled={!selectedDate || isFullyBooked || loading}
                                style={[
                                    styles.actionBtn, 
                                    { backgroundColor: (!selectedDate || isFullyBooked) ? '#E0E0E0' : '#0095FF' }
                                ]}
                                labelStyle={{ fontSize: 14, fontWeight: '600', color: (!selectedDate || isFullyBooked) ? '#888' : '#FFF' }}
                                contentStyle={{ height: 45 }}
                            >
                                {isFullyBooked ? 'Esgotado' : 'Reservar Agora'}
                            </Button>

                        </View>
                    </View>
                );
            })}
         </ScrollView>

         {/* MODAL DE RESERVA (QUANTIDADE DE PESSOAS) */}
         <Portal>
            <Dialog visible={reserveModalVisible} onDismiss={() => setReserveModalVisible(false)} style={{ backgroundColor: '#FFF', borderRadius: 16 }}>
                <Dialog.Title style={{ textAlign: 'center', fontWeight: '600', color: '#1A1A1A', fontSize: 18 }}>
                    Confirmar Reserva
                </Dialog.Title>
                <Dialog.Content>
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 }}>
                            Reserva do espaço
                        </Text>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#0095FF', textAlign: 'center', marginTop: 4 }}>
                            {selectedRoom?.name}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginTop: 4 }}>
                            Para o dia {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                        </Text>
                    </View>
                    
                    <TextInput
                        label="Quantidade de Pessoas"
                        mode="outlined"
                        keyboardType="number-pad"
                        value={guestCount}
                        onChangeText={setGuestCount}
                        style={{ backgroundColor: '#FFF', marginBottom: 8 }}
                        outlineColor="#E0E0E0"
                        activeOutlineColor="#0095FF"
                        placeholder="Ex: 10"
                    />
                    
                    {/* Info de vagas restantes no modal */}
                    {selectedRoom && selectedDate && (
                         <Text style={{ fontSize: 12, color: '#0095FF', textAlign: 'right' }}>
                             Vagas disponíveis: {selectedRoom.capacity - calculateOccupancy(selectedRoom.description, selectedDate).totalGuests}
                         </Text>
                    )}
                </Dialog.Content>
                <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 }}>
                    <Button 
                        mode="outlined" 
                        onPress={() => setReserveModalVisible(false)} 
                        textColor="#666" 
                        style={{ borderColor: '#E0E0E0', flex: 1, marginRight: 8 }}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        mode="contained" 
                        onPress={handleConfirmReserve} 
                        loading={reserving} 
                        disabled={reserving} 
                        buttonColor="#0095FF"
                        style={{ flex: 1 }}
                    >
                        Confirmar
                    </Button>
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
  
  // Calendário
  calendarContainer: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  
  sectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 12,
    marginLeft: 4
  },
  
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12
  },

  // Card Espaço Clean
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden'
  },
  cardContent: {
    padding: 16
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  iconBox: {
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#E3F2FD', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '600', 
    color: '#1A1A1A'
  },
  roomCapacity: {
    fontSize: 12,
    color: '#8E8E93',
  },
  roomDesc: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginTop: 4
  },
  
  actionBtn: {
    borderRadius: 30, 
    justifyContent: 'center',
    marginTop: 4
  },
});