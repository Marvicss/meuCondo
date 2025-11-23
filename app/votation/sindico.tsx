import BottomMenu from '@/components/BottomMenu';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Divider,
  IconButton,
  Modal,
  Portal,
  ProgressBar,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

// --- Ícone Plus SVG ---
const IconPlus = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
`;

// TYPES
type VoteOption = 'YES' | 'NO';

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
};

type CreateVotationPayload = {
  title: string;
  description?: string;
  options: string[];
  endsAt?: string;
};

// COMPONENT
export default function VotationSindicoScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [votations, setVotations] = useState<Votation[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState<CreateVotationPayload>({
    title: '',
    description: '',
    options: ['Sim', 'Não'],
    endsAt: undefined,
  });

  const [submitting, setSubmitting] = useState(false);
  const [condominiumId, setCondominiumId] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // DATE HELPERS
  const onChangeStart = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const current = selectedDate || startDate;
    setShowStartPicker(Platform.OS === 'ios');
    setStartDate(current);
  };

  const onChangeEnd = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const current = selectedDate || endDate;
    setShowEndPicker(Platform.OS === 'ios');
    setEndDate(current);
    setForm(prev => ({ ...prev, endsAt: current.toISOString() }));
  };

  // VOTE PERCENTAGES
  const totalVotes = useCallback((v: Votation) => v.yesCount + v.noCount, []);

  const yesPct = useCallback(
    (v: Votation) => {
      const t = totalVotes(v);
      return t === 0 ? 0 : v.yesCount / t;
    },
    [totalVotes]
  );

  const noPct = useCallback(
    (v: Votation) => {
      const t = totalVotes(v);
      return t === 0 ? 0 : v.noCount / t;
    },
    [totalVotes]
  );

  // GET CONDOMINIUM ID
  const ensureCondominiumId = useCallback(async () => {
    const storedKeys = ['condominiumId', 'condoId', 'condominioId'];

    for (const key of storedKeys) {
      const val = await AsyncStorage.getItem(key);
      if (val) return val;
    }

    const token = await AsyncStorage.getItem('token');
    if (!token) return null;

    try {
      let list: any[] = [];
      try {
        const res = await api.get<any[]>('/condominiums', {
          headers: { Authorization: `Bearer ${token}` },
        });
        list = Array.isArray(res.data) ? res.data : [];
      } catch (err: any) {
        if (err?.response?.status === 404) {
          try {
            const res2 = await api.get<any[]>('/condominiums/user', {
              headers: { Authorization: `Bearer ${token}` },
            });
            list = Array.isArray(res2.data) ? res2.data : [];
          } catch { return null; }
        } else { return null; }
      }
      return list.length > 0 ? String(list[0].id) : null;
    } catch { return null; }
  }, []);

  // LOAD VOTATIONS
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

      const condoId = condominiumId ?? (await ensureCondominiumId());
      if (!condoId) {
        setVotations([]);
        Alert.alert('Condomínio', 'Não foi possível identificar o condomínio do usuário.');
        setLoading(false);
        return;
      }

      if (!condominiumId) setCondominiumId(condoId);

      const res = await api.get<any[]>(`/polls/condominium/${condoId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
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
          isActive: p.status ? String(p.status).toLowerCase() === 'open' : true,
          yesCount: Number(yesOpt?.votesCount ?? 0),
          noCount: Number(noOpt?.votesCount ?? 0),
        };
      });

      setVotations(mapped);
    } catch (error: any) {
      // Alert.alert('Erro', 'Não foi possível carregar as votações.');
      setVotations([]);
    } finally {
      setLoading(false);
    }
  }, [condominiumId, ensureCondominiumId]);

  useFocusEffect(
    useCallback(() => {
      loadVotations();
    }, [loadVotations])
  );

  // CREATE VOTATION
  const handleOpenCreate = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    setStartDate(today);
    setEndDate(tomorrow);
    setForm({
      title: '',
      description: '',
      options: ['Sim', 'Não'],
      endsAt: tomorrow.toISOString(),
    });

    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!form.title || !form.options || form.options.filter(o => o.trim()).length < 2) {
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

      const payload = {
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
      Alert.alert('Erro', error?.response?.data?.message || 'Não foi possível criar a votação.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeVotations = useMemo(() => votations.filter(v => v.isActive), [votations]);

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const primaryColor = '#0095FF';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      
      {/* HEADER CLEAN */}
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: '#F8F9FA', elevation: 0 }}>
         <Appbar.Content title="Votações" titleStyle={{ fontWeight: '600', fontSize: 18, color: '#1A1A1A' }} />
         {/* Action vazia para manter alinhamento se necessário */}
         <Appbar.Action icon={() => null} /> 
      </Appbar.Header>

      <View style={styles.container}>
        
        {/* Botão Nova Votação (Pílula Azul) */}
        <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: primaryColor }]} 
            onPress={handleOpenCreate}
            activeOpacity={0.9}
        >
          <SvgXml xml={IconPlus} width="20" height="20" style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>Nova Votação</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
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
                        
                        {/* Título e Data */}
                        <View style={{ marginBottom: 12 }}>
                            <Text style={styles.votationTitle}>{v.title}</Text>
                            <Text style={styles.votationDate}>
                                Até {new Date(v.endDate).toLocaleDateString('pt-BR')}
                            </Text>
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

                    </View>
                  </Card>
                );
             })
           )}
        </ScrollView>

        {/* MODAL DE CRIAÇÃO */}
        <Portal>
           <Modal visible={createOpen} onDismiss={() => setCreateOpen(false)} contentContainerStyle={styles.modalContainer}>
              <ScrollView>
                 <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Nova Votação</Text>
                    <IconButton icon="close" onPress={() => setCreateOpen(false)} size={20} />
                 </View>

                 <TextInput
                    label="Título"
                    mode="outlined"
                    value={form.title}
                    onChangeText={text => setForm(prev => ({ ...prev, title: text }))}
                    style={styles.input}
                    outlineColor="#E0E0E0" activeOutlineColor="#0095FF"
                 />
                 <TextInput
                    label="Descrição"
                    mode="outlined"
                    value={form.description}
                    onChangeText={text => setForm(prev => ({ ...prev, description: text }))}
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                    outlineColor="#E0E0E0" activeOutlineColor="#0095FF"
                 />

                 <Text style={styles.labelDate}>Encerra em:</Text>
                 <Pressable onPress={() => setShowEndPicker(true)}>
                    <View pointerEvents="none">
                        <TextInput
                            mode="outlined"
                            value={endDate.toLocaleDateString('pt-BR')}
                            left={<TextInput.Icon icon="calendar" color="#8E8E93"/>}
                            style={styles.input}
                            editable={false}
                            outlineColor="#E0E0E0"
                        />
                    </View>
                 </Pressable>

                 {showEndPicker && (
                    <DateTimePicker mode="date" display="default" value={endDate} onChange={onChangeEnd} />
                 )}

                 <Button 
                    mode="contained" 
                    onPress={handleCreate} 
                    loading={submitting} 
                    disabled={submitting}
                    style={styles.submitButton}
                    labelStyle={{ fontWeight: 'bold' }}
                 >
                    Criar Votação
                 </Button>
              </ScrollView>
           </Modal>
        </Portal>

      </View>
      
      <BottomMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  container: { flex: 1, paddingHorizontal: 16 },

  // Botão Novo
  addButton: {
    borderRadius: 30,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#0095FF',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },

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
      fontWeight: '600', // Título em destaque (Semi-bold)
      color: '#1A1A1A',
      marginBottom: 4
  },
  votationDate: {
      fontSize: 12,
      color: '#8E8E93'
  },
  votationDesc: {
      fontSize: 14,
      color: '#555',
      lineHeight: 20
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
      textAlign: 'right'
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

  // Modal
  modalContainer: {
      backgroundColor: '#FFF',
      borderRadius: 16,
      padding: 20,
      margin: 20
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1A1A1A'
  },
  input: {
      marginBottom: 16,
      backgroundColor: '#FFF',
      fontSize: 14
  },
  labelDate: {
      fontSize: 14,
      color: '#666',
      marginBottom: 6,
      marginLeft: 4
  },
  submitButton: {
      marginTop: 8,
      borderRadius: 8,
      backgroundColor: '#0095FF'
  }
});