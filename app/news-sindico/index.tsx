import BottomMenu from '@/components/BottomMenu';
import { API_URL } from '@/constants/envs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Appbar, Card, Divider, IconButton, Text, useTheme } from 'react-native-paper';
import { SvgXml } from 'react-native-svg';

// --- Ícones SVG ---
const IconPlus = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
`;

type Aviso = {
  id: string;
  type: string;
  title?: string; 
  message: string;
  createdAt: string;
};

const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

// --- Componente Card Moderno e Fino ---
const AvisoCard = ({ item, onRemove, theme }: { item: Aviso, onRemove: (id: string) => void, theme: any }) => {
  const displayTitle = item.title || "Aviso";
  
  // --- TRADUÇÃO DAS CATEGORIAS ---
  let categoryLabel = capitalize(item.type);
  const typeLower = item.type.toLowerCase();
  if (typeLower === 'urgent') categoryLabel = 'Urgente';
  if (typeLower === 'maintenance') categoryLabel = 'Manutenção';
  if (typeLower === 'events') categoryLabel = 'Eventos';
  if (typeLower === 'general') categoryLabel = 'Geral';

  // Cores
  const isUrgent = typeLower === 'urgent' || typeLower === 'urgente';
  const categoryColor = isUrgent ? theme.colors.error : theme.colors.primary;

  return (
    <Card style={[styles.cardClean, { backgroundColor: theme.colors.surface }]} mode="elevated">
      <View style={styles.cardInner}>
        
        {/* Linha Superior: Categoria e Botão Deletar */}
        <View style={styles.cardHeaderRow}>
             <View style={{ flex: 1 }}>
                {/* Categoria como Título Superior */}
                <Text style={{ color: categoryColor, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {categoryLabel}
                </Text>
                {/* Título Principal */}
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600', marginTop: 2 }}>
                    {displayTitle}
                </Text>
             </View>
             
             {/* Botão Remover (Alinhado ao topo direita) */}
             <IconButton 
                icon="delete-outline" 
                iconColor={theme.colors.error}
                size={20}
                onPress={() => onRemove(item.id)}
                style={{ margin: 0, marginTop: -6, marginRight: -8 }}
            />
        </View>

        {/* Data Pequena */}
        <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 2, marginBottom: 8 }}>
            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
        </Text>

        <Divider style={{ backgroundColor: '#F0F0F0', marginBottom: 8 }} />

        {/* Mensagem */}
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
            {item.message}
        </Text>

      </View>
    </Card>
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
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            router.replace('/login');
            return;
          }
          const response = await fetch(`${API_URL}/news`, {
            headers: { "Authorization": `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Falha ao carregar avisos.');
          const data: Aviso[] = await response.json();
          setAvisos(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
           // Silent fail
        } finally {
          setLoading(false);
        }
      };
      fetchAvisos();
    }, [router])
  );

  const avisosFiltrados = useMemo(() => {
    return avisos.filter(aviso => {
        const typeLower = aviso.type.toLowerCase();
        
        // Lógica para o filtro funcionar com inglês ou português
        let typeMatch = typeLower;
        if (typeLower === 'urgent') typeMatch = 'urgente';
        if (typeLower === 'maintenance') typeMatch = 'manutencao';
        if (typeLower === 'events') typeMatch = 'eventos';
        if (typeLower === 'general') typeMatch = 'geral';

        const passaCategoria = filtroCategoria === 'all' || typeMatch.includes(filtroCategoria) || typeLower === filtroCategoria;
        return passaCategoria;
    });
  }, [avisos, filtroCategoria]);
  
  const handleRemove = (id: string) => {
    Alert.alert("Excluir Aviso", "Deseja apagar este aviso?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Apagar", style: "destructive", onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) return;
              const response = await fetch(`${API_URL}/news/${id}`, {
                  method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
              });
              if (!response.ok) throw new Error("Falha");
              setAvisos(prev => prev.filter(a => a.id !== id));
            } catch (error) { Alert.alert("Erro", "Não foi possível remover."); }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centeredScreen, { backgroundColor: '#F8F9FA' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const pickerTextColor = theme.dark ? '#FFFFFF' : '#000000';
  const primaryColor = '#0095FF';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F8F9FA' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Header Modificado: Centralizado e sem botão de voltar */}
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: '#F8F9FA', elevation: 0 }}>
         <Appbar.Content 
            title="Quadro de Avisos" 
            titleStyle={{ fontWeight: '400', fontSize: 18, color: '#1A1A1A' }} 
         />
      </Appbar.Header>

      {/* Container principal ajustado para empurrar o menu para baixo */}
      <View style={styles.mainContent}>
        <View style={styles.container}>
            
            <TouchableOpacity 
                style={[styles.novoAvisoButton, { backgroundColor: primaryColor }]} 
                onPress={() => router.push('/news-sindico/adicionar-aviso')}
                activeOpacity={0.9}
            >
            <SvgXml xml={IconPlus} width="20" height="20" />
            <Text style={styles.novoAvisoButtonText}>Publicar Novo Aviso</Text>
            </TouchableOpacity>

            {/* Título da Seção */}
            <Text variant="titleMedium" style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: 8 }}>Recentes</Text>
                
            {/* --- FILTRO DE LARGURA TOTAL E ALTURA CORRIGIDA --- */}
            <View style={[styles.filterWrapper, { borderColor: theme.colors.outline }]}>
                <Picker
                    selectedValue={filtroCategoria}
                    onValueChange={(val) => setFiltroCategoria(val)}
                    // Altura 56 e width 100%
                    style={{ color: theme.colors.onSurface, height: 56, width: '100%' }}
                    mode="dropdown"
                    dropdownIconColor={theme.colors.onSurface}
                >
                    <Picker.Item label="Todas as categorias" value="all" style={{ fontSize: 16 }} color={pickerTextColor}/>
                    <Picker.Item label="Geral" value="general" style={{ fontSize: 16 }} color={pickerTextColor}/>
                    <Picker.Item label="Urgente" value="urgent" style={{ fontSize: 16 }} color={pickerTextColor}/>
                    <Picker.Item label="Manutenção" value="manutencao" style={{ fontSize: 16 }} color={pickerTextColor}/>
                    <Picker.Item label="Eventos" value="events" style={{ fontSize: 16 }} color={pickerTextColor}/>
                </Picker>
            </View>

            <FlatList
            data={avisosFiltrados}
            renderItem={({ item }) => <AvisoCard item={item} onRemove={handleRemove} theme={theme} />}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
                <View style={styles.centeredScreen}>
                <Text style={{ color: '#8E8E93', marginTop: 40, fontSize: 14 }}>Nenhum aviso encontrado.</Text>
                </View>
            )}
            />
        </View>

        {/* Menu Inferior Adicionado */}
        <BottomMenu />
      </View>
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  // Estilo para garantir que o menu fique no final
  mainContent: { flex: 1, justifyContent: 'space-between' },
  
  container: { flex: 1, paddingHorizontal: 20 },
  centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  novoAvisoButton: { 
    borderRadius: 30, 
    paddingVertical: 12, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20, 
    elevation: 2,
    shadowColor: '#0095FF',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginTop: 10
  },
  novoAvisoButtonText: { 
      color: 'white', 
      fontSize: 15, 
      fontWeight: '500', 
      marginLeft: 8 
  },

  // Filtro Modificado (Altura e Largura)
  filterWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    height: 56, // Altura aumentada
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    width: '100%', // Largura total
    marginBottom: 16 
  },

  // Card
  cardClean: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1, 
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardInner: {
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});

export default QuadroDeAvisosScreen;