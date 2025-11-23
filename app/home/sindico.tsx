import BottomMenu from '@/components/BottomMenu';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Divider, Text, useTheme } from 'react-native-paper';
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
        <ActivityIndicator size="large" color="#0099FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
        
        {/* HEADER - Menu Hamburguer MODIFICADO */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/profile' as any)}
            accessibilityLabel="Abrir perfil"
          >
            <Feather name="menu" size={28} color={theme.colors.onSurface} />
          </TouchableOpacity>
          
          {/* Nova View para empilhar o Olá e o Cargo */}
          <View style={{ marginLeft: 16 }}>
              <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                  Olá, {user?.fullName?.split(' ')[0] || 'Morador'}
              </Text>
              
              {/* Texto do Cargo */}
              <Text variant="labelMedium" style={{ color: '#0099FF', fontWeight: 'bold', textTransform: 'uppercase', marginTop: -2 }}>
                  Síndico
              </Text>
          </View>
        </View>

        {/* CARD DE AVISO IMPORTANTE */}
        <View style={[styles.newsCard, { backgroundColor: '#0099FF' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <Text variant="labelMedium" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 4, textTransform: 'uppercase' }}>
                Último Aviso
             </Text>
             <Feather name="bell" size={20} color="#fff" style={{ opacity: 0.8 }} />
          </View>
          
          <Text style={[styles.newsTitle, { color: '#fff' }]}>
             {latestNews?.message || 'Nenhum aviso disponível'}
          </Text>
          
          <Text style={[styles.newsDate, { color: 'rgba(255,255,255,0.9)' }]}>
            {latestNews ? `${new Date(latestNews.createdAt).toLocaleDateString('pt-BR')}` : ''}
          </Text>
          
          <TouchableOpacity onPress={() => router.push('/notice')} style={{ alignSelf: 'flex-end', marginTop: 12 }}>
            <Text style={[styles.newsLink, { color: '#fff' }]}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {/* SEÇÃO DE RESERVAS */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Reservar Espaço</Text>
        <FlatList
          data={partyRooms.filter(r => !r.available)}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 20 }}
          ListEmptyComponent={
            <View style={[styles.emptyStateCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Nenhum espaço disponível.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.reservaCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => router.push('/reservas/morador' as any)} 
            >
              <View style={[styles.iconPlaceholder, { backgroundColor: '#E0F2FF' }]}>
                 <Feather name="calendar" size={24} color="#0099FF" />
              </View>
              <Text style={[styles.reservaCardTitle, { color: theme.colors.onSurface }]}>{item.name}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Disponibilidade</Text>
            </TouchableOpacity>
          )}
        />

        {/* SEÇÃO DE VOTAÇÕES */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, marginTop: 24 }]}>Votações em Aberto</Text>
        {votacoes.length === 0 ? (
          <View style={[styles.emptyStateCard, { backgroundColor: theme.colors.surface, paddingVertical: 24 }]}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Nenhuma votação ativa no momento.</Text>
          </View>
        ) : (
          votacoes.map(v => (
            <TouchableOpacity 
              key={v.id} 
              style={[styles.votacaoCard, { backgroundColor: theme.colors.surface, borderTopColor: '#0099FF' }]}
              onPress={() => router.push('/votation/morador' as any)} 
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                 <Feather name="check-circle" size={20} color="#0099FF" style={{ marginRight: 8 }} />
                 <Text style={[styles.votacaoTitle, { color: theme.colors.onSurface, flex: 1 }]}>{v.title}</Text>
              </View>
              
              <Text style={[styles.votacaoDescricao, { color: theme.colors.onSurfaceVariant }]}>
                 {v.description}
              </Text>
              
              <Divider style={{ marginVertical: 12, backgroundColor: theme.colors.outlineVariant }} />
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                 <Text style={[styles.votacaoPeriodo, { color: theme.colors.outline }]}>
                    Encerra em: {new Date(v.endDate).toLocaleDateString()}
                 </Text>
                 <Text style={{ color: '#0099FF', fontWeight: 'bold', fontSize: 12 }}>Votar Agora</Text>
              </View>
            </TouchableOpacity>
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
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuButton: {
    padding: 4,
    borderRadius: 8,
  },

  // Card de Aviso (Azul)
  newsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#0099FF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  newsTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
    marginTop: 8,
    lineHeight: 24,
  },
  newsDate: {
    fontSize: 12,
  },
  newsLink: {
    fontWeight: '600',
    fontSize: 14,
  },

  // Títulos das Seções
  sectionTitle: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 12,
  },

  // Card Reserva (Horizontal)
  reservaCard: {
    borderRadius: 16,
    padding: 16,
    width: 160,
    marginRight: 0,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  iconPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12
  },
  reservaCardTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },

  // Card Votação (Vertical)
  votacaoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderTopWidth: 4, 
  },
  votacaoTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  votacaoPeriodo: {
    fontSize: 12,
  },
  votacaoDescricao: {
    fontSize: 14,
    lineHeight: 20,
  },

  emptyStateCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderStyle: 'dashed'
  }
});

export default Home;