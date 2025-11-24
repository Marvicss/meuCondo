import BottomMenu from '@/components/BottomMenu';
import { API_URL } from '@/constants/envs';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  ListRenderItemInfo,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Divider,
  Menu,
  Text,
  TextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- TIPOS ---
type Ocorrencia = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  userId: string;
  criticality: string;
  condominiumId: string;
  createdAt: string;
  updatedAt: string;
};

type OcorrenciaComAutor = Ocorrencia & {
  authorName: string;
  apartmentNumber: string | number;
  authorAvatarUrl?: string;
};

type UserData = { id: string; fullName: string; apartmentId: string; };
type ApartmentData = { id: string; number: number; condominiumId: string; };
type OcorrenciaCardProps = { item: OcorrenciaComAutor; };
interface DecodedToken { userId: string; email: string; userType: string; iat: number; exp: number; }

type NovaOcorrenciaInputProps = {
  onPublicar: (data: { title: string; description: string; type: string }) => Promise<void>;
  isPosting: boolean;
  avatarUrl?: string;
};

// --- FUNÇÕES AUXILIARES ---

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return `há ${Math.floor(interval)} anos`;
  interval = seconds / 2592000;
  if (interval > 1) return `há ${Math.floor(interval)} meses`;
  interval = seconds / 86400;
  if (interval > 1) return `há ${Math.floor(interval)} dias`;
  interval = seconds / 3600;
  if (interval > 1) return `há ${Math.floor(interval)}h`;
  interval = seconds / 60;
  if (interval > 1) return `há ${Math.floor(interval)}min`;
  return `há poucos segundos`;
};

const buildAvatarUrl = (avatarPath?: string | null): string | undefined => {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http')) return avatarPath;
  if (avatarPath.startsWith('/')) return `${API_URL}${avatarPath}`;
  return avatarPath;
};

const getTranslatedType = (type: string): string => {
  const map: Record<string, string> = {
    'SUGGESTION': 'Sugestão',
    'COMPLAINT': 'Reclamação',
    'REQUEST': 'Pedido',
    'OTHERS': 'Outros'
  };
  return map[type] || type;
};

const formatAuthorName = (fullName: string): string => {
  if (!fullName) return 'Morador';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

// Agora retorna um par de cores: fundo claro (bg) e texto escuro (text)
const getCriticalityColors = (criticality: string) => {
  const level = criticality?.toLowerCase() || 'baixa'; 

  switch (level) {
    case 'alta': case 'alto': case 'high':
      // Vermelho Moderno: Fundo pálido, texto forte
      return { bg: '#FEF2F2', text: '#DC2626', label: 'Alta' }; 
    case 'media': case 'médio': case 'medio': case 'medium':
      // Laranja Moderno
      return { bg: '#FFF7ED', text: '#C2410C', label: 'Média' };
    case 'baixa': case 'baixo': case 'low':
      // Verde Moderno
      return { bg: '#F0FDF4', text: '#15803D', label: 'Baixa' };
    default:
      // Cinza Neutro
      return { bg: '#F3F4F6', text: '#374151', label: 'Desconhecida' };
  }
};

// --- COMPONENTES DE UI ---

const OcorrenciaCard: React.FC<OcorrenciaCardProps> = ({ item }) => {
  // Pega as cores de fundo (bg) e texto (text)
  const { bg, text, label } = getCriticalityColors(item.criticality);

  return (
    <Card style={styles.cardClean}>
      <View style={styles.cardContentWrapper}>
          <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  {item.authorAvatarUrl ? (
                      <Image source={{ uri: item.authorAvatarUrl }} style={styles.avatarSmall} />
                  ) : (
                      <View style={[styles.avatarSmall, { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
                          <Feather name="user" size={16} color="#666" />
                      </View>
                  )}
                  <View style={{ marginLeft: 10 }}>
                      <Text style={styles.authorName}>{formatAuthorName(item.authorName)}</Text>
                      {/* AQUI FOI FEITA A ALTERAÇÃO: REMOVIDO O APARTAMENTO */}
                      <Text style={styles.aptInfo}>
                        {getTranslatedType(item.type)}
                      </Text>
                  </View>
              </View>
              <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
          </View>

          <Divider style={{ marginVertical: 12, backgroundColor: '#F0F0F0' }} />

          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDesc}>{item.description}</Text>

          {/* CHIP DE CRITICIDADE MODERNO E CLEAN */}
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
               <View style={[styles.criticalityBadge, { backgroundColor: bg }]}>
                  {/* Um pequeno ponto colorido antes do texto para um visual premium */}
                  <View style={[styles.criticalityDot, { backgroundColor: text }]} />
                  <Text style={[styles.criticalityText, { color: text }]}>Criticidade {label}</Text>
               </View>
          </View>
      </View>
    </Card>
  );
};

const NovaOcorrenciaInput: React.FC<NovaOcorrenciaInputProps> = ({ onPublicar, isPosting, avatarUrl }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [occurrenceType, setOccurrenceType] = useState<'SUGGESTION'|'COMPLAINT'|'REQUEST'|'OTHERS'>('OTHERS');
  const [menuVisible, setMenuVisible] = useState(false);

  const occurrenceOptions = [
    { value: 'SUGGESTION', label: 'Sugestão' },
    { value: 'COMPLAINT', label: 'Reclamação' },
    { value: 'REQUEST', label: 'Pedido' },
    { value: 'OTHERS', label: 'Outros' },
  ];
  const selectedLabel = occurrenceOptions.find(o => o.value === occurrenceType)?.label || 'Selecione o tipo';
  
  const handlePublicar = (): void => {
    if (title.trim() && description.trim() && !isPosting) {
      onPublicar({ title, description, type: occurrenceType }).then(() => {
        setTitle('');
        setDescription('');
        setOccurrenceType('OTHERS');
      });
    }
  };

  return (
    <Card style={styles.inputCardClean}>
      <View style={styles.inputContent}>
        <Text style={styles.sectionTitle}>Nova Ocorrência</Text>

        <TextInput
            placeholder="Título da ocorrência"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.inputClean}
            outlineColor="#E0E0E0"
            activeOutlineColor="#0095FF"
            textColor="#1A1A1A"
            theme={{ colors: { background: '#FFFFFF' } }}
        />

        <TextInput
            placeholder="Descreva o que aconteceu..."
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.inputClean, { height: 80 }]}
            outlineColor="#E0E0E0"
            activeOutlineColor="#0095FF"
            textColor="#1A1A1A"
            theme={{ colors: { background: '#FFFFFF' } }}
        />

        <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity style={styles.pickerButton} onPress={() => setMenuVisible(true)}>
                <Text style={styles.pickerButtonText}>{selectedLabel}</Text>
                <Feather name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            }
        >
            {occurrenceOptions.map(opt => (
              <Menu.Item
                key={opt.value}
                onPress={() => { setOccurrenceType(opt.value as any); setMenuVisible(false); }}
                title={opt.label}
              />
            ))}
        </Menu>

        <Button
            mode="contained"
            onPress={handlePublicar}
            style={styles.publishButton}
            labelStyle={{ fontSize: 14, fontWeight: '600' }}
            disabled={!title.trim() || !description.trim() || isPosting}
            loading={isPosting}
            buttonColor="#0095FF"
        >
            {isPosting ? 'Publicando...' : 'Publicar'}
        </Button>
      </View>
    </Card>
  );
};

export default function OcorrenciasScreen() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaComAutor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [userType, setUserType] = useState<string>('USER');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | undefined>(undefined);
  const router = useRouter();

  const fetchOcorrencias = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const decodedToken = jwtDecode<DecodedToken>(token);
      setUserType(decodedToken.userType);

      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const avatarResponse = await fetch(`${API_URL}/users/${decodedToken.userId}/avatar`, { headers });
        if (avatarResponse.ok) {
          const avatarJson = await avatarResponse.json();
          const raw = avatarJson.avatarUrl || avatarJson.url || avatarJson.avatar;
          setCurrentUserAvatar(buildAvatarUrl(raw));
        } else {
          setCurrentUserAvatar(undefined);
        }
      } catch (e) {
        setCurrentUserAvatar(undefined);
      }

      const headers = { 'Authorization': `Bearer ${token}` };
      const endpoint = decodedToken.userType === 'ADMIN' 
        ? `${API_URL}/occurrences/`
        : `${API_URL}/occurrences/mines`;

      const response = await fetch(endpoint, { headers });
      if (!response.ok) throw new Error('Falha ao buscar ocorrências.');
      const data: Ocorrencia[] = await response.json();

      const userCache = new Map<string, { name: string; apt: number; avatarUrl?: string }>();

      const enrichedDataPromises = data.map(async (ocorrencia) => {
        try {
          if (userCache.has(ocorrencia.userId)) {
            const cachedUser = userCache.get(ocorrencia.userId)!;
            return { ...ocorrencia, authorName: cachedUser.name, apartmentNumber: cachedUser.apt, authorAvatarUrl: cachedUser.avatarUrl };
          }

          const userResponse = await fetch(`${API_URL}/users/${ocorrencia.userId}`, { headers });
          if (!userResponse.ok) throw new Error();
          const userData: UserData = await userResponse.json();

          const apartmentResponse = await fetch(`${API_URL}/apartments/${userData.apartmentId}`, { headers });
          if (!apartmentResponse.ok) throw new Error();
          const apartmentData: ApartmentData = await apartmentResponse.json();

          let avatarUrl: string | undefined;
          try {
            const avatarResponse = await fetch(`${API_URL}/users/${ocorrencia.userId}/avatar`, { headers });
            if (avatarResponse.ok) {
              const avatarJson = await avatarResponse.json();
              const raw = avatarJson.avatarUrl || avatarJson.url || avatarJson.avatar;
              avatarUrl = buildAvatarUrl(raw);
            }
          } catch (e) { avatarUrl = undefined; }

          userCache.set(ocorrencia.userId, { name: userData.fullName, apt: apartmentData.number, avatarUrl });

          return { ...ocorrencia, authorName: userData.fullName, apartmentNumber: apartmentData.number, authorAvatarUrl: avatarUrl };
        } catch (e) {
          return { ...ocorrencia, authorName: 'Morador', apartmentNumber: '-', authorAvatarUrl: undefined };
        }
      });

      const enrichedData = await Promise.all(enrichedDataPromises);
      setOcorrencias(enrichedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as ocorrências.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOcorrencias();
  }, []);

  const handlePublicar = async ({ title, description, type }: { title: string; description: string; type: string }) => {
    setIsPosting(true);
    Keyboard.dismiss();

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Sessão expirada', 'Faça o login novamente.');
        router.replace('/login');
        setIsPosting(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const decodedToken = jwtDecode<DecodedToken>(token);
      const userId = decodedToken.userId;

      const userResponse = await fetch(`${API_URL}/users/${userId}`, { headers });
      if (!userResponse.ok) throw new Error('Erro usuário.');
      const userData: UserData = await userResponse.json();
      const { apartmentId } = userData;

      if (!apartmentId) throw new Error('Sem apartamento.');

      const apartmentResponse = await fetch(`${API_URL}/apartments/${apartmentId}`, { headers });
      if (!apartmentResponse.ok) throw new Error('Erro apartamento.');
      const apartmentData: ApartmentData = await apartmentResponse.json();
      const { condominiumId } = apartmentData;

      const body = { title, description, type, condominiumId };

      const occurrenceResponse = await fetch(`${API_URL}/occurrences`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!occurrenceResponse.ok) throw new Error('Erro ao publicar.');

      Alert.alert('Sucesso!', 'Sua ocorrência foi publicada.');
      await fetchOcorrencias();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível publicar.');
    } finally {
      setIsPosting(false);
    }
  };

  const renderOcorrencia = ({ item }: ListRenderItemInfo<OcorrenciaComAutor>) => (
    <OcorrenciaCard item={item} />
  );

  if (loading && !ocorrencias.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0095FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F8F9FA' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER PERSONALIZADO */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Feather name="chevron-left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitleText}>Ocorrências</Text>
        
        <View style={styles.backButton} />
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={ocorrencias}
          renderItem={renderOcorrencia}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.headerContent}>
               <NovaOcorrenciaInput onPublicar={handlePublicar} isPosting={isPosting} avatarUrl={currentUserAvatar} />
               
               <Text style={styles.listTitle}>
                  {userType === 'ADMIN' ? 'Todas as Publicações' : 'Minhas Publicações'}
               </Text>
            </View>
          }
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchOcorrencias}
          refreshing={loading}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Feather name="clipboard" size={40} color="#E0E0E0" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyText}>Nenhuma ocorrência encontrada.</Text>
              </View>
            ) : null
          }
        />
        <BottomMenu />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  listContentContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  
  headerContent: { 
    marginTop: 16, 
    marginBottom: 8 
  },

  // --- HEADER CUSTOMIZADO ---
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  // --------------------------

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  
  listTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1A1A1A',
      marginTop: 24,
      marginBottom: 12,
      marginLeft: 4
  },

  // Input Clean
  inputCardClean: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  inputContent: {
      padding: 16,
  },
  inputClean: {
      backgroundColor: '#FFFFFF',
      marginBottom: 12,
      fontSize: 14,
  },
  pickerButton: {
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: '#FFFFFF'
  },
  pickerButtonText: {
      color: '#1A1A1A',
      fontSize: 14,
  },
  publishButton: {
      borderRadius: 30,
      paddingVertical: 6,
      elevation: 2,
      shadowColor: '#0095FF',
      shadowOpacity: 0.3,
  },

  // Card Clean
  cardClean: {
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden'
  },
  cardContentWrapper: {
      padding: 16
  },
  cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
  },
  avatarSmall: {
      width: 36,
      height: 36,
      borderRadius: 18,
  },
  authorName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1A1A1A'
  },
  aptInfo: {
      fontSize: 12,
      color: '#8E8E93'
  },
  timeAgo: {
      fontSize: 11,
      color: '#8E8E93',
      marginTop: 2
  },
  cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1A1A1A',
      marginBottom: 4
  },
  cardDesc: {
      fontSize: 14,
      color: '#555',
      lineHeight: 20
  },
  
  // --- ESTILOS DO NOVO CHIP CLEAN ---
  criticalityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20, // Formato pílula
      alignSelf: 'flex-start',
  },
  criticalityDot: {
      width: 6,
      height: 6,
      borderRadius: 3, // Bolinha perfeita
      marginRight: 6,
  },
  criticalityText: {
      fontSize: 12,
      fontWeight: '600',
      // A cor do texto é dinâmica agora
  },

  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});