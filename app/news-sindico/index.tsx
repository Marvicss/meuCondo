import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { SvgXml } from 'react-native-svg';

// --- Ícones ---
const Icones = {
  plus: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
    viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" 
    stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
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
  title?: string; 
  message: string;
  createdAt: string;
};

const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

// --- Componente Card Ajustado ---
const AvisoCard = ({ item, onRemove, theme }: { item: Aviso, onRemove: (id: string) => void, theme: any }) => {
    // Usa a mensagem como título principal se não houver título
    const displayTitle = item.title || (item.message.length > 50 ? item.message.substring(0, 50) + "..." : item.message);
    const displayMessage = item.title ? item.message : (item.message.length > 50 ? item.message : "");

    return (
      <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
        <View style={[styles.cardIndicator, { backgroundColor: theme.colors.primary }]} />
        <View style={styles.cardContent}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                {displayTitle}
            </Text>
            
            <Text style={[styles.cardCategory, { color: theme.colors.primary }]}>
                {capitalize(item.type)}
            </Text>
            
            {!!displayMessage && (
                 <Text style={[styles.cardMessage, { color: theme.colors.onSurfaceVariant }]}>{displayMessage}</Text>
            )}
            
            <Text style={[styles.cardDetails, { color: theme.colors.onSurfaceVariant }]}>
              Data: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          
          <View style={styles.cardActions}>
            {/* CORREÇÃO 1: Cor do botão 'Remover' fixada em Vermelho Vivo (#FF3B30) para não ficar cinza no modo escuro */}
            <TouchableOpacity style={[styles.cardButton, styles.removeButton, { backgroundColor: '#FF3B30' }]} onPress={() => onRemove(item.id)}>
              <SvgXml xml={Icones.remove} width="16" height="16" />
              <Text style={styles.cardButtonText}>Remover</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
};

const QuadroDeAvisosScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filtroCategoria, setFiltroCategoria] = useState('all');

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

          if (!response.ok) throw new Error('Falha ao carregar os avisos.');
          
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

  const avisosFiltrados = useMemo(() => {
    return avisos.filter(aviso => {
        const passaCategoria = filtroCategoria === 'all' || aviso.type.toLowerCase() === filtroCategoria.toLowerCase();
        return passaCategoria;
    });
  }, [avisos, filtroCategoria]);

  
  const handleRemove = (id: string) => {
    Alert.alert("Confirmar Remoção", "Deseja remover este aviso?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;
            const response = await fetch(`https://meu-condo.onrender.com/news/${id}`, {
              method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Falha ao remover.");
            setAvisos(prev => prev.filter(a => a.id !== id));
            Alert.alert("Sucesso", "Aviso removido.");
          } catch (error) {
            Alert.alert("Erro", "Não foi possível remover.");
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centeredScreen, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
      <View style={styles.container}>
        
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>Quadro de Avisos</Text>

        <TouchableOpacity 
            style={[styles.novoAvisoButton, { backgroundColor: theme.colors.primary }]} 
            onPress={() => router.push('/news-sindico/adicionar-aviso')}
        >
          <SvgXml xml={Icones.plus} width="24" height="24" />
          <Text style={[styles.novoAvisoButtonText, { color: theme.colors.onPrimary }]}>Novo Aviso</Text>
        </TouchableOpacity>

        <Text style={[styles.subHeaderTitle, { color: theme.colors.onBackground }]}>Lançamentos recentes</Text>

        {/* --- FILTROS (CORRIGIDO PARA TEMA ESCURO) --- */}
        <View style={styles.filterContainer}>
            <View style={[styles.pillFilter, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface, flex: 1 }]}>
                <Picker
                    selectedValue={filtroCategoria}
                    onValueChange={(val) => setFiltroCategoria(val)}
                    // Cor do texto quando FECHADO (Branco no Dark Mode)
                    style={{ color: theme.colors.onSurface }}
                    mode="dropdown"
                    dropdownIconColor={theme.colors.onSurface}
                >
                    {/* CORREÇÃO 2: Cor do texto quando ABERTO (Sempre Preto, pois o fundo do popup é branco) */}
                    <Picker.Item label="Todas as Categorias" value="all" color="#000000" style={{ fontSize: 14 }} />
                    <Picker.Item label="Geral" value="general" color="#000000" style={{ fontSize: 14 }} />
                    <Picker.Item label="Urgente" value="urgent" color="#000000" style={{ fontSize: 14 }} />
                    <Picker.Item label="Manutenção" value="maintenance" color="#000000" style={{ fontSize: 14 }} />
                    <Picker.Item label="Eventos" value="events" color="#000000" style={{ fontSize: 14 }} />
                </Picker>
            </View>
        </View>

        <FlatList
          data={avisosFiltrados}
          renderItem={({ item }) => <AvisoCard item={item} onRemove={handleRemove} theme={theme} />}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={() => (
            <View style={styles.centeredScreen}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Nenhum aviso encontrado.</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 10, fontSize: 16 },
  
  headerTitle: { 
    fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, 
    marginTop: Platform.OS === 'android' ? 40 : 10 
  },
  
  novoAvisoButton: { borderRadius: 12, paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 3 },
  novoAvisoButtonText: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  subHeaderTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },

  // Estilos dos Filtros
  filterContainer: { flexDirection: 'row', marginBottom: 20 },
  pillFilter: { 
    borderWidth: 1, 
    borderRadius: 25, 
    height: 50, 
    justifyContent: 'center', 
    overflow: 'hidden',
    paddingLeft: 5
  },
  
  // Estilos do Card
  cardContainer: { borderRadius: 12, marginBottom: 15, flexDirection: 'row', overflow: 'hidden', borderWidth: 1 },
  cardIndicator: { width: 8 },
  cardContent: { flex: 1, padding: 15, justifyContent: 'space-between' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 }, 
  cardCategory: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', opacity: 0.8 },
  cardMessage: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  cardDetails: { fontSize: 12 },
  cardActions: { flexDirection: 'row', marginTop: 15, justifyContent: 'flex-end' },
  cardButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 10 },
  removeButton: { },
  cardButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14, marginLeft: 6 },
});

export default QuadroDeAvisosScreen;
