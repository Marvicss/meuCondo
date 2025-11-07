import BottomMenu from '@/components/BottomMenu';
import { API_URL } from '@/constants/envs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  ListRenderItemInfo,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';



// --- 1. TIPOS DE DADOS ATUALIZADOS ---
type Ocorrencia = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  userId: string;
  criticality: string; // <- Campo que será usado
  condominiumId: string;
  createdAt: string;
  updatedAt: string;
};

// Objeto "enriquecido" que será usado na lista
type OcorrenciaComAutor = Ocorrencia & {
  authorName: string;
  apartmentNumber: string | number;
};

// Tipos para as respostas das chamadas GET (mais completos)
type UserData = {
  id: string;
  fullName: string;
  apartmentId: string;
};

type ApartmentData = {
  id: string;
  number: number;
  condominiumId: string;
};

type OcorrenciaCardProps = {
  item: OcorrenciaComAutor; // <- Usará o tipo enriquecido
};

interface DecodedToken {
  userId: string;
  email: string;
  userType: string;
  iat: number;
  exp: number;
}

type NovaOcorrenciaInputProps = {
  onPublicar: (data: { title: string; description: string }) => Promise<void>;
  isPosting: boolean;
};

// --- FUNÇÃO DE TEMPO RELATIVO ---
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

// --- ALTERAÇÃO 1: FUNÇÕES PARA COR DA CRITICIDADE ---
const CRITICALITY_COLORS = {
  alto: '#E53935',    // Vermelho
  medio: '#FFA726',   // Laranja
  baixo: '#66BB6A',   // Verde
  default: '#E0E0E0', // Cinza claro
};

const getCriticalityColor = (criticality: string): string => {
  // Normaliza a string para minúsculas
  const key = criticality?.toLowerCase() as keyof typeof CRITICALITY_COLORS;
  // Retorna a cor correspondente ou a cor padrão
  return CRITICALITY_COLORS[key] || CRITICALITY_COLORS.default;
};
// --- FIM DA ALTERAÇÃO 1 ---


// --- 2. COMPONENTE CARD ATUALIZADO PARA DADOS DINÂMICOS ---
const OcorrenciaCard: React.FC<OcorrenciaCardProps> = ({ item }) => {
  
  // --- ALTERAÇÃO 2: APLICAR COR DA BARRA ---
  // 1. Obtém a cor com base na criticidade
  const barColor = getCriticalityColor(item.criticality);

  // 2. Cria o estilo dinâmico para o card
  const cardStyle = [
    styles.card, // Mantém todos os estilos originais
    {
      borderLeftWidth: 6,       // Define a largura da barra lateral
      borderLeftColor: barColor,  // Define a cor dinâmica da barra
    },
  ];
  // --- FIM DA ALTERAÇÃO 2 ---

  return (
    // 3. Aplica o novo array de estilos ao Card
    <Card style={cardStyle}> 
      <Card.Title
        title={`${item.authorName} apt ${item.apartmentNumber}`} // <- Título agora é dinâmico
        subtitle={formatTimeAgo(item.createdAt)}
        titleStyle={styles.autor}
        subtitleStyle={styles.subtitle}
        left={(props) => <View {...props} style={styles.avatar} />}
      />
      <Card.Content>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text variant="bodyMedium" style={styles.texto}>{item.description}</Text>
      </Card.Content>
    </Card>
  );
};

// --- COMPONENTE INPUT (Sem alterações) ---
const NovaOcorrenciaInput: React.FC<NovaOcorrenciaInputProps> = ({ onPublicar, isPosting }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handlePublicar = (): void => {
    if (title.trim() && description.trim() && !isPosting) {
      onPublicar({ title, description }).then(() => {
        setTitle('');
        setDescription('');
      });
    }
  };

  return (
    <Card style={styles.inputCard}>
      <View style={styles.inputContainer}>
        <View style={styles.avatar} />
        <View style={styles.textInputWrapper}>
          <TextInput
            style={[styles.textInput, styles.titleInput]}
            placeholder="Título da ocorrência"
            value={title}
            onChangeText={setTitle}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          <View style={styles.divider} />
          <TextInput
            style={styles.textInput}
            placeholder="No que você está pensando?"
            value={description}
            onChangeText={setDescription}
            multiline
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
        </View>
      </View>
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="contained"
          onPress={handlePublicar}
          style={styles.publicarButton}
          disabled={!title.trim() || !description.trim() || isPosting}
          loading={isPosting}
        >
          {isPosting ? 'Publicando...' : 'Publicar'}
        </Button>
      </Card.Actions>
    </Card>
  );
};

// --- TELA PRINCIPAL ---
export default function OcorrenciasScreen() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaComAutor[]>([]); // <- Usa o novo tipo
  const [loading, setLoading] = useState<boolean>(true);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const { colors } = useTheme();
  const router = useRouter();

  // --- 3. FUNÇÃO DE BUSCA ATUALIZADA PARA ENRIQUECER DADOS ---
  const fetchOcorrencias = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace('/login');
        return;
      }
      const headers = { 'Authorization': `Bearer ${token}` };

      // Etapa 1: Buscar a lista de ocorrências
      const response = await fetch(`${API_URL}/occurrences/`, { headers });
      if (!response.ok) throw new Error('Falha ao buscar ocorrências.');
      const data: Ocorrencia[] = await response.json();

      // Etapa 2: Enriquecer os dados com informações do autor
      const userCache = new Map<string, { name: string; apt: number }>();

      const enrichedDataPromises = data.map(async (ocorrencia) => {
        try {
          // Verifica se já temos os dados deste usuário no cache
          if (userCache.has(ocorrencia.userId)) {
            const cachedUser = userCache.get(ocorrencia.userId)!;
            return {
              ...ocorrencia,
              authorName: cachedUser.name,
              apartmentNumber: cachedUser.apt,
            };
          }

          // Se não, busca os dados
          const userResponse = await fetch(`${API_URL}/users/${ocorrencia.userId}`, { headers });
          if (!userResponse.ok) throw new Error();
          const userData: UserData = await userResponse.json();

          const apartmentResponse = await fetch(`${API_URL}/apartments/${userData.apartmentId}`, { headers });
          if (!apartmentResponse.ok) throw new Error();
          const apartmentData: ApartmentData = await apartmentResponse.json();

          // Armazena no cache para o próximo uso
          userCache.set(ocorrencia.userId, { name: userData.fullName, apt: apartmentData.number });

          return {
            ...ocorrencia,
            authorName: userData.fullName,
            apartmentNumber: apartmentData.number,
          };
        } catch (e) {
          // Se falhar em buscar um autor, define um valor padrão para não quebrar a lista
          return {
            ...ocorrencia,
            authorName: 'Morador não identificado',
            apartmentNumber: 'N/A',
          };
        }
      });

      const enrichedData = await Promise.all(enrichedDataPromises);

      setOcorrencias(enrichedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    } catch (error) {
      console.error("Erro ao buscar ocorrências:", error);
      Alert.alert("Erro", "Não foi possível carregar as ocorrências.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOcorrencias();
  }, []);

  // --- FUNÇÃO PARA CRIAR OCORRÊNCIA (Sem alterações) ---
  const handlePublicar = async ({ title, description }: { title: string; description: string }) => {
    setIsPosting(true);
    Keyboard.dismiss();

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Sessão expirada", "Faça o login novamente.");
        router.replace('/login');
        setIsPosting(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const decodedToken = jwtDecode<DecodedToken>(token);
      const userId = decodedToken.userId;

      const userResponse = await fetch(`${API_URL}/users/${userId}`, { headers });
      if (!userResponse.ok) throw new Error('Não foi possível encontrar os dados do usuário.');
      const userData: UserData = await userResponse.json();
      const { apartmentId } = userData;

      if (!apartmentId) throw new Error('Usuário não associado a um apartamento.');

      const apartmentResponse = await fetch(`${API_URL}/apartments/${apartmentId}`, { headers });
      if (!apartmentResponse.ok) throw new Error('Não foi possível encontrar os dados do apartamento.');
      const apartmentData: ApartmentData = await apartmentResponse.json();
      const { condominiumId } = apartmentData;

      const body = {
        title,
        description,
        type: "OTHERS",
        condominiumId,
      };

      const occurrenceResponse = await fetch(`${API_URL}/occurrences`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      console.log('Occurrence Response Status:', occurrenceResponse.status);
      const responseParsed = await occurrenceResponse.json();
      console.log('Occurrence Response Body:', responseParsed);

      if (!occurrenceResponse.ok) {
        throw new Error('Falha ao criar a ocorrência.');
      }

      Alert.alert("Sucesso!", "Sua ocorrência foi publicada.");
      await fetchOcorrencias();

    } catch (error: any) {
      console.error("Erro ao publicar ocorrência:", error);
      Alert.alert("Erro ao Publicar", error.message || "Não foi possível publicar a ocorrência. Tente novamente.");
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F4F6F8' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1 }}>
        <FlatList
          data={ocorrencias}
          renderItem={renderOcorrencia}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <Text style={styles.headerTitle}>Ocorrências</Text>
              <NovaOcorrenciaInput onPublicar={handlePublicar} isPosting={isPosting} />
            </>
          }
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchOcorrencias}
          refreshing={loading}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
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

// --- ESTILOS (Sem alterações) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 20,
  },
  inputCard: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  textInputWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  textInput: {
    backgroundColor: 'transparent',
    fontSize: 16,
    paddingHorizontal: 0,
    minHeight: 50,
  },
  titleInput: {
    fontWeight: 'bold',
    minHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginVertical: 8,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingRight: 12,
    paddingBottom: 12,
  },
  publicarButton: {
    borderRadius: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // A borda será adicionada dinamicamente no componente
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  autor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  texto: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  bottomMenuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 5,
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});