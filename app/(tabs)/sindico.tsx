import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Appbar, Button, Card, Text, Chip, useTheme, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import { useFocusEffect } from 'expo-router';
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

  // ===================================================================================
  // COLE SEU TOKEN MAIS RECENTE AQUI.
  const tokenTemporario = "..";
  // ===================================================================================

  const [partyRooms, setPartyRooms] = useState<PartyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCache, setUserCache] = useState<UserCache>({});
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const roomsResponse = await api.get('/partyrooms/', {
        headers: { Authorization: `Bearer ${tokenTemporario}` },
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

          try {
            const userResponse = await api.get<User>(`/users/${userId}`, {
              headers: { Authorization: `Bearer ${tokenTemporario}` },
            });
            newUsers[userId] = userResponse.data.fullName;
          } catch (userError) {
            newUsers[userId] = 'Usuário não encontrado';
          }
        }
      }));

      setUserCache(newUsers);
      setMarkedDates(newMarkedDates);
      setPartyRooms(rooms);

    } catch (error) {
      console.error("Erro geral ao buscar dados:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [tokenTemporario, theme.colors.primary]); // Dependências corrigidas para quebrar o loop

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );
  
  const handleClearReservation = async (room: PartyRoom) => {
    Alert.alert(
      "Liberar Espaço", `Tem certeza que deseja liberar o salão "${room.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, Liberar", style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const originalDescription = room.description.split('[RESERVADO_EM:')[0].trim();
              await api.put( `/partyrooms/${room.id}`,
                { ...room, available: true, description: originalDescription },
                { headers: { Authorization: `Bearer ${tokenTemporario}` } }
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
    if (!selectedDate) return partyRooms;
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
      <Appbar.Header mode="center-aligned">
        <Appbar.Content title="Gerenciar Espaços" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Card.Title title="Calendário de Reservas" />
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
          />
        </Card>

        <Text variant="headlineSmall" style={{ marginTop: 16 }}>
          {selectedDate ? `Reservas para ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-br')}` : 'Todos os Espaços'}
        </Text>

        {filteredRooms.length === 0 && <Text style={{textAlign: 'center', padding: 20}}>Nenhum espaço para mostrar.</Text>}

        {filteredRooms.map((room) => {
          const match = room.description.match(/\[RESERVADO_EM:(.*?)\]\[USER_ID:(.*?)\]/);
          const isReserved = !room.available && !!match;

          return (
            <Card key={room.id} style={{ backgroundColor: theme.colors.surface, marginTop: 16 }}>
              <Card.Cover source={{ uri: `https://picsum.photos/seed/${room.id}/700/300` }} />
              <Card.Title
                title={room.name}
                right={() => (
                  <Chip icon={isReserved ? "close-circle" : "check-circle"}
                    selectedColor={isReserved ? theme.colors.error : "#34C759"}
                    style={{ marginRight: 16, backgroundColor: isReserved ? '#FFEBEE' : '#FFEBEE' }}>
                    {isReserved ? "Reservado" : "Disponível"}
                  </Chip>
                )}
              />
              <Card.Content>
                {isReserved && match ? (
                  <>
                    <Text variant="bodyLarge" style={{fontWeight: 'bold'}}>Detalhes da Reserva:</Text>
                    <Text variant="bodyMedium">Data: {new Date(match[1] + 'T00:00:00').toLocaleDateString('pt-br')}</Text>
                    <Text variant="bodyMedium">Reservado por: {userCache[match[2]] || 'Buscando nome...'}</Text>
                    <Divider style={{marginVertical: 10}} />
                  </>
                ) : (
                  <Text variant="bodyMedium">{room.description.split('[RESERVADO_EM:')[0].trim()}</Text>
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