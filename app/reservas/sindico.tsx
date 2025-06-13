import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Appbar, Button, Card, Chip, Divider, Text, useTheme } from 'react-native-paper';
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

export default function SindicoScreen() {
  const theme = useTheme();

  const [partyRooms, setPartyRooms] = useState<PartyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCache, setUserCache] = useState<UserCache>({});
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

      const roomsResponse = await api.get('/partyrooms/', {
        headers: { Authorization: `Bearer ${token}` },
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
                headers: { Authorization: `Bearer ${token}` },
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
                { ...room, available: true, description: originalDescription },
                { headers: { Authorization: `Bearer ${token}` } }
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

  const filteredRooms = useMemo(() => {
    if (!selectedDate) {
      return partyRooms;
    }
    return partyRooms.filter(room => {
      const match = room.description.match(/\[RESERVADO_EM:(.*?)\]/);
      return match && match[1] === selectedDate;
    });
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
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Gerenciar Espaços" titleStyle={{ color: theme.colors.onSurface }}/>
      </Appbar.Header>

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
          const match = room.description.match(/\[RESERVADO_EM:(.*?)\]\[USER_ID:(.*?)\]/);
          const isReserved = !room.available && !!match;

          return (
            <Card key={room.id} style={{ backgroundColor: theme.colors.surface, marginTop: 16 }}>
              <Card.Cover source={{ uri: `https://picsum.photos/seed/${room.id}/700/300` }} />
              <Card.Title
                title={room.name}
                titleStyle={{ color: theme.colors.onSurface }}
                right={() => (
                  <Chip
                    icon={isReserved ? "close-circle" : "check-circle"}
                    textStyle={{color: isReserved ? theme.colors.error : "#34C759" }}
                    style={{ marginRight: 16, backgroundColor: isReserved ? theme.colors.errorContainer : '#E9F9EE' }}>
                    {isReserved ? "Reservado" : "Disponível"}
                  </Chip>
                )}
              />
              <Card.Content>
                {isReserved && match ? (
                  <>
                    <Text variant="bodyLarge" style={{fontWeight: 'bold', color: theme.colors.onSurface}}>Detalhes da Reserva:</Text>
                    <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>Data: {new Date(match[1] + 'T00:00:00').toLocaleDateString('pt-br')}</Text>
                    <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>Reservado por: {userCache[match[2]] || 'Buscando nome...'}</Text>
                    <Divider style={{marginVertical: 10}} />
                  </>
                ) : (
                  <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>{room.description.split('[RESERVADO_EM:')[0].trim()}</Text>
                )}
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() => handleClearReservation(room)}
                  disabled={!isReserved || loading}
                  buttonColor={isReserved ? theme.colors.errorContainer : undefined}
                  textColor={isReserved ? theme.colors.onErrorContainer : undefined}
                >
                  {isReserved ? "Liberar Reserva" : "Gerenciar"}
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
});