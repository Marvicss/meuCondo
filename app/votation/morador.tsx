import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Chip, ProgressBar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

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
};

type VoteOption = 'YES' | 'NO';

export default function VotationMoradorScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [votations, setVotations] = useState<Votation[]>([]);
  const [condominiumId, setCondominiumId] = useState<string | null>(null);

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
      const condoId = condominiumId ?? (await ensureCondominiumId());
      if (!condoId) {
        setVotations([]);
        Alert.alert('Condomínio', 'Não foi possível identificar o condomínio do usuário.');
        setLoading(false);
        return;
      }
      if (!condominiumId) setCondominiumId(condoId);

      try {
        const res = await api.get<any[]>(`/polls/condominium/${condoId}`, { headers: { Authorization: `Bearer ${token}` } });
        const raw = Array.isArray(res.data) ? res.data : [];
        const mapped: Votation[] = raw.map((p: any) => {
          const options = Array.isArray(p.options) ? p.options : [];
          const yesOpt = options.find((o: any) => String(o.text).toLowerCase() === 'sim' || String(o.text).toLowerCase() === 'yes');
          const noOpt = options.find((o: any) => String(o.text).toLowerCase() === 'não' || String(o.text).toLowerCase() === 'nao' || String(o.text).toLowerCase() === 'no');
          return {
            id: String(p.id),
            title: p.title ?? 'Votação',
            description: p.description ?? '',
            startDate: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
            endDate: p.endsAt ? new Date(p.endsAt).toISOString() : new Date().toISOString(),
            attachments: [],
            // Considera status e período: se já passou o término, marca como encerrada
            isActive: (((p.status ? String(p.status).toLowerCase() : '') === 'open' || (p.status ? String(p.status).toLowerCase() : '') === 'opened')
              && (!p.endsAt || new Date() <= new Date(p.endsAt))),
            yesCount: Number(yesOpt?.votesCount ?? 0),
            noCount: Number(noOpt?.votesCount ?? 0),
            yesOptionId: yesOpt?.id ? String(yesOpt.id) : undefined,
            noOptionId: noOpt?.id ? String(noOpt.id) : undefined,
          };
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
  }, [condominiumId, ensureCondominiumId]);

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
      const v = votations.find(item => item.id === votationId);
      const optionId = vote === 'YES' ? v?.yesOptionId : v?.noOptionId;
      // Monta payload conforme disponibilidade dos dados
      const payload: any = optionId ? { optionId } : { option: vote };

      await api.post(`/polls/${votationId}/vote`, payload, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert('Voto computado', 'Seu voto foi registrado com sucesso.');
      loadVotations();
    } catch (err: any) {
      const st = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message;
      if (st === 400) {
        Alert.alert('Voto inválido', msg ? String(msg) : 'Você já votou ou a votação não permite esse voto.');
      } else if (st === 404) {
        Alert.alert('Votação não encontrada', msg ? String(msg) : 'A votação não está disponível.');
      } else if (st === 401) {
        Alert.alert('Sessão expirada', 'Faça login novamente.');
        await AsyncStorage.removeItem('token');
      } else if (st >= 500) {
        Alert.alert('Servidor indisponível', 'Tivemos um erro no servidor (500). Tente novamente mais tarde.');
      } else {
        Alert.alert('Erro', msg ? String(msg) : 'Não foi possível registrar seu voto.');
      }
    }
  }, [votations, loadVotations]);

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
                  </View>
                  <View style={styles.buttonRow}>
                    <Button
                      mode="contained"
                      compact
                      contentStyle={styles.voteContent}
                      labelStyle={styles.voteLabel}
                      disabled={!v.isActive || !v.yesOptionId}
                      onPress={() => handleVote(v.id, 'YES')}
                      style={styles.voteButton}
                    >
                      Votar Sim
                    </Button>
                    <Button
                      mode="contained"
                      compact
                      contentStyle={styles.voteContent}
                      labelStyle={styles.voteLabel}
                      disabled={!v.isActive || !v.noOptionId}
                      onPress={() => handleVote(v.id, 'NO')}
                      style={[styles.voteButton, { marginLeft: 8 }]}
                    >
                      Votar Não
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

