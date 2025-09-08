import BottomMenu from '@/components/BottomMenu'; // Assumindo que este é o caminho correto
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Avatar, Button, Card, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- DEFINIÇÃO DE TIPOS (sem mudanças) ---
type DecodedToken = { userId: string; email: string; userType: string; };
type Customer = { id: string; fullName: string; username: string; email: string; phoneNumber: string; cpf: string; userType: string; createdAt: string; };
type News = { id: string; condominiumId: string; message: string; type: string; createdAt: string; };
type PartyRoom = { id: string; name: string; description: string; capacity: number; available: boolean; condominiumId: string; createdAt: string; updatedAt: string; };

const Home = () => {
  const theme = useTheme(); // Puxa o tema (claro ou escuro)
  const router = useRouter();
  
  const [user, setUser] = useState<Customer | null>(null);
  const [latestNews, setLatestNews] = useState<News | null>(null);
  const [partyRooms, setPartyRooms] = useState<PartyRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect para buscar todos os dados quando a tela é focada
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            router.replace('/login');
            return;
          }

          const decoded: DecodedToken = jwtDecode(token);

          // Usando Promise.all para buscar tudo em paralelo
          const [userResponse, newsResponse, partyRoomResponse] = await Promise.all([
            fetch(`https://meu-condo.vercel.app/users/${decoded.userId}`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`https://meu-condo.vercel.app/news/`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`https://meu-condo.vercel.app/partyrooms/`, { headers: { Authorization: `Bearer ${token}` } })
          ]);

          // Processa as respostas
          const userData = userResponse.ok ? await userResponse.json() : null;
          const newsData = newsResponse.ok ? await newsResponse.json() : [];
          const partyRoomData = partyRoomResponse.ok ? await partyRoomResponse.json() : [];
          
          setUser(userData);
          setPartyRooms(partyRoomData);

          // Pega a notícia mais recente
          if (Array.isArray(newsData) && newsData.length > 0) {
            const sortedNews = newsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setLatestNews(sortedNews[0]);
          }
          
        } catch (err) {
          Alert.alert("Erro", "Falha na comunicação com o servidor.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [router])
  );

  if (loading) {
    return <View style={[styles.centerScreen, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Início" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>

        {/* 1. Informações do usuário */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title
            title={user?.fullName || 'Bem-vindo(a)!'}
            titleStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
            subtitle={user?.userType === 'ADMIN' ? 'Síndico(a)' : 'Morador(a)'}
            subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
            left={(props) => <Avatar.Text {...props} label={user?.fullName ? user.fullName.charAt(0) : '?'} />}
          />
        </Card>

        {/* 2. Último aviso publicado */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>Último Aviso</Text>
            {latestNews ? (
              <>
                <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>{latestNews.message}</Text>
                <Text style={{ color: theme.colors.onSurfaceDisabled, fontSize: 12 }}>
                  Publicado em {new Date(latestNews.createdAt).toLocaleDateString()}
                </Text>
              </>
            ) : (
              <Text style={{ color: theme.colors.onSurfaceDisabled }}>Nenhum aviso disponível</Text>
            )}
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => router.push('/notice')}>Ver todos os avisos</Button>
          </Card.Actions>
        </Card>

        {/* 3. Próximas reservas */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Próximas Reservas</Text>
            {partyRooms && partyRooms.filter(r => !r.available).length > 0 ? (
              partyRooms.filter(r => !r.available).map(item => (
                <View key={item.id} style={styles.reservaItem}>
                  <Text style={{ color: theme.colors.onSurface }}>{item.name}</Text>
                  {/* Aqui poderíamos mostrar a data se estivesse disponível */}
                </View>
              ))
            ) : (
              <Text style={{ color: theme.colors.onSurfaceDisabled, marginTop: 8 }}>Nenhuma reserva futura encontrada</Text>
            )}
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => router.push('../reservas/morador')}>Fazer nova reserva</Button>
          </Card.Actions>
        </Card>

      </ScrollView>

      {/* Bottom Menu */}
      <BottomMenu />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  reservaItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 8
  },
});

export default Home;