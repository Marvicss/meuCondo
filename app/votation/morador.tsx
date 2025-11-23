import BottomMenu from '@/components/BottomMenu';
import CustomHeader from '@/components/CustomHeader';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Chip,
  Divider,
  ProgressBar,
  Text,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

// --- LÓGICA DE ARMAZENAMENTO LOCAL DE VOTOS (PRESERVADA) ---
const LEGACY_VOTE_STORAGE_KEY = 'userPollVotes';
const VOTE_KEY_PREFIX = 'userPollVote';
const USER_ID_STORAGE_KEY = 'authUserId';

type DecodedToken = { userId?: string; sub?: string };
type VoteOption = 'YES' | 'NO';
type StoredVoteValue = VoteOption | 'UNKNOWN';

const getUserIdFromToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded?.userId || decoded?.sub || null;
  } catch {
    return null;
  }
};

async function cacheUserId(userId: string | null) {
  if (!userId) return;
  try { await AsyncStorage.setItem(USER_ID_STORAGE_KEY, userId); } catch {}
}

async function getCachedUserId(): Promise<string | null> {
  try { return await AsyncStorage.getItem(USER_ID_STORAGE_KEY) || null; } catch { return null; }
}

async function migrateLegacyVotes(userId: string) {
  try {
    const legacyData = await AsyncStorage.getItem(LEGACY_VOTE_STORAGE_KEY);
    if (!legacyData) return;
    const parsed = JSON.parse(legacyData) as Record<string, StoredVoteValue>;
    const entries = Object.entries(parsed);
    if (entries.length === 0) return;
    await Promise.all(entries.map(([pollId, vote]) => AsyncStorage.setItem(`${VOTE_KEY_PREFIX}:${userId}:${pollId}`, vote)));
    await AsyncStorage.removeItem(LEGACY_VOTE_STORAGE_KEY);
  } catch {}
}

async function readVotesForPolls(pollIds: string[], userId: string | null): Promise<Record<string, StoredVoteValue>> {
  try {
    if (!userId || pollIds.length === 0) return {};
    const keys = pollIds.map(id => `${VOTE_KEY_PREFIX}:${userId}:${id}`);
    const values = await AsyncStorage.multiGet(keys);
    const result: Record<string, StoredVoteValue> = {};
    values.forEach(([key, value]) => {
      if (!value) return;
      const pollId = key.replace(`${VOTE_KEY_PREFIX}:${userId}:`, '');
      if (pollId) result[pollId] = value as StoredVoteValue;
    });
    return result;
  } catch { return {}; }
}

async function saveStoredVote(userId: string | null, pollId: string, vote: StoredVoteValue) {
  try {
    if (!userId) return;
    await AsyncStorage.setItem(`${VOTE_KEY_PREFIX}:${userId}:${pollId}`, vote);
  } catch {}
}

async function removeStoredVote(userId: string | null, pollId: string) {
  try {
    if (!userId) return;
    await AsyncStorage.removeItem(`${VOTE_KEY_PREFIX}:${userId}:${pollId}`);
  } catch {}
}

// --- TIPOS DA UI ---
type Votation = {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  attachments?: string[];
  isActive: boolean;
  yesCount: number;
  noCount: number;
  yesOptionId?: string;
  noOptionId?: string;
  userHasVotedLocal?: boolean;
  userVotedOptionLocal?: VoteOption;
};

export default function VotationMoradorScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [votations, setVotations] = useState<Votation[]>([]);
  const [condominiumId, setCondominiumId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const legacyMigratedUserRef = useRef<string | null>(null);

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
        const res = await api.get<any[]>('/condominiums', { headers: { Authorization: `Bearer ${token}` } });
        list = Array.isArray(res.data) ? res.data : [];
      } catch (err: any) {
        if (err?.response?.status === 404) {
          try {
            const res2 = await api.get<any[]>('/condominiums/user', { headers: { Authorization: `Bearer ${token}` } });
            list = Array.isArray(res2.data) ? res2.data : [];
          } catch { return null; }
        } else { return null; }
      }
      return list.length > 0 ? String(list[0].id) : null;
    } catch { return null; }
  }, []);

  const totalVotes = useCallback((v: Votation) => v.yesCount + v.noCount, []);
  const yesPct = useCallback((v: Votation) => {
    const t = totalVotes(v);
    return t === 0 ? 0 : v.yesCount / t;
  }, [totalVotes]);
  const noPct = useCallback((v: Votation) => {
    const t = totalVotes(v);
    return t === 0 ? 0 : v.noCount / t;
  }, [totalVotes]);

  const loadVotations = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Autenticação necessária', 'Faça login para acessar.');
        setLoading(false);
        router.replace('/login');
        return;
      }
      let userId = getUserIdFromToken(token);
      if (userId) await cacheUserId(userId);
      else userId = await getCachedUserId();
      
      if (userId && currentUserId !== userId) setCurrentUserId(userId);

      const condoId = condominiumId ?? (await ensureCondominiumId());
      if (!condoId) {
        setVotations([]);
        Alert.alert('Condomínio', 'Não foi possível identificar o condomínio do usuário.');
        setLoading(false);
        return;
      }
      if (!condominiumId) setCondominiumId(condoId);

      if (userId && legacyMigratedUserRef.current !== userId) {
        await migrateLegacyVotes(userId);
        legacyMigratedUserRef.current = userId;
      }

      const res = await api.get<any[]>(`/polls/condominium/${condoId}`, { headers: { Authorization: `Bearer ${token}` } });
      const raw = Array.isArray(res.data) ? res.data : [];
      const storedVotes = await readVotesForPolls(raw.map((p: any) => String(p.id)), userId ?? currentUserId);

      const mapped: Votation[] = raw.map((p: any) => {
        const options = Array.isArray(p.options) ? p.options : [];
        const yesOpt = options.find((o: any) => String(o.text).toLowerCase() === 'sim' || String(o.text).toLowerCase() === 'yes');
        const noOpt = options.find((o: any) => String(o.text).toLowerCase() === 'não' || String(o.text).toLowerCase() === 'nao' || String(o.text).toLowerCase() === 'no');
        
        const base: Votation = {
          id: String(p.id),
          title: p.title ?? 'Votação',
          description: p.description ?? '',
          startDate: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
          endDate: p.endsAt ? new Date(p.endsAt).toISOString() : new Date().toISOString(),
          attachments: [],
          isActive: (((p.status ? String(p.status).toLowerCase() : '') === 'open' || (p.status ? String(p.status).toLowerCase() : '') === 'opened')
            && (!p.endsAt || new Date() <= new Date(p.endsAt))),
          yesCount: Number(yesOpt?.votesCount ?? 0),
          noCount: Number(noOpt?.votesCount ?? 0),
          yesOptionId: yesOpt?.id ? String(yesOpt.id) : undefined,
          noOptionId: noOpt?.id ? String(noOpt.id) : undefined,
        };

        const storedVote = storedVotes[base.id];
        if (storedVote) {
          base.userHasVotedLocal = true;
          if (storedVote !== 'UNKNOWN') {
            base.userVotedOptionLocal = storedVote;
          }
        }
        return base;
      });

      const now = Date.now();
      const cutoffMs = 2 * 24 * 60 * 60 * 1000; // 2 dias
      const filtered = mapped.filter(v => {
        if (v.isActive) return true;
        const end = new Date(v.endDate).getTime();
        if (Number.isNaN(end)) return false;
        return (now - end) <= cutoffMs;
      });
      setVotations(filtered);
    } catch (apiError: any) {
      setVotations([]);
    } finally {
      setLoading(false);
    }
  }, [condominiumId, ensureCondominiumId, currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadVotations();
    }, [loadVotations])
  );

  const handleVote = useCallback(async (votationId: string, vote: VoteOption) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      let activeUserId = currentUserId ?? getUserIdFromToken(token);
      if (!activeUserId) activeUserId = await getCachedUserId();
      if (!activeUserId) return;

      const v = votations.find(item => item.id === votationId);
      if (v?.userHasVotedLocal) {
        Alert.alert('Voto já registrado', 'Você já votou nesta enquete.');
        return;
      }

      const optionId = vote === 'YES' ? v?.yesOptionId : v?.noOptionId;
      if (!optionId) return;

      Alert.alert(
        'Confirmar voto',
        `Deseja votar "${vote === 'YES' ? 'Sim' : 'Não'}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: async () => {
              try {
                const payload: any = { optionId };
                await api.post(`/polls/${votationId}/vote`, payload, { headers: { Authorization: `Bearer ${token}` } });
                await saveStoredVote(activeUserId, votationId, vote);
                setVotations(prev =>
                  prev.map(item => {
                    if (item.id !== votationId) return item;
                    return {
                      ...item,
                      userHasVotedLocal: true,
                      userVotedOptionLocal: vote,
                      yesCount: vote === 'YES' ? item.yesCount + 1 : item.yesCount,
                      noCount: vote === 'NO' ? item.noCount + 1 : item.noCount,
                    };
                  }),
                );
                Alert.alert('Sucesso', 'Voto registrado.');
              } catch (err) {
                Alert.alert('Erro', 'Não foi possível registrar seu voto.');
              }
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert('Erro', 'Ocorreu um problema.');
    }
  }, [votations, currentUserId]);

  const activeVotations = useMemo(() => votations.filter(v => v.isActive), [votations]);

  if (loading) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      
      {/* HEADER CLEAN - SEM MENU, APENAS TÍTULO */}
      <CustomHeader mode="center-aligned" style={{ backgroundColor: theme.colors.background, elevation: 0 }}>
         <Appbar.Content title="Votações" titleStyle={{ color: theme.colors.onSurface, fontWeight: '600', fontSize: 18 }} />
         <Appbar.Action icon={() => null} /> 
      </CustomHeader>

      {/* LISTA DE VOTAÇÕES */}
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        
        {activeVotations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ color: '#8E8E93', fontSize: 14 }}>Nenhuma votação ativa.</Text>
          </View>
        ) : (
          activeVotations.map(v => {
            const t = totalVotes(v);
            return (
              <Card key={v.id} style={styles.votationCard}>
                <View style={styles.cardContent}>
                    
                    {/* Header do Card - SEM ÍCONE AZUL AO LADO DO TÍTULO */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.votationTitle} numberOfLines={2}>{v.title}</Text>
                            <Text style={styles.votationDate}>
                                Até {new Date(v.endDate).toLocaleDateString('pt-BR')}
                            </Text>
                        </View>
                        <Chip 
                            style={{ backgroundColor: v.isActive ? '#E3F2FD' : '#F5F5F5', height: 28, alignItems: 'center' }} 
                            textStyle={{ color: v.isActive ? '#0095FF' : '#666', fontSize: 10, fontWeight: 'bold', lineHeight: 14 }}
                        >
                            {v.isActive ? 'Aberta' : 'Encerrada'}
                        </Chip>
                    </View>

                    {/* Descrição */}
                    {!!v.description && (
                        <Text style={styles.votationDesc} numberOfLines={3}>
                            {v.description}
                        </Text>
                    )}

                    <Divider style={{ marginVertical: 12, backgroundColor: '#F0F0F0' }} />

                    {/* Progresso dos Votos */}
                    <View>
                        <View style={styles.rowBetween}>
                            <Text style={{ color: theme.colors.onSurface, fontSize: 12, fontWeight: '600' }}>SIM</Text>
                            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                                {String(v.yesCount).padStart(2, '0')} ({Math.round(yesPct(v)*100)}%)
                            </Text>
                        </View>
                        <ProgressBar progress={yesPct(v)} color={theme.colors.primary} style={styles.progress} />
                    </View>

                    <View style={{ marginTop: 8 }}>
                        <View style={styles.rowBetween}>
                            <Text style={{ color: theme.colors.onSurface, fontSize: 12, fontWeight: '600' }}>NÃO</Text>
                            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                                {String(v.noCount).padStart(2, '0')} ({Math.round(noPct(v)*100)}%)
                            </Text>
                        </View>
                        <ProgressBar progress={noPct(v)} color={theme.colors.error} style={styles.progress} />
                    </View>
                    
                    <Text style={styles.totalVotes}>Total: {t} votos</Text>

                    {/* Botões de Voto */}
                    <View style={styles.voteActions}>
                        {v.userHasVotedLocal ? (
                            <View style={[
                                styles.votedContainer, 
                                { borderColor: v.userVotedOptionLocal === 'YES' ? theme.colors.primary : theme.colors.error }
                            ]}>
                                <Feather 
                                    name={v.userVotedOptionLocal === 'YES' ? 'check-circle' : 'x-circle'} 
                                    size={18} 
                                    color={v.userVotedOptionLocal === 'YES' ? theme.colors.primary : theme.colors.error} 
                                />
                                <Text style={{ 
                                    marginLeft: 8, 
                                    fontWeight: '600', 
                                    color: v.userVotedOptionLocal === 'YES' ? theme.colors.primary : theme.colors.error 
                                }}>
                                    Você votou: {v.userVotedOptionLocal === 'YES' ? 'Sim' : 'Não'}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.buttonRow}>
                                <Button
                                    mode="contained"
                                    disabled={!v.isActive || !v.yesOptionId}
                                    onPress={() => handleVote(v.id, 'YES')}
                                    style={[styles.voteButton, { backgroundColor: '#0095FF' }]}
                                    labelStyle={{ fontWeight: '600' }}
                                    compact
                                >
                                    Votar Sim
                                </Button>

                                <Button
                                    mode="outlined"
                                    disabled={!v.isActive || !v.noOptionId}
                                    onPress={() => handleVote(v.id, 'NO')}
                                    style={[styles.voteButton, { borderColor: '#FF3B30' }]}
                                    textColor="#FF3B30"
                                    labelStyle={{ fontWeight: '600' }}
                                    compact
                                >
                                    Votar Não
                                </Button>
                            </View>
                        )}
                    </View>

                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
      <BottomMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  container: { padding: 16, paddingBottom: 100 },
  
  // Card Votação
  votationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  cardContent: { padding: 16 },
  votationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1A1A1A',
      marginBottom: 2
  },
  votationDate: {
      fontSize: 12,
      color: '#8E8E93'
  },
  votationDesc: {
      fontSize: 14,
      color: '#555',
      lineHeight: 20,
      marginTop: 4
  },
  rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4
  },
  progress: {
      height: 6,
      borderRadius: 3,
      backgroundColor: '#F0F0F0'
  },
  totalVotes: {
      marginTop: 12,
      fontSize: 12,
      color: '#8E8E93',
      textAlign: 'right',
      marginBottom: 12
  },

  // Ações de Voto
  voteActions: {
      marginTop: 4,
  },
  buttonRow: { 
      flexDirection: 'row', 
      gap: 10 
  },
  voteButton: { 
      flex: 1, 
      borderRadius: 20, 
  },
  votedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: '#FAFAFA'
  },

  // Empty State
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12
  },
});