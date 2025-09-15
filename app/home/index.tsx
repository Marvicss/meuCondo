import BottomMenu from '@/components/BottomMenu';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- DEFINIÇÃO DE TIPOS (sem mudanças) ---
type DecodedToken = { userId: string; email: string; userType: string; };
type Customer = { id: string; fullName: string; username: string; email: string; phoneNumber: string; cpf: string; userType: string; createdAt: string; };
type News = { id: string; condominiumId: string; message: string; type: string; createdAt: string; };
type PartyRoom = { id: string; name: string; description: string; capacity: number; available: boolean; condominiumId: string; createdAt: string; updatedAt: string; };

const Home = () => {
  const theme = useTheme();
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

  // Simulação de votações (adicione sua lógica real depois)
  const votacoes = [
    {
      id: '1',
      title: 'Aprovar orçamento da reforma da fachada',
      periodo: '10/04 a 15/04',
      descricao: 'Descrição'
    },
    {
      id: '2',
      title: 'Aprovar orçamento da reforma da fachada',
      periodo: '10/04 a 15/04',
      descricao: 'Descrição'
    }
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Topo: Usuário */}
        <View style={styles.userRow}>
          <Feather name="user" size={28} color={theme.colors.onSurface} />
          <Text style={[styles.userName, { color: theme.colors.onSurface }]}>{user?.fullName || 'Bem-vindo(a)!'}</Text>
        </View>

        {/* Aviso em destaque */}
        <View style={[styles.newsCard, { backgroundColor: '#0099FF' }]}>
          <Text style={[styles.newsTitle, { color: '#fff' }]}>{latestNews?.message || 'Nenhum aviso disponível'}</Text>
          <Text style={[styles.newsDate, { color: '#fff' }]}>
            {latestNews ? `Publicado em ${new Date(latestNews.createdAt).toLocaleDateString()}` : ''}
          </Text>
          <TouchableOpacity onPress={() => router.push('/notice')}>
            <Text style={[styles.newsLink, { color: '#fff' }]}>Ver mais avisos</Text>
          </TouchableOpacity>
        </View>

        {/* Próxima reserva agendada */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Próxima reserva agendada</Text>
        <FlatList
          data={partyRooms.filter(r => !r.available)}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
          ListEmptyComponent={
            <View style={[styles.reservaCard, { backgroundColor: theme.colors.elevation?.level1 || theme.colors.surface }]}>
              <Text style={[styles.reservaCardTitle, { color: theme.colors.onSurface }]}>Nenhuma reserva futura encontrada</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.reservaCard, { backgroundColor: theme.colors.elevation?.level1 || theme.colors.surface }]}>
              <Text style={[styles.reservaCardTitle, { color: theme.colors.onSurface }]}>{item.name}</Text>
            </View>
          )}
        />

        {/* Próximas votações */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Próximas votações</Text>
        {votacoes.map(v => (
          <View key={v.id} style={[styles.votacaoCard, { backgroundColor: theme.colors.elevation?.level1 || theme.colors.surface, borderTopColor: '#0099FF' }]}>
            <Text style={[styles.votacaoTitle, { color: theme.colors.onSurface }]}>{v.title}</Text>
            <Text style={[styles.votacaoPeriodo, { color: theme.colors.onSurface }]}>{`Período de votação: ${v.periodo}`}</Text>
            <Text style={[styles.votacaoDescricao, { color: theme.colors.onSurface }]}>{v.descricao}</Text>
          </View>
        ))}

      </ScrollView>
      <BottomMenu />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 8,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#222',
  },
  newsCard: {
    backgroundColor: '#0099FF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
  },
  newsTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  newsDate: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  newsLink: {
    color: '#fff',
    textAlign: 'right',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 10,
    color: '#222',
  },
  reservaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: 180,
    marginRight: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    marginBottom: 8,
  },
  reservaCardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  votacaoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderTopWidth: 4,
    borderTopColor: '#0099FF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  votacaoTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginBottom: 4,
  },
  votacaoPeriodo: {
    fontSize: 13,
    color: '#222',
    marginBottom: 2,
  },
  votacaoDescricao: {
    fontSize: 13,
    color: '#444',
  },
});

export default Home;