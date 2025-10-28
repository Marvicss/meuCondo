import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';

// --- Ícones (SVG como strings) ---
const Icones = {
  plus: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
    viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" 
    stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `,
  edit: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
    viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" 
    stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 
      2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 
      3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  `,
  remove: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
    viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" 
    stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 
      2H7a2 2 0 0 1-2-2V6m3 
      0V4a2 2 0 0 1 2-2h4a2 
      2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  `,
};

type Aviso = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

const AvisoCard = ({
  item,
  onEdit,
  onRemove,
}: {
  item: Aviso;
  onEdit: (item: Aviso) => void;
  onRemove: (id: string) => void;
}) => (
  <View style={styles.cardContainer}>
    <View style={styles.cardIndicator} />
    <View style={styles.cardContent}>
      <View>
        <Text style={styles.cardTitle}>{capitalize(item.type)}</Text>
        <Text style={styles.cardMessage}>{item.message}</Text>
        <Text style={styles.cardDetails}>
          Publicado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.cardButton, styles.editButton]}
          onPress={() => onEdit(item)}
        >
          <SvgXml xml={Icones.edit} width="16" height="16" />
          <Text style={styles.cardButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cardButton, styles.removeButton]}
          onPress={() => onRemove(item.id)}
        >
          <SvgXml xml={Icones.remove} width="16" height="16" />
          <Text style={styles.cardButtonText}>Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const QuadroDeAvisosScreen = () => {
  const router = useRouter();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchAvisos = async () => {
        setLoading(true);
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            Alert.alert(
              'Autenticação Necessária',
              'Por favor, faça o login para continuar.'
            );
            router.replace('/login');
            return;
          }

          const response = await fetch('https://meu-condo.onrender.com/news', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            throw new Error('Falha ao carregar os avisos.');
          }

          const data: Aviso[] = await response.json();
          setAvisos(
            data.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
          );
        } catch (error) {
          console.error('Falha ao buscar avisos:', error);
          Alert.alert('Erro', 'Não foi possível carregar os avisos.');
        } finally {
          setLoading(false);
        }
      };

      fetchAvisos();
    }, [router])
  );

  const handleRemove = (id: string) => {
    Alert.alert('Confirmar Remoção', 'Você tem certeza que deseja remover este aviso?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
              Alert.alert('Sessão Expirada', 'Faça login novamente.');
              router.replace('/login');
              return;
            }

            const response = await fetch(
              `https://meu-condo.onrender.com/news/${id}`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (!response.ok) {
              throw new Error('Falha ao remover o aviso.');
            }

            setAvisos(prevAvisos =>
              prevAvisos.filter(aviso => aviso.id !== id)
            );
            Alert.alert('Sucesso', 'Aviso removido.');
          } catch (error: any) {
            console.error('Erro ao remover aviso:', error);
            Alert.alert('Erro', error.message || 'Não foi possível remover o aviso.');
          }
        },
      },
    ]);
  };

  const handleEdit = (item: Aviso) => {
    Alert.alert('Funcionalidade em Desenvolvimento', 'A edição de avisos estará disponível em breve.');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <ActivityIndicator size="large" color="#0095FF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* --- Cabeçalho com sombra --- */}
        <View style={styles.headerContainerComSombra}>
          <Text style={styles.headerTitle}>Quadro de Avisos</Text>
        </View>

        <TouchableOpacity
          style={styles.novoAvisoButton}
          onPress={() => router.push('/news-sindico/adicionar-aviso')}
        >
          <SvgXml xml={Icones.plus} width="24" height="24" />
          <Text style={styles.novoAvisoButtonText}>Novo Aviso</Text>
        </TouchableOpacity>

        <Text style={styles.subHeaderTitle}>Avisos Recentes</Text>

        <FlatList
          data={avisos}
          renderItem={({ item }) => (
            <AvisoCard item={item} onEdit={handleEdit} onRemove={handleRemove} />
          )}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={() => (
            <View style={styles.centeredScreen}>
              <Text>Nenhum aviso encontrado.</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5F7' },
  container: { flex: 1, paddingHorizontal: 20 },
  centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#333' },

  headerContainerComSombra: {
    backgroundColor: '#F4F5F7',
    paddingTop: 20,
    paddingBottom: 25,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },

  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  novoAvisoButton: {
    backgroundColor: '#0095FF',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 3,
  },
  novoAvisoButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  subHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#444', marginBottom: 15 },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cardIndicator: { width: 8, backgroundColor: '#0095FF' },
  cardContent: { flex: 1, padding: 15, justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  cardMessage: { fontSize: 14, color: '#666', marginBottom: 8, lineHeight: 20 },
  cardDetails: { fontSize: 12, color: '#888' },
  cardActions: { flexDirection: 'row', marginTop: 15 },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  editButton: { backgroundColor: '#0095FF' },
  removeButton: { backgroundColor: '#FF3B30' },
  cardButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14, marginLeft: 6 },
});

export default QuadroDeAvisosScreen;
