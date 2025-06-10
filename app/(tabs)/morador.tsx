import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Text,
  TextInput,
  Chip,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

// Interface para o Salão de Festas
interface PartyRoom {
  id: string;
  name: string;
  description: string;
  capacity: number;
  available: boolean;
  condominiumId: string;
}

// Interface para o conteúdo do token decodificado
interface DecodedToken {
  userId: string;
  email: string;
  userType: string;
  iat: number;
  exp: number;
}

// Função Helper para extrair a data da reserva da descrição
const getReservationDate = (description: string): string | null => {
  const match = description.match(/\[RESERVADO_EM:(.*?)\]/);
  return match ? match[1] : null;
};

export default function MoradorScreen() {
  const theme = useTheme();

  // ===================================================================================
  // COLE SEU TOKEN MAIS RECENTE AQUI.
  const tokenTemporario = "...";
  // ===================================================================================

  const [partyRooms, setPartyRooms] = useState<PartyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const decoded = jwtDecode<DecodedToken>(tokenTemporario);
        setUserInfo(decoded);
      } catch (error) {
        console.error("Token inválido ou ausente. Não foi possível decodificar.", error);
      }
      
      try {
        setLoading(true);
        const response = await api.get('/partyrooms/', {
          headers: { Authorization: `Bearer ${tokenTemporario}` },
        });
        setPartyRooms(response.data);
      } catch (error) {
        console.error("Erro ao buscar salões:", error);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleReserve = async (room: PartyRoom) => {
    // VERIFICAÇÃO DE SEGURANÇA ADICIONADA
    if (!userInfo || !userInfo.userId) {
      Alert.alert(
        "Erro de Usuário",
        "Não foi possível identificar o usuário logado. Verifique se o seu token no código é válido e não está expirado."
      );
      console.log("handleReserve parou porque userInfo é:", userInfo);
      return; // Para a execução aqui
    }

    const formattedDate = date.toISOString().split('T')[0];
    const userId = userInfo.userId;

    Alert.alert(
      "Confirmar Reserva",
      `Deseja reservar o salão "${room.name}" para o dia ${date.toLocaleDateString('pt-BR')}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setLoading(true);
            try {
              const newDescription = `${room.description.split('[RESERVADO_EM:')[0].trim()} [RESERVADO_EM:${formattedDate}][USER_ID:${userId}]`;
              await api.put(
                `/partyrooms/${room.id}`,
                { ...room, available: false, description: newDescription },
                { headers: { Authorization: `Bearer ${tokenTemporario}` } }
              );
              Alert.alert("Sucesso!", "Salão reservado com sucesso.");
              setPartyRooms(rooms => rooms.map(r => r.id === room.id ? { ...r, available: false, description: newDescription } : r));
            } catch (error) {
              console.error("Erro ao reservar:", error);
              Alert.alert("Erro", "Não foi possível completar a reserva.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header mode="center-aligned">
        <Appbar.Content title="Reservar Espaços" />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Card.Content style={styles.form}>
            <Text variant='titleMedium'>Selecione uma data para a reserva</Text>
            <Pressable onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <TextInput label="Data da Reserva" value={date.toLocaleDateString('pt-BR')} mode="outlined" left={<TextInput.Icon icon="calendar" />} editable={false} />
              </View>
            </Pressable>
          </Card.Content>
        </Card>
        {showDatePicker && (<DateTimePicker mode="date" display="default" value={date} onChange={onChangeDate} />)}
        {partyRooms.map((room) => {
          const reservedDate = getReservationDate(room.description);
          const selectedDateString = date.toISOString().split('T')[0];
          const isAvailableOnSelectedDate = room.available || (reservedDate !== selectedDateString);

          return (
            <Card key={room.id} style={{ backgroundColor: theme.colors.surface, marginTop: 16 }}>
              <Card.Cover source={{ uri: `https://picsum.photos/seed/${room.id}/700/300` }} />
              <Card.Title
                title={room.name}
                subtitle={`Capacidade: ${room.capacity} pessoas`}
                right={() => (
                  <Chip icon={isAvailableOnSelectedDate ? "check-circle" : "close-circle"}
                    selectedColor={isAvailableOnSelectedDate ? "#34C759" : "#FF3B30"}
                    style={{ marginRight: 16, backgroundColor: isAvailableOnSelectedDate ? '#E9F9EE' : '#FFEBEE' }}>
                    {isAvailableOnSelectedDate ? "Disponível" : "Reservado"}
                  </Chip>
                )}
              />
              <Card.Content>
                <Text variant="bodyMedium">{room.description.split('[RESERVADO_EM:')[0].trim()}</Text>
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() => handleReserve(room)}
                  disabled={!isAvailableOnSelectedDate || loading}>
                  {loading ? 'Aguarde...' : 'Reservar para esta data'}
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
  form: { gap: 10 },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});