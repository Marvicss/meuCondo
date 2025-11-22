import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Chip, ProgressBar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const LEGACY_VOTE_STORAGE_KEY = 'userPollVotes';
const VOTE_KEY_PREFIX = 'userPollVote';
const USER_ID_STORAGE_KEY = 'authUserId';

type DecodedToken = { userId?: string; sub?: string };

// Tipos reutilizados
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
  try {
    await AsyncStorage.setItem(USER_ID_STORAGE_KEY, userId);
  } catch {
    // ignore
  }
}

async function getCachedUserId(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
    return stored || null;
  } catch {
    return null;
  }
}

async function migrateLegacyVotes(userId: string) {
  try {
    const legacyData = await AsyncStorage.getItem(LEGACY_VOTE_STORAGE_KEY);
    if (!legacyData) return;
    const parsed = JSON.parse(legacyData) as Record<string, StoredVoteValue>;
    const entries = Object.entries(parsed);
    if (entries.length === 0) return;
    await Promise.all(
      entries.map(([pollId, vote]) => AsyncStorage.setItem(`${VOTE_KEY_PREFIX}:${userId}:${pollId}`, vote))
    );
    await AsyncStorage.removeItem(LEGACY_VOTE_STORAGE_KEY);
  } catch {
    // ignore
  }
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
      if (pollId) {
        result[pollId] = value as StoredVoteValue;
      }
    });
    return result;
  } catch {
    return {};
  }
}

async function saveStoredVote(userId: string | null, pollId: string, vote: StoredVoteValue) {
  try {
    if (!userId) return;
    await AsyncStorage.setItem(`${VOTE_KEY_PREFIX}:${userId}:${pollId}`, vote);
  } catch {
    // ignore
  }
}

async function removeStoredVote(userId: string | null, pollId: string) {
  try {
    if (!userId) return;
    await AsyncStorage.removeItem(`${VOTE_KEY_PREFIX}:${userId}:${pollId}`);
  } catch {
    // ignore
  }
}

async function checkIfUserVotedInPoll(pollId: string, token: string): Promise<{ hasVoted: boolean; votedOption?: VoteOption }> {
  try {
    // Tenta buscar detalhes do poll para verificar se há informação de voto
    const res = await api.get(`/polls/${pollId}`, { headers: { Authorization: `Bearer ${token}` } });
    const poll = res.data;
    
    if (!poll || !Array.isArray(poll.options)) {
      return { hasVoted: false };
    }
    
    // Se o backend retornar os votos, verifica
    const yesOpt = poll.options.find((o: any) => String(o.text).toLowerCase() === 'sim' || String(o.text).toLowerCase() === 'yes');
    const noOpt = poll.options.find((o: any) => String(o.text).toLowerCase() === 'não' || String(o.text).toLowerCase() === 'nao' || String(o.text).toLowerCase() === 'no');
    
    // Retorna falso por padrão (backend não retorna votos individuais)
    return { hasVoted: false };
  } catch {
    return { hasVoted: false };
  }
}

// Tipos reutilizados
type Votation = {
  id: string;
  title: string;
  description?: string;
  startDate: string;      // ISO
  endDate: string;        // ISO
  attachments?: string[]; // opcional
  isActive: boolean;
  yesCount: number;
  noCount: number;
  // IDs das opções para voto
  yesOptionId?: string;
  noOptionId?: string;
  // Controle local de voto do morador
  userHasVotedLocal?: boolean;
  userVotedOptionLocal?: VoteOption;
};

export default function VotationMoradorScreen() {
  const theme = useTheme();
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
          } catch {
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
        return;
      }
      let userId = getUserIdFromToken(token);
      if (userId) {
        await cacheUserId(userId);
      } else {
        userId = await getCachedUserId();
      }
      if (userId && currentUserId !== userId) {
        setCurrentUserId(userId);
      }
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

      try {
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
        // Oculta votações encerradas há mais de 2 dias
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
        const status = apiError?.response?.status;
        if (status === 404) {
          Alert.alert('Sem votações', 'Nenhuma votação encontrada para este condomínio.');
        } else if (status === 401) {
          Alert.alert('Sessão expirada', 'Faça login novamente.');
          await AsyncStorage.removeItem('token');
        } else {
          Alert.alert('Erro', 'Não foi possível carregar as votações.');
        }
      }
    } catch {
      setVotations([]);
      Alert.alert('Erro', 'Ocorreu um problema ao carregar as votações.');
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
      if (!token) {
        Alert.alert('Autenticação necessária', 'Faça login para votar.');
        return;
      }

      let activeUserId = currentUserId ?? getUserIdFromToken(token);
      if (!activeUserId) {
        activeUserId = await getCachedUserId();
      }
      if (!activeUserId) {
        Alert.alert('Erro', 'Não conseguimos identificar o usuário logado para registrar o voto. Faça login novamente.');
        return;
      }
      await cacheUserId(activeUserId);
      if (activeUserId !== currentUserId) {
        setCurrentUserId(activeUserId);
      }

      const v = votations.find(item => item.id === votationId);

      if (v?.userHasVotedLocal) {
        const votedLabel = v.userVotedOptionLocal === 'YES'
          ? 'Sim'
          : v.userVotedOptionLocal === 'NO'
            ? 'Não'
            : null;
        Alert.alert(
          'Voto já registrado',
          votedLabel
            ? `Você já votou "${votedLabel}" nesta votação. O sistema não permite alterar o voto.`
            : 'Você já registrou seu voto nesta votação. O sistema não permite alterar o voto.',
        );
        return;
      }

      const optionId = vote === 'YES' ? v?.yesOptionId : v?.noOptionId;

      if (!optionId) {
        Alert.alert('Erro', 'Opção de voto não disponível.');
        return;
      }

      Alert.alert(
        'Confirmar voto',
        `Deseja votar "${vote === 'YES' ? 'Sim' : 'Não'}" nesta votação?\n\n⚠️ ATENÇÃO: Após confirmar, não será possível alterar seu voto.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: async () => {
              const lockLocally = (option?: VoteOption) => {
                setVotations(prev =>
                  prev.map(item => (
                    item.id === votationId
                      ? { ...item, userHasVotedLocal: true, userVotedOptionLocal: option }
                      : item
                  )),
                );
              };

              const unlockLocally = () => {
                setVotations(prev =>
                  prev.map(item => (
                    item.id === votationId
                      ? { ...item, userHasVotedLocal: false, userVotedOptionLocal: undefined }
                      : item
                  )),
                );
              };

              const markUnknownVote = async () => {
                setVotations(prev =>
                  prev.map(item => (
                    item.id === votationId
                      ? { ...item, userHasVotedLocal: true, userVotedOptionLocal: undefined }
                      : item
                  )),
                );
                await saveStoredVote(activeUserId, votationId, 'UNKNOWN');
              };

              lockLocally(vote);

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
                Alert.alert('Voto computado', 'Seu voto foi registrado com sucesso.');
                loadVotations();
              } catch (err: any) {
                const st = err?.response?.status;
                const msg = err?.response?.data?.message || err?.message;
                const msgLower = String(msg || '').toLowerCase();

                if (st === 400 && (msgLower.includes('já votou') || msgLower.includes('already voted'))) {
                  await markUnknownVote();
                  Alert.alert(
                    'Voto já registrado',
                    'Você já votou nesta votação. O sistema não permite alterar o voto.',
                    [{ text: 'OK', onPress: () => loadVotations() }],
                  );
                } else if (st === 404) {
                  unlockLocally();
                  await removeStoredVote(activeUserId, votationId);
                  Alert.alert('Votação não encontrada', msg ? String(msg) : 'A votação não está mais disponível.');
                } else if (st === 401) {
                  unlockLocally();
                  await removeStoredVote(activeUserId, votationId);
                  Alert.alert('Sessão expirada', 'Faça login novamente.');
                  await AsyncStorage.removeItem('token');
                } else if (st === 409) {
                  await markUnknownVote();
                  Alert.alert(
                    'Voto já registrado',
                    'Você já votou nesta votação. O sistema não permite alterar o voto.',
                    [{ text: 'OK', onPress: () => loadVotations() }],
                  );
                } else if (st === 400) {
                  unlockLocally();
                  await removeStoredVote(activeUserId, votationId);
                  Alert.alert('Voto inválido', msg ? String(msg) : 'A votação não permite esse voto no momento.');
                } else if (st >= 500 && (msgLower.includes('duplicate') || msgLower.includes('duplicado') || msgLower.includes('já votou'))) {
                  await markUnknownVote();
                  Alert.alert(
                    'Não é possível alterar o voto',
                    'Você já registrou seu voto nesta votação. O sistema não permite alterações.',
                    [{ text: 'Entendi', onPress: () => loadVotations() }],
                  );
                } else if (st >= 500) {
                  unlockLocally();
                  await removeStoredVote(activeUserId, votationId);
                  Alert.alert(
                    'Erro no servidor',
                    'Tivemos um problema ao processar seu voto. Tente novamente em alguns instantes.',
                    [{ text: 'OK' }],
                  );
                } else {
                  unlockLocally();
                  await removeStoredVote(activeUserId, votationId);
                  Alert.alert('Erro', msg ? String(msg) : 'Não foi possível registrar seu voto. Tente novamente.');
                }
              }
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('Erro', 'Ocorreu um problema ao processar sua solicitação.');
    }
  }, [votations, loadVotations, currentUserId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header>
        <Appbar.Content title="Votações" />
      </Appbar.Header>

      {loading ? (
        <View style={styles.center}><Text>Carregando...</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {votations.length === 0 ? (
            <View style={styles.center}><Text>Nenhuma votação disponível.</Text></View>
          ) : (
            votations.map(v => (
              <Card key={v.id} style={{ marginBottom: 12 }}>
                <Card.Title title={v.title} subtitle={`Período: ${new Date(v.startDate).toLocaleDateString()} - ${new Date(v.endDate).toLocaleDateString()}`} />
                {v.description ? (
                  <Card.Content>
                    <Text>{v.description}</Text>
                    <View style={{ marginTop: 8 }}>
                      <Text>Sim</Text>
                      <ProgressBar progress={yesPct(v)} style={styles.progress} color="#4CAF50" />
                      <Text style={{ marginBottom: 6 }}>Não</Text>
                      <ProgressBar progress={noPct(v)} style={styles.progress} color="#F44336" />
                    </View>
                  </Card.Content>
                ) : (
                  <Card.Content>
                    <View style={{ marginTop: 8 }}>
                      <Text>Sim</Text>
                      <ProgressBar progress={yesPct(v)} style={styles.progress} color="#4CAF50" />
                      <Text style={{ marginBottom: 6 }}>Não</Text>
                      <ProgressBar progress={noPct(v)} style={styles.progress} color="#F44336" />
                    </View>
                  </Card.Content>
                )}
                <Card.Actions style={styles.actions}>
                  <View style={styles.statusRow}>
                    <Chip selectedColor="#fff" style={{ backgroundColor: v.isActive ? '#0099FF' : '#777' }}>
                      {v.isActive ? 'Aberta' : 'Encerrada'}
                    </Chip>
                    {v.userHasVotedLocal && (
                      <Chip
                        selectedColor="#fff"
                        style={{
                          backgroundColor:
                            v.userVotedOptionLocal === 'YES'
                              ? '#4CAF50'
                              : v.userVotedOptionLocal === 'NO'
                                ? '#F44336'
                                : '#555',
                          marginLeft: 8,
                        }}
                      >
                        {v.userVotedOptionLocal === 'YES'
                          ? 'Você votou: Sim'
                          : v.userVotedOptionLocal === 'NO'
                            ? 'Você votou: Não'
                            : 'Voto registrado'}
                      </Chip>
                    )}
                  </View>
                  <View style={styles.buttonRow}>
                    <Button
                      mode="contained"
                      compact
                      contentStyle={styles.voteContent}
                      labelStyle={styles.voteLabel}
                      disabled={!v.isActive || !v.yesOptionId || v.userHasVotedLocal}
                      onPress={() => handleVote(v.id, 'YES')}
                      style={styles.voteButton}
                    >
                      {v.userHasVotedLocal
                        ? v.userVotedOptionLocal === 'YES'
                          ? '✓ Votei Sim'
                          : 'Voto registrado'
                        : 'Votar Sim'}
                    </Button>

                    <Button
                      mode="contained"
                      compact
                      contentStyle={styles.voteContent}
                      labelStyle={styles.voteLabel}
                      disabled={!v.isActive || !v.noOptionId || v.userHasVotedLocal}
                      onPress={() => handleVote(v.id, 'NO')}
                      style={[styles.voteButton, { marginLeft: 8 }]}
                    >
                      {v.userHasVotedLocal
                        ? v.userVotedOptionLocal === 'NO'
                          ? '✓ Votei Não'
                          : 'Voto registrado'
                        : 'Votar Não'}
                    </Button>
                  </View>
                </Card.Actions>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  progress: { height: 10, borderRadius: 8 },
  actions: { flexDirection: 'column', alignItems: 'stretch' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  voteButton: { flex: 1, borderRadius: 20 },
  voteContent: { paddingHorizontal: 12, height: 40 },
  voteLabel: { fontSize: 14 },
});

