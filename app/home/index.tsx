import BottomMenu from '@/components/BottomMenu';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

// --- TIPAGENS ---
type DecodedToken = { userId: string; email: string; userType: string; };
type Customer = { id: string; fullName: string; username: string; email: string; phoneNumber: string; cpf: string; userType: string; createdAt: string; };
type News = { id: string; condominiumId: string; message: string; type: string; createdAt: string; };
type PartyRoom = { id: string; name: string; description: string; capacity: number; available: boolean; condominiumId: string; createdAt: string; updatedAt: string; };
type Votacao = { id: string; title: string; startDate: string; endDate: string; description: string; condominiumId: string; createdAt: string; };

const Home = () => {
  const theme = useTheme();
  const router = useRouter();

  const [user, setUser] = useState<Customer | null>(null);
  const [latestNews, setLatestNews] = useState<News | null>(null);
  const [partyRooms, setPartyRooms] = useState<PartyRoom[]>([]);
  const [votacoes, setVotacoes] = useState<Votacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [condominiumId, setCondominiumId] = useState<string | null>(null);

  const ensureCondominiumId = useCallback(
    async (token: string, apartmentId?: string | null) => {
      if (!token || !apartmentId) return null;
      try {
        const aptResp = await api.get(`/apartments/${apartmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const condoId =
          aptResp?.data?.condominiumId ||
          aptResp?.data?.condominium?.id;
        return condoId ? String(condoId) : null;
      } catch {
        return null;
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const fetchData = async () => {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem('token');
            if (!token) {
              router.replace('/login');
              return;
            }

          const decoded: DecodedToken = jwtDecode(token);

            // usuário
          let apartmentId: string | null = null;
          try {
            const respUser = await api.get(`/users/${decoded.userId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const dataUser = respUser.data ?? null;
            apartmentId = dataUser?.apartmentId || null;
            if (alive) setUser(dataUser);
          } catch {
            if (alive) setUser(null);
          }

          // condomínio via apartmentId
          const condoId =
            condominiumId ??
            (await ensureCondominiumId(token, apartmentId));
          if (!condoId) {
            if (alive) {
              Alert.alert('Atenção','Não foi possível identificar o condomínio.');
              setLatestNews(null);
              setPartyRooms([]);
              setVotacoes([]);
            }
            return;
          }
          if (!condominiumId) setCondominiumId(condoId);

          // notícias
          try {
            const newsResp = await api.get(`/news/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const arr = Array.isArray(newsResp.data) ? newsResp.data : [];
            const filtered = arr.filter(n => String(n.condominiumId) === condoId);
            const sorted = filtered.sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            if (alive) setLatestNews(sorted[0] || null);
          } catch {
            if (alive) setLatestNews(null);
          }

          // salões
          try {
            const prResp = await api.get(`/partyrooms/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const arr = Array.isArray(prResp.data) ? prResp.data : [];
            const filtered = arr.filter(r => String(r.condominiumId) === condoId);
            if (alive) setPartyRooms(filtered);
          } catch {
            if (alive) setPartyRooms([]);
          }

          // votações
          try {
            const pollsResp = await api.get(`/polls/condominium/${condoId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const raw = Array.isArray(pollsResp.data) ? pollsResp.data : [];
            const mapped: Votacao[] = raw.map((p: any) => ({
              id: String(p.id),
              title: p.title ?? 'Votação',
              description: p.description ?? '',
              startDate: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
              endDate: p.endsAt ? new Date(p.endsAt).toISOString() : new Date().toISOString(),
              condominiumId: p.condominiumId || condoId,
              createdAt: p.createdAt || new Date().toISOString(),
            }));
            const now = new Date();
            const active = mapped.filter(v => new Date(v.endDate) > now);
            if (alive) setVotacoes(active);
          } catch {
            if (alive) setVotacoes([]);
          }

        } finally {
          if (alive) setLoading(false);
        }
      };
      fetchData();
      return () => { alive = false; };
    }, [ensureCondominiumId, router, condominiumId])
  );

  if (loading) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/profile' as any)}
            accessibilityLabel="Abrir perfil"
          >
            <Feather name="menu" size={28} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

        <View style={[styles.newsCard, { backgroundColor: '#0099FF' }]}>
          <Text style={[styles.newsTitle, { color: '#fff' }]}>{latestNews?.message || 'Nenhum aviso disponível'}</Text>
          <Text style={[styles.newsDate, { color: '#fff' }]}>
            {latestNews ? `Publicado em ${new Date(latestNews.createdAt).toLocaleDateString()}` : ''}
          </Text>
          <TouchableOpacity onPress={() => router.push('/notice')}>
            <Text style={[styles.newsLink, { color: '#fff' }]}>Ver mais avisos</Text>
          </TouchableOpacity>
        </View>

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
    paddingTop: 0,
    paddingBottom: 32,
  },
  headerContainerComSombra: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 80, // Aumentei para o BottomMenu não cobrir o conteúdo
    zIndex: 10, // Garante que a sombra fique sobre o conteúdo
    // Sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
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