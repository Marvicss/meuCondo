import BottomMenu from '@/components/BottomMenu';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

// --- DEFINIÇÃO DE TIPOS (sem mudanças) ---
type DecodedToken = { userId: string; email: string; userType: string; };
type Customer = { id: string; fullName: string; username: string; email: string; phoneNumber: string; cpf: string; userType: string; createdAt: string; };
type News = { id: string; condominiumId: string; message: string; type: string; createdAt: string; };
type PartyRoom = { id: string; name: string; description: string; capacity: number; available: boolean; condominiumId: string; createdAt: string; updatedAt: string; };
// Adicione o tipo para Votação
type Votacao = { 
  id: string; 
  title: string; 
  startDate: string; 
  endDate: string; 
  description: string; 
  condominiumId: string;
  createdAt: string; 
};

const Home = () => {
  const theme = useTheme();
  const router = useRouter();

  const [user, setUser] = useState<Customer | null>(null);
  const [latestNews, setLatestNews] = useState<News | null>(null);
  const [partyRooms, setPartyRooms] = useState<PartyRoom[]>([]);
  const [votacoes, setVotacoes] = useState<Votacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [condominiumId, setCondominiumId] = useState<string | null>(null);

  // Função para garantir que temos o condominiumId
  const ensureCondominiumId = useCallback(async () => {
    // 1) tenta pegar do AsyncStorage
    const storedKeys = ['condominiumId', 'condoId', 'condominioId'];
    for (const key of storedKeys) {
      const val = await AsyncStorage.getItem(key);
      if (val) return val;
    }
    // 2) fallback: busca primeiro condomínio do usuário
    const token = await AsyncStorage.getItem('token');
    if (!token) return null;
    try {
      let list: any[] = [];
      try {
        const res = await api.get<any[]>('/condominiums', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        list = Array.isArray(res.data) ? res.data : [];
      } catch (err: any) {
        if (err?.response?.status === 404) {
          try {
            const res2 = await api.get<any[]>('/condominiums/user', {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            list = Array.isArray(res2.data) ? res2.data : [];
          } catch (innerErr) {
            console.error('Erro ao buscar condomínios:', innerErr);
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

          // Buscar dados individualmente para melhor controle de erros
          const userResponse = await api.get(`/users/${decoded.userId}`);
          setUser(userResponse.data ?? null);

          // Obter condomínio do usuário usando a função auxiliar
          let condoId = condominiumId ?? (await ensureCondominiumId());
          if (!condoId) {
            setLoading(false);
            return;
          }
          if (!condominiumId) setCondominiumId(condoId);

          // Buscar notícias
          try {
            const newsResponse = await api.get('/news/');
            const newsData = newsResponse.data ?? [];
            if (Array.isArray(newsData) && newsData.length > 0) {
              const sortedNews = newsData.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              setLatestNews(sortedNews[0]);
            }
          } catch (newsError) {
            console.error('Erro ao buscar notícias:', newsError);
          }

          // Buscar salões de festas
          try {
            const partyRoomResponse = await api.get('/partyrooms/');
            const partyRoomData = partyRoomResponse.data ?? [];
            setPartyRooms(Array.isArray(partyRoomData) ? partyRoomData : []);
          } catch (partyError) {
            console.error('Erro ao buscar salões:', partyError);
            setPartyRooms([]);
          }

          // Buscar votações usando o endpoint correto
          try {
            const votacoesResponse = await api.get(`/polls/condominium/${condoId}`);
            const raw = Array.isArray(votacoesResponse.data) ? votacoesResponse.data : [];
            
            // Mapear para o formato esperado pela UI
            const mapped: Votacao[] = raw.map((p: any) => ({
              id: String(p.id),
              title: p.title ?? 'Votação',
              description: p.description ?? '',
              startDate: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
              endDate: p.endsAt ? new Date(p.endsAt).toISOString() : new Date().toISOString(),
              condominiumId: p.condominiumId || condoId,
              createdAt: p.createdAt || new Date().toISOString(),
            }));
            
            // Filtrar apenas votações ativas
            const activeVotacoes = mapped.filter(v => {
              const now = new Date();
              const endDate = new Date(v.endDate);
              return endDate > now;
            });
            
            setVotacoes(activeVotacoes);
          } catch (votacoesError: any) {
            console.error('Erro ao buscar votações:', votacoesError?.response?.data || votacoesError?.message);
            setVotacoes([]);
          }
          
        } catch (err: any) {
          console.error('Erro geral:', err);
          Alert.alert("Erro", err?.response?.data?.message || "Falha na comunicação com o servidor.");
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
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Topo: Menu hamburger */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/profile' as any)}
            accessibilityLabel="Abrir perfil"
          >
            <Feather name="menu" size={28} color={theme.colors.onSurface} />
          </TouchableOpacity>
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
        {votacoes.length === 0 ? (
          <View style={[styles.votacaoCard, { backgroundColor: theme.colors.elevation?.level1 || theme.colors.surface, borderTopColor: '#0099FF' }]}>
            <Text style={[styles.votacaoTitle, { color: theme.colors.onSurface }]}>Nenhuma votação disponível</Text>
          </View>
        ) : (
          votacoes.map(v => (
            <View key={v.id} style={[styles.votacaoCard, { backgroundColor: theme.colors.elevation?.level1 || theme.colors.surface, borderTopColor: '#0099FF' }]}>
              <Text style={[styles.votacaoTitle, { color: theme.colors.onSurface }]}>{v.title}</Text>
              <Text style={[styles.votacaoPeriodo, { color: theme.colors.onSurface }]}>
                {`Período de votação: ${new Date(v.startDate).toLocaleDateString()} a ${new Date(v.endDate).toLocaleDateString()}`}
              </Text>
              <Text style={[styles.votacaoDescricao, { color: theme.colors.onSurface }]}>{v.description}</Text>
            </View>
          ))
        )}

        <Button
          mode="contained"
          onPress={() => router.push('/reservas/sindico' as any)}
          style={{ marginTop: 16 }}
        >
          Reservas (Síndico)
        </Button>

        <Button
          mode="contained"
          onPress={() => router.push('/votation/sindico' as any)}
          style={{ marginTop: 16 }}
        >
          Votações (Síndico)
        </Button>

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    justifyContent: 'flex-start',
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
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
