import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Chip, IconButton, Modal, Portal, ProgressBar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

type VoteOption = 'YES' | 'NO';

type Votation = {
  id: string;
  title: string;
  description?: string;
  startDate: string;      // ISO date (yyyy-mm-dd)
  endDate: string;        // ISO date (yyyy-mm-dd)
  attachments?: string[]; // URLs ou nomes
  isActive: boolean;
  yesCount: number;
  noCount: number;
};

type CreateVotationPayload = {
  title: string;
  description?: string;
  options: string[]; // mínimo 2
  endsAt?: string;   // ISO
};

export default function VotationSindicoScreen() {
  const theme = useTheme();

  const [loading, setLoading] = useState<boolean>(true);
  const [votations, setVotations] = useState<Votation[]>([]);

  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [form, setForm] = useState<CreateVotationPayload>({ title: '', description: '', options: ['Sim', 'Não'], endsAt: undefined });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [condominiumId, setCondominiumId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  
  // Verificar se o usuário está autenticado ao carregar a tela
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          Alert.alert('Acesso negado', 'Você precisa estar logado para acessar esta tela.', [
            { text: 'OK', onPress: () => router.replace('/login' as any) }
          ]);
          return;
        }
        
        // Verificar se o token é válido fazendo uma requisição
        try {
          await api.get('/users/me', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (err: any) {
          // Se a requisição falhar com erro 401, redirecionamos para o login
          const status = err?.response?.status;
          if (status === 401) {
            Alert.alert('Sessão expirada', 'Faça login novamente.', [
              { text: 'OK', onPress: () => router.replace('/login' as any) }
            ]);
            await AsyncStorage.removeItem('token');
            return;
          }
          
        }
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 401) {
          Alert.alert('Sessão expirada', 'Faça login novamente.', [
            { text: 'OK', onPress: () => router.replace('/login' as any) }
          ]);
        }
      }
    };
    
    checkAuthentication();
  }, []);

  const formatISODate = (d: Date) => d.toISOString().split('T')[0];

  const onChangeStart = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const current = selectedDate || startDate;
    setShowStartPicker(Platform.OS === 'ios');
    setStartDate(current);
    // Mantemos apenas para exibir na UI; backend usa apenas endsAt
    setForm(prev => ({ ...prev }));
  };

  const onChangeEnd = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const current = selectedDate || endDate;
    setShowEndPicker(Platform.OS === 'ios');
    setEndDate(current);
    setForm(prev => ({ ...prev, endsAt: current.toISOString() }));
  };

  const totalVotes = useCallback((v: Votation) => v.yesCount + v.noCount, []);
  const yesPct = useCallback((v: Votation) => {
    const t = totalVotes(v);
    return t === 0 ? 0 : v.yesCount / t;
  }, [totalVotes]);
  const noPct = useCallback((v: Votation) => {
    const t = totalVotes(v);
    return t === 0 ? 0 : v.noCount / t;
  }, [totalVotes]);

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
              console.log('Erro ao buscar condomínios na rota alternativa', innerErr);
            // Retorna um ID padrão para evitar carregamento infinito
            return null;
          }
        } else {
          // Retorna um ID padrão para evitar carregamento infinito
          return null;
        }
      }
      return list.length > 0 ? String(list[0].id) : null; // Retorna null se não encontrar
    } catch {
      // Retorna null para evitar ID inválido
      return null;
    }
  }, []);

  const loadVotations = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Autenticação necessária', 'Faça login para acessar.');
        setLoading(false); // Garante que o loading é finalizado
        return;
      }

      const condoId = condominiumId ?? (await ensureCondominiumId());
      if (!condoId) {
        setVotations([]);
        Alert.alert('Condomínio', 'Não foi possível identificar o condomínio do usuário.');
        setLoading(false); // Garante que o loading é finalizado
        return;
      }
      if (!condominiumId) setCondominiumId(condoId);

      try {
        // Tenta o endpoint correto do backend para buscar as votações
        const res = await api.get<any[]>(`/polls/condominium/${condoId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        const raw = Array.isArray(res.data) ? res.data : [];
        // Mapeia PollResponseDTO -> Votation esperado pela UI
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
            isActive: p.status ? String(p.status).toLowerCase() === 'open' : true,
            yesCount: Number(yesOpt?.votesCount ?? 0),
            noCount: Number(noOpt?.votesCount ?? 0),
          };
        });

        setVotations(mapped);
      } catch (apiError: any) {
        console.error('Erro na API de votações', apiError);
        setVotations([]);
        const status = apiError?.response?.status;
        if (status === 401) {
          Alert.alert('Sessão expirada', 'Faça login novamente.', [
            { text: 'OK', onPress: () => router.replace('/login' as any) }
          ]);
        } else if (status === 404) {
          Alert.alert('Sem votações', 'Nenhuma votação encontrada para este condomínio.');
        } else {
          Alert.alert('Erro', 'Não foi possível carregar as votações. Tente novamente mais tarde.');
        }
      }
    } catch (error: any) {
      console.error('Erro geral ao carregar votações', error);
      setVotations([]); // Garante que definimos um valor mesmo em caso de erro
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

  const handleOpenCreate = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    setStartDate(today);
    setEndDate(tomorrow);
    setForm({ title: '', description: '', options: ['Sim', 'Não'], endsAt: tomorrow.toISOString() });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!form.title || !form.options || form.options.filter(o => o?.trim()).length < 2) {
      Alert.alert('Campos obrigatórios', 'Preencha título e pelo menos duas opções.');
      return;
    }
    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Sessão expirada', 'Faça login novamente.');
        return;
      }
      const condoId = condominiumId ?? (await ensureCondominiumId());
      const payload: any = {
        title: form.title,
        description: form.description,
        options: form.options.map(o => String(o)),
        condominiumId: condoId,
        endsAt: form.endsAt,
      };
      await api.post('/polls', payload, { headers: { Authorization: `Bearer ${token}` } });
      setCreateOpen(false);
      await loadVotations();
      Alert.alert('Sucesso', 'Votação criada.');
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message || 'Não foi possível criar a votação.';
      console.error('Erro ao criar votação', status, error?.response?.data || error);
      if (status === 401) {
        Alert.alert('Sessão expirada', 'Faça login novamente.', [
          { text: 'OK', onPress: () => router.replace('/login' as any) }
        ]);
      } else {
        Alert.alert('Erro', String(message));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Função de exclusão removida para evitar erro até o backend suportar DELETE /polls/:id

  const activeVotations = useMemo(() => votations.filter(v => v.isActive), [votations]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Votações" titleStyle={{ color: theme.colors.onSurface }} />
        <Appbar.Action icon="plus" onPress={handleOpenCreate} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        <Button mode="contained" style={styles.newButton} onPress={handleOpenCreate} icon="plus">
          Nova Votação
        </Button>

        {activeVotations.map((v) => {
          const t = totalVotes(v);
          return (
            <Card key={v.id} style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
              <Card.Title
                title={v.title}
                titleNumberOfLines={2}
                titleStyle={{ color: theme.colors.onSurface }}
                subtitle={`Período de votação: ${new Date(v.startDate).toLocaleDateString('pt-BR')} a ${new Date(v.endDate).toLocaleDateString('pt-BR')}`}
                subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
                right={() => (
                  <Chip style={{ marginRight: 8 }} icon="file-document">
                    Anexos
                  </Chip>
                )}
              />
              <Card.Content>
                {!!v.description && (
                  <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>{v.description}</Text>
                )}
                <Text style={{ color: theme.colors.onSurface, fontWeight: 'bold', marginBottom: 8 }}>
                  Quantidade de Votos: {t} Votos
                </Text>
                <View style={{ marginBottom: 8 }}>
                  <View style={styles.rowBetween}>
                    <Text style={{ color: theme.colors.onSurface }}>SIM</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{String(v.yesCount).padStart(2, '0')}</Text>
                  </View>
                  <ProgressBar progress={yesPct(v)} color={theme.colors.primary} style={styles.progress} />
                </View>
                <View>
                  <View style={styles.rowBetween}>
                    <Text style={{ color: theme.colors.onSurface }}>NÃO</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{String(v.noCount).padStart(2, '0')}</Text>
                  </View>
                  <ProgressBar progress={noPct(v)} color={theme.colors.secondary} style={styles.progress} />
                </View>
              </Card.Content>
              {/* Botão de exclusão removido para evitar erro 404 no backend */}
            </Card>
          );
        })}

        {activeVotations.length === 0 && (
          <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: 24 }}>
            Nenhuma votação ativa.
          </Text>
        )}
      </ScrollView>

      <Portal>
        <Modal visible={createOpen} onDismiss={() => setCreateOpen(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Nova Votação</Text>
            <IconButton icon="close" onPress={() => setCreateOpen(false)} />
          </View>
          <TextInput
            mode="outlined"
            label="Título"
            value={form.title}
            onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
            style={{ marginBottom: 12 }}
          />
          <TextInput
            mode="outlined"
            label="Descrição"
            value={form.description}
            onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
            multiline
            style={{ marginBottom: 12 }}
          />
          {/* Opções da votação */}
          {form.options.map((opt, idx) => (
            <TextInput
              key={`opt-${idx}`}
              mode="outlined"
              label={`Opção ${idx + 1}`}
              value={opt}
              onChangeText={(text) => setForm(prev => {
                const next = [...prev.options];
                next[idx] = text;
                return { ...prev, options: next };
              })}
              style={{ marginBottom: 12 }}
              left={<TextInput.Icon icon="format-list-bulleted" />}
            />
          ))}
          <Button
            mode="text"
            icon="plus"
            onPress={() => setForm(prev => ({ ...prev, options: [...prev.options, ''] }))}
            style={{ marginBottom: 8 }}
          >
            Adicionar opção
          </Button>
          <Pressable onPress={() => setShowStartPicker(true)}>
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                label="Início"
                value={startDate.toLocaleDateString('pt-BR')}
                left={<TextInput.Icon icon="calendar" />}
                style={{ marginBottom: 12 }}
                editable={false}
              />
            </View>
          </Pressable>
          <Pressable onPress={() => setShowEndPicker(true)}>
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                label="Fim"
                value={endDate.toLocaleDateString('pt-BR')}
                left={<TextInput.Icon icon="calendar" />}
                style={{ marginBottom: 16 }}
                editable={false}
              />
            </View>
          </Pressable>
          {showStartPicker && (
            <DateTimePicker
              mode="date"
              display="default"
              value={startDate}
              onChange={onChangeStart}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              mode="date"
              display="default"
              value={endDate}
              onChange={onChangeEnd}
            />
          )}
          <Button mode="contained" onPress={handleCreate} loading={submitting} disabled={submitting}>
            Criar Votação
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  newButton: { borderRadius: 12, marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progress: { height: 10, borderRadius: 8 },
  modal: { margin: 20, borderRadius: 12, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
});


