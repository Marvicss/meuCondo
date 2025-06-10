import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import api from '../../services/api';
import { jwtDecode } from 'jwt-decode';

// Interfaces
interface PartyRoom { id: string; name: string; description: string; capacity: number; available: boolean; condominiumId: string; }
interface DecodedToken { userId: string; email: string; userType: string; iat: number; exp: number; }

// Função Helper
const getReservationDate = (description: string): string | null => {
  const match = description.match(/\[RESERVADO_EM:(.*?)\]/);
  return match ? match[1] : null;
};

export default function MoradorScreen() {
  const theme = useTheme();

  const [partyRooms, setPartyRooms] = useState<PartyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null);

  // useFocusEffect para buscar os dados com o token real sempre que a tela é focada
  useFocusEffect(
    useCallback(() => {
      const initialize = async () => {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            Alert.alert("Autenticação necessária", "Por favor, faça o login para acessar esta área.");
            setLoading(false);
            // Aqui, no futuro, você pode redirecionar para a tela de login
            return;
          }

          const decoded = jwtDecode<DecodedToken>(token);
          setUserInfo(decoded);
          
          const response = await api.get('/partyrooms/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPartyRooms(response.data);

        } catch (error) {
          console.error("Erro na tela Morador:", error);
          Alert.alert("Erro", "Não foi possível carregar os dados.");
        } finally {
          setLoading(false);
        }
      };

      initialize();
    }, [])
  );

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleReserve = async (room: PartyRoom) => {
    const token = await AsyncStorage.getItem('token');
    if (!userInfo || !token) {
      Alert.alert("Erro de Sessão", "Sua sessão expirou ou é inválida. Por favor, faça o login novamente.");
      return;
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
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert("Sucesso!", "Salão reservado com sucesso.");
              const updatedRooms = partyRooms.map(r => r.id === room.id ? { ...r, available: false, description: newDescription } : r);
              setPartyRooms(updatedRooms);
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