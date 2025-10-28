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
  Menu,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  item: OcorrenciaComAutor;
};

interface DecodedToken {
  userId: string;
  email: string;
  userType: string;
  iat: number;
  exp: number;
}

type NovaOcorrenciaInputProps = {
  onPublicar: (data: { title: string; description: string; type: string }) => Promise<void>;
  isPosting: boolean;
  avatarUrl?: string;
};

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

const CRITICALITY_COLORS = {
  alto: '#E53935',
  medio: '#FFA726',
  baixo: '#66BB6A',
  default: '#E0E0E0',
};

const getCriticalityColor = (criticality: string): string => {
  const key = criticality?.toLowerCase() as keyof typeof CRITICALITY_COLORS;
  return CRITICALITY_COLORS[key] || CRITICALITY_COLORS.default;
};

const OcorrenciaCard: React.FC<OcorrenciaCardProps> = ({ item }) => {
  const barColor = getCriticalityColor(item.criticality);
  const cardStyle = [
    styles.card,
    {
      borderLeftWidth: 6,
      borderLeftColor: barColor,
    },
  ];

  return (
    <Card style={cardStyle}>
      <Card.Title
        title={
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.autor}>{item.authorName}</Text>
            <Text style={styles.apartment}>{`apt ${item.apartmentNumber}`}</Text>
          </View>
        }
        subtitle={formatTimeAgo(item.createdAt)}
        subtitleStyle={styles.subtitle}
        left={(props) =>
          item.authorAvatarUrl ? (
            <Image
              {...props}
              source={{ uri: item.authorAvatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <View {...props} style={styles.avatar} />
          )
        }
      />
      <Card.Content>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text variant="bodyMedium" style={styles.texto}>
          {item.description}
        </Text>
      </Card.Content>
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
    <Card style={styles.inputCard}>
      <View style={styles.inputContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar} />
        )}
        <View style={styles.textInputWrapper}>
          <TextInput
            style={[styles.textInput, styles.titleInput]}
            placeholder="Título da ocorrência"
            placeholderTextColor="#444"
            selectionColor="#0A84FF"
            value={title}
            onChangeText={setTitle}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            mode="flat"
            textColor="#000"
            theme={{ colors: { text: '#000', placeholder: '#444' } }}
          />
          <View style={styles.divider} />
          <TextInput
            style={styles.textInput}
            placeholder="Descreva sua ocorrência"
            placeholderTextColor="#444"
            selectionColor="#0A84FF"
            value={description}
            onChangeText={setDescription}
            multiline
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            mode="flat"
            textColor="#000"
            theme={{ colors: { text: '#000', placeholder: '#444' } }}
          />

          <Text style={{ marginTop: 10, marginBottom: 8, fontWeight: '600', color: '#333' }}>
            Selecione o tipo da ocorrência
          </Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity style={styles.pickerField} onPress={() => setMenuVisible(true)}>
                <Text style={styles.pickerText}>{selectedLabel}</Text>
                <Text style={styles.pickerChevron}>▾</Text>
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

export default function OcorrenciasScreen() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaComAutor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [userType, setUserType] = useState<string>('USER');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | undefined>(undefined);
  const { colors } = useTheme();
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
            return {
              ...ocorrencia,
              authorName: cachedUser.name,
              apartmentNumber: cachedUser.apt,
              authorAvatarUrl: cachedUser.avatarUrl,
            };
          }

          const userResponse = await fetch(`${API_URL}/users/${ocorrencia.userId}`, { headers });
          if (!userResponse.ok) throw new Error();
          const userData: UserData = await userResponse.json();

          const apartmentResponse = await fetch(
            `${API_URL}/apartments/${userData.apartmentId}`,
            { headers }
          );
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
          } catch (e) {
            avatarUrl = undefined;
          }

          userCache.set(ocorrencia.userId, { name: userData.fullName, apt: apartmentData.number, avatarUrl });

          return {
            ...ocorrencia,
            authorName: userData.fullName,
            apartmentNumber: apartmentData.number,
            authorAvatarUrl: avatarUrl,
          };
        } catch (e) {
          return {
            ...ocorrencia,
            authorName: 'Morador não identificado',
            apartmentNumber: 'N/A',
            authorAvatarUrl: undefined,
          };
        }
      });

      const enrichedData = await Promise.all(enrichedDataPromises);
      setOcorrencias(
        enrichedData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error('Erro ao buscar ocorrências:', error);
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

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const decodedToken = jwtDecode<DecodedToken>(token);
      const userId = decodedToken.userId;

      const userResponse = await fetch(`${API_URL}/users/${userId}`, {
        headers,
      });
      if (!userResponse.ok)
        throw new Error('Não foi possível encontrar os dados do usuário.');
      const userData: UserData = await userResponse.json();
      const { apartmentId } = userData;

      if (!apartmentId)
        throw new Error('Usuário não associado a um apartamento.');

      const apartmentResponse = await fetch(
        `${API_URL}/apartments/${apartmentId}`,
        { headers }
      );
      if (!apartmentResponse.ok)
        throw new Error('Não foi possível encontrar os dados do apartamento.');
      const apartmentData: ApartmentData = await apartmentResponse.json();
      const { condominiumId } = apartmentData;

      const body = {
        title,
        description,
        type,
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
        const serverMessage = responseParsed?.message || responseParsed?.error || JSON.stringify(responseParsed);
        console.error('Erro ao criar ocorrência:', serverMessage);
        Alert.alert('Erro ao publicar', serverMessage);
        throw new Error(serverMessage);
      }

      Alert.alert('Sucesso!', 'Sua ocorrência foi publicada.');
      await fetchOcorrencias();
    } catch (error: any) {
      console.error('Erro ao publicar ocorrência:', error);
      Alert.alert(
        'Erro ao Publicar',
        error.message || 'Não foi possível publicar a ocorrência.'
      );
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
              <Text style={styles.headerTitle}>
                {userType === 'ADMIN' ? 'Todas as Ocorrências' : 'Minhas Ocorrências'}
              </Text>
              <NovaOcorrenciaInput onPublicar={handlePublicar} isPosting={isPosting} avatarUrl={currentUserAvatar} />
                <View style={styles.headerContainerComSombra}>
                  <Text style={styles.headerTitle}>
                    {userType === 'ADMIN' ? 'Todas as Ocorrências' : 'Minhas Ocorrências'}
                  </Text>
                </View>
                <NovaOcorrenciaInput
                  onPublicar={handlePublicar}
                  isPosting={isPosting}
                  avatarUrl={currentUserAvatar}
                />
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
                <Text style={styles.emptyText}>
                  Nenhuma ocorrência encontrada.
                </Text>
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
    paddingBottom: 120,
  },
  headerContainerComSombra: {
    backgroundColor: '#F4F6F8',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
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
    backgroundColor: '#F4F6F8',
    color: '#111',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6EBF0',
    minHeight: 50,
  },
  titleInput: {
    fontWeight: '700',
    minHeight: 44,
    fontSize: 17,
    paddingVertical: 8,
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
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  autor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  apartment: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  texto: {
    fontSize: 15,
    lineHeight: 22,
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
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
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F6F8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6EBF0',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    color: '#111',
    fontSize: 15,
  },
  pickerChevron: {
    color: '#777',
    marginLeft: 8,
  },
});

const buildAvatarUrl = (avatarPath?: string | null): string | undefined => {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http')) return avatarPath;
  if (avatarPath.startsWith('/')) return `${API_URL}${avatarPath}`;
  return avatarPath;
};
