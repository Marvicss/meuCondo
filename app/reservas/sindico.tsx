import CustomHeader from '@/components/CustomHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Appbar, Button, Card, Chip, Dialog, Divider, Portal, Text, TextInput, useTheme } from 'react-native-paper';
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
interface DecodedToken { userId: string; email: string; userType: string; iat: number; exp: number; }

export default function SindicoScreen() {
  const theme = useTheme();

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
        const res = await api.get<any[]>('/condominiums');
        list = Array.isArray(res.data) ? res.data : [];
      } catch (err: any) {
        if (err?.response?.status === 404) {
          try {
            const res2 = await api.get<any[]>('/condominiums/user');
            list = Array.isArray(res2.data) ? res2.data : [];
          } catch {
            return null;
          }
        } else {
          return null;
        }
      }
      return list.length > 0 ? String(list[0].id) : null;
    } catch {
      return null;
    }
  }, []);

  const handleCreateRoom = async () => {
    if (!newName.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome do espaço.');
      return;
    }
    if (!newCapacity.trim() || isNaN(Number(newCapacity))) {
      Alert.alert('Campo obrigatório', 'Informe a capacidade (número).');
      return;
    }
    const capacityNum = Number(newCapacity);
    if (capacityNum < 1) {
      Alert.alert('Capacidade inválida', 'A capacidade deve ser no mínimo 1 pessoa.');
      return;
    }
    if (capacityNum > 500) {
      Alert.alert('Capacidade inválida', 'A capacidade máxima é de 500 pessoas. Para espaços maiores, entre em contato com o síndico.');
      return;
    }
    const condoId = await ensureCondominiumId();
    if (!condoId) {
      Alert.alert('Condomínio não identificado', 'Não foi possível determinar o condomínio do usuário.');
      return;
    }
    try {
      setCreating(true);
      const imageSeed = `room-${Math.floor(Math.random()*1e9)}`;
      await api.post('/partyrooms/', {
        name: newName.trim(),
        capacity: Number(newCapacity),
        description: `${newDescription.trim()} [IMG_SEED:${imageSeed}]`,
        available: true,
        condominiumId: condoId,
      });
      Alert.alert('Sucesso', 'Espaço cadastrado.');
      setCreateVisible(false);
      setNewName('');
      setNewCapacity('');
      setNewDescription('');
      await fetchAllData();
    } catch (error: any) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || (status ? `Erro ${status}` : 'Não foi possível cadastrar.');
      Alert.alert('Erro', msg);
    } finally {
      setCreating(false);
    }
  };
  const openDeleteDialog = (room: PartyRoom) => {
    setRoomToDelete(room);
    setDeleteVisible(true);
  };
  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/partyrooms/${roomToDelete.id}`);
      Alert.alert('Sucesso', 'Espaço excluído.');
      setDeleteVisible(false);
      setRoomToDelete(null);
      await fetchAllData();
    } catch (error: any) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || (status ? `Erro ${status}` : 'Não foi possível excluir.');
      Alert.alert('Erro', msg);
    } finally {
      setDeleting(false);
    }
  };

  // Usamos useCallback para otimizar e quebrar o loop infinito
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Autenticação necessária", "Por favor, faça o login para acessar esta área.");
        setLoading(false);
        return;
      }
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setCurrentUserId(decoded.userId);
      } catch {}

      const roomsResponse = await api.get('/partyrooms/', {
      // headers removidos: usamos o interceptor para anexar o token
      });
      const rooms: PartyRoom[] = roomsResponse.data;
      
      const newUsers: UserCache = {};
      const newMarkedDates: MarkedDates = {};
      
      await Promise.all(rooms.map(async (room) => {
        const match = room.description.match(/\[RESERVADO_EM:(.*?)\]\[USER_ID:(.*?)\]/);
        if (match && match[1] && match[2]) {
          const date = match[1];
          const userId = match[2];
          
          newMarkedDates[date] = { marked: true, dotColor: theme.colors.primary };

          if (!userCache[userId]) {
            try {
              const userResponse = await api.get<User>(`/users/${userId}`, {
              // headers removidos: usamos o interceptor para anexar o token
              });
              newUsers[userId] = userResponse.data.fullName;
            } catch (userError) {
              newUsers[userId] = 'Usuário não encontrado';
            }
          }
        }
      }));

      setUserCache(prevState => ({ ...prevState, ...newUsers }));
      setMarkedDates(newMarkedDates);
      setPartyRooms(rooms);

    } catch (error) {
      console.error("Erro na tela Síndico:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
   // CORREÇÃO: Removido 'userCache' da lista de dependências para quebrar o loop.
  }, [theme.colors.primary]); 

  // useFocusEffect chama a função acima toda vez que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );
  
  const handleClearReservation = async (room: PartyRoom) => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
        Alert.alert("Erro de Autenticação", "Sua sessão expirou. Faça o login novamente.");
        return;
    }
    Alert.alert("Liberar Espaço", `Tem certeza que deseja liberar o salão "${room.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, Liberar", style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const originalDescription = room.description.split('[RESERVADO_EM:')[0].trim();
              await api.put( `/partyrooms/${room.id}`,
                { ...room, available: true, description: originalDescription }
              );
              Alert.alert("Sucesso", "O espaço foi liberado.");
              await fetchAllData();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível liberar o espaço.");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReserve = async (room: PartyRoom) => {
    if (!selectedDate) {
      Alert.alert('Selecione uma data', 'Escolha uma data no calendário antes de reservar.');
      return;
    }
    const token = await AsyncStorage.getItem('token');
    if (!token || !currentUserId) {
      Alert.alert('Erro de Sessão', 'Faça login novamente para continuar.');
      return;
    }

    // Verifica quantas pessoas já reservaram para esta data
    const reservationsForDate = room.description.match(new RegExp(`\\[RESERVADO_EM:${selectedDate}\\]`, 'g'));
    const currentReservations = reservationsForDate ? reservationsForDate.length : 0;
    
    if (currentReservations >= room.capacity) {
      Alert.alert(
        'Capacidade Esgotada', 
        `O espaço "${room.name}" já atingiu sua capacidade máxima (${room.capacity} pessoas) para esta data.`
      );
      return;
    }

    try {
      setLoading(true);
      const baseDescription = room.description.split('[RESERVADO_EM:')[0].trim();
      // Adiciona nova reserva mantendo as anteriores
      const newDescription = `${room.description} [RESERVADO_EM:${selectedDate}][USER_ID:${currentUserId}]`;
      const isFullyBooked = (currentReservations + 1) >= room.capacity;
      
      await api.put(`/partyrooms/${room.id}`, { 
        ...room, 
        available: !isFullyBooked, 
        description: newDescription 
      });
      
      const vagasRestantes = room.capacity - (currentReservations + 1);
      Alert.alert(
        'Sucesso', 
        `Espaço reservado para ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-br')}.\n${vagasRestantes > 0 ? `Vagas restantes: ${vagasRestantes}` : 'Capacidade esgotada!'}`
      );
      await fetchAllData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reservar o espaço.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    // Exibir todos os espaços; o status reservado é mostrado por cartão.
    return partyRooms;
  }, [selectedDate, partyRooms]);


  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Carregando dados...</Text>
      </View>
    );
  }

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CustomHeader mode="center-aligned" style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Gerenciar Espaços" titleStyle={{ color: theme.colors.onSurface }}/>
        <Appbar.Action icon="plus" onPress={() => setCreateVisible(true)} />
      </CustomHeader>
      <Portal>
        <Dialog visible={createVisible} onDismiss={() => setCreateVisible(false)}>
          <Dialog.Title>Cadastrar Espaço</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nome do Espaço"
              mode="outlined"
              value={newName}
              onChangeText={setNewName}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Capacidade (1 a 500 pessoas)"
              mode="outlined"
              keyboardType="number-pad"
              value={newCapacity}
              onChangeText={setNewCapacity}
              placeholder="Ex: 50"
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Descrição"
              mode="outlined"
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateVisible(false)}>Cancelar</Button>
            <Button mode="contained" onPress={handleCreateRoom} loading={creating} disabled={creating}>
              Cadastrar
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)}>
          <Dialog.Title>Excluir Espaço</Dialog.Title>
          <Dialog.Content>
            <Text>Tem certeza que deseja excluir "{roomToDelete?.name}"? Esta ação é permanente.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteVisible(false)}>Cancelar</Button>
            <Button mode="contained" buttonColor={theme.colors.error} loading={deleting} onPress={handleDeleteRoom}>
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView contentContainerStyle={styles.container}>
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Card.Title title="Calendário de Reservas" titleStyle={{ color: theme.colors.onSurface }}/>
          <Calendar
            onDayPress={(day: DateData) => {
              setSelectedDate(selectedDate === day.dateString ? null : day.dateString);
            }}
            markedDates={{
              ...markedDates,
              ...(selectedDate && {
                [selectedDate]: { ...(markedDates[selectedDate] || {}), selected: true, selectedColor: theme.colors.primaryContainer },
              })
            }}
            theme={{
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.onSurfaceVariant,
                dayTextColor: theme.colors.onSurface,
                todayTextColor: theme.colors.primary,
                monthTextColor: theme.colors.onSurface,
                arrowColor: theme.colors.primary,
            }}
          />
        </Card>

        <Text variant="headlineSmall" style={{ marginTop: 16, color: theme.colors.onBackground }}>
          {selectedDate ? `Reservas para ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-br')}` : 'Todos os Espaços'}
        </Text>

        {filteredRooms.length === 0 && <Text style={{textAlign: 'center', padding: 20, color: theme.colors.onSurfaceVariant}}>Nenhum espaço para mostrar.</Text>}

        {filteredRooms.map((room) => {
          // Busca TODAS as reservas (pode haver múltiplas)
          const allMatches = [...room.description.matchAll(/\[RESERVADO_EM:(.*?)\]\[USER_ID:(.*?)\]/g)];
          const hasReservations = allMatches.length > 0;
          const reservationsForSelectedDate = selectedDate 
            ? allMatches.filter(m => m[1] === selectedDate)
            : allMatches;
          
          // Gera URL de imagem temática usando Lorem Picsum com IDs curados e testados
          const roomNameLower = room.name.toLowerCase();
          let imageId = '1024'; // padrão - espaço moderno
          
          // IDs testados e validados para cada categoria
          if (roomNameLower.includes('churrasqueira') || roomNameLower.includes('grill')) {
            imageId = '1059'; // área outdoor/natureza
          } else if (roomNameLower.includes('piscina') || roomNameLower.includes('pool')) {
            imageId = '1080'; // água/paisagem
          } else if (roomNameLower.includes('academia') || roomNameLower.includes('gym')) {
            imageId = '1025'; // espaço moderno/estruturado
          } else if (roomNameLower.includes('salão') || roomNameLower.includes('festa') || roomNameLower.includes('party')) {
            imageId = '1043'; // ambiente elegante/interior
          } else if (roomNameLower.includes('playground') || roomNameLower.includes('brinquedo')) {
            imageId = '1036'; // espaço aberto/verde
          } else if (roomNameLower.includes('quadra') || roomNameLower.includes('esporte') || roomNameLower.includes('sport')) {
            imageId = '1050'; // espaço amplo/outdoor
          } else if (roomNameLower.includes('sauna')) {
            imageId = '1033'; // ambiente aconchegante
          } else if (roomNameLower.includes('cinema') || roomNameLower.includes('movie')) {
            imageId = '1000'; // espaço escuro/sofisticado
          }
          
          const imageUrl = `https://picsum.photos/id/${imageId}/800/400`;
          
          // Limpa a descrição removendo as tags internas
          const cleanDescription = room.description
            .replace(/\[RESERVADO_EM:.*?\]\[USER_ID:.*?\]/g, '')
            .replace(/\[IMG_SEED:.*?\]/g, '')
            .trim();

          // Calcula vagas disponíveis
          const totalReservations = selectedDate 
            ? allMatches.filter(m => m[1] === selectedDate).length 
            : 0;
          const vagasDisponiveis = room.capacity - totalReservations;
          const isFullyBooked = vagasDisponiveis <= 0;

          return (
            <Card key={room.id} style={{ backgroundColor: theme.colors.surface, marginTop: 16 }}>
              <Card.Cover source={{ uri: imageUrl }} />
              <Card.Title
                title={room.name}
                subtitle={`Capacidade: ${room.capacity} pessoas`}
                titleStyle={{ color: theme.colors.onSurface }}
                right={() => (
                  <View style={{ marginRight: 16 }}>
                    <Chip
                      icon={hasReservations ? "account-multiple" : "check-circle"}
                      textStyle={{color: hasReservations ? theme.colors.primary : "#34C759" }}
                      style={{ backgroundColor: hasReservations ? theme.colors.primaryContainer : '#E9F9EE' }}>
                      {hasReservations ? `${allMatches.length} reserva(s)` : "Disponível"}
                    </Chip>
                    {selectedDate && (
                      <Chip
                        icon={isFullyBooked ? "close-circle" : "check-circle"}
                        textStyle={{color: isFullyBooked ? theme.colors.error : "#34C759", fontSize: 11 }}
                        style={{ marginTop: 4, backgroundColor: isFullyBooked ? theme.colors.errorContainer : '#E9F9EE' }}>
                        {isFullyBooked ? "Esgotado" : `${vagasDisponiveis} vaga(s)`}
                      </Chip>
                    )}
                  </View>
                )}
              />
              <Card.Content>
                <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant, marginBottom: 8}}>
                  {cleanDescription}
                </Text>
                {reservationsForSelectedDate.length > 0 && (
                  <>
                    <Divider style={{marginVertical: 10}} />
                    <Text variant="bodyLarge" style={{fontWeight: 'bold', color: theme.colors.onSurface, marginBottom: 8}}>
                      {selectedDate ? 'Reservas para esta data:' : 'Todas as reservas:'}
                    </Text>
                    {reservationsForSelectedDate.map((match, idx) => (
                      <View key={idx} style={{ marginBottom: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: theme.colors.primary }}>
                        <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                          📅 {new Date(match[1] + 'T00:00:00').toLocaleDateString('pt-br')}
                        </Text>
                        <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
                          👤 {userCache[match[2]] || 'Carregando...'}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </Card.Content>
              <Card.Actions style={[styles.rowBetween, { flexWrap: 'wrap' }] }>
                <Button
                  mode="contained"
                  onPress={() => handleClearReservation(room)}
                  disabled={!hasReservations || loading}
                  buttonColor={hasReservations ? theme.colors.errorContainer : undefined}
                  textColor={hasReservations ? theme.colors.onErrorContainer : undefined}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  {hasReservations ? "Liberar Todas" : "Gerenciar"}
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleReserve(room)}
                  disabled={!selectedDate || isFullyBooked || loading}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  {!selectedDate ? 'Selecione data' : isFullyBooked ? 'Esgotado' : `Reservar (${vagasDisponiveis} vagas)`}
                </Button>
                <Button
                  mode="outlined"
                  icon="delete"
                  onPress={() => openDeleteDialog(room)}
                  disabled={loading}
                  textColor={theme.colors.error}
                  style={{ flex: 1 }}
                >
                  Excluir
                </Button>
              </Card.Actions>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
