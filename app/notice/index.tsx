import BottomMenu from '@/components/BottomMenu';
import { API_URL } from '@/constants/envs';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { Appbar, Card, Divider, Text, useTheme } from 'react-native-paper';

// --- TIPOS ---
type Aviso = {
  id: string;
  type: string;
  title?: string; 
  message: string;
  createdAt: string;
};

const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

// --- COMPONENTE CARD (VERSÃO LEITURA) ---
const AvisoCard = ({ item, theme }: { item: Aviso, theme: any }) => {
  // Título inteligente
  const displayTitle = item.title || (item.message.length > 30 ? item.message.substring(0, 30) + "..." : "Aviso");
  
  // Tradução da categoria
  let categoryLabel = capitalize(item.type);
  const typeLower = item.type.toLowerCase();
  if (typeLower === 'urgent' || typeLower === 'urgente') categoryLabel = 'Urgente';
  if (typeLower === 'maintenance' || typeLower === 'manutenção' || typeLower === 'manutencao') categoryLabel = 'Manutenção';
  if (typeLower === 'events' || typeLower === 'eventos') categoryLabel = 'Eventos';
  if (typeLower === 'general' || typeLower === 'geral') categoryLabel = 'Geral';

  // Cores
  const isUrgent = typeLower === 'urgent' || typeLower === 'urgente';
  const categoryColor = isUrgent ? theme.colors.error : theme.colors.primary;
  const categoryBg = isUrgent ? '#FFEBEE' : '#E3F2FD';

  return (
    <Card style={[styles.cardClean, { backgroundColor: theme.colors.surface }]} mode="elevated">
      <View style={styles.cardInner}>
        
        {/* Cabeçalho: Categoria e Data */}
        <View style={styles.cardHeaderRow}>
             <View style={{ flex: 1 }}>
                <Text style={{ color: categoryColor, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {categoryLabel}
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600', marginTop: 2 }}>
                    {displayTitle}
                </Text>
             </View>
             
             {/* Ícone decorativo (opcional, já que não tem botão de remover) */}
             <View style={[styles.iconBox, { backgroundColor: categoryBg }]}>
                <Feather name={isUrgent ? "alert-circle" : "info"} size={16} color={categoryColor} />
             </View>
        </View>

        <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 2, marginBottom: 8 }}>
            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
        </Text>

        <Divider style={{ backgroundColor: '#F0F0F0', marginBottom: 8 }} />

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
        let typeMatch = typeLower;
        if (typeLower === 'urgent') typeMatch = 'urgente';
        if (typeLower === 'maintenance') typeMatch = 'manutencao';
        if (typeLower === 'events') typeMatch = 'eventos';
        if (typeLower === 'general') typeMatch = 'geral';

        const passaCategoria = filtroCategoria === 'all' || typeMatch.includes(filtroCategoria) || typeLower === filtroCategoria;
        return passaCategoria;
    });
  }, [avisos, filtroCategoria]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centeredScreen, { backgroundColor: '#F8F9FA' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const pickerTextColor = theme.dark ? '#FFFFFF' : '#000000';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F8F9FA' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Header Clean (Sem botão de voltar, com Menu) */}
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: '#F8F9FA', elevation: 0 }}>
         {/* Menu Hambúrguer para navegação principal */}
         <Appbar.Action icon="menu" onPress={() => router.push('/profile' as any)} color="#1A1A1A" />
         <Appbar.Content 
            title="Quadro de Avisos" 
            titleStyle={{ fontWeight: '400', fontSize: 18, color: '#1A1A1A' }} 
         />
         {/* Espaçador para manter o título centralizado */}
         <Appbar.Action icon={() => null} />
      </Appbar.Header>

      <View style={styles.mainContent}>
        <View style={styles.container}>
            
            {/* Filtro de Largura Total */}
            <View style={{ marginBottom: 16 }}>
                <Text variant="titleMedium" style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: 8 }}>Filtrar por Categoria</Text>
                <View style={[styles.filterWrapper, { borderColor: theme.colors.outline }]}>
                    <Picker
                        selectedValue={filtroCategoria}
                        onValueChange={(val) => setFiltroCategoria(val)}
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
            </View>

            <FlatList
            data={avisosFiltrados}
            renderItem={({ item }) => <AvisoCard item={item} theme={theme} />}
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

        <BottomMenu />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  mainContent: { flex: 1, justifyContent: 'space-between' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Filtro
  filterWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    width: '100%' 
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
  // Pequeno ícone decorativo no card
  iconBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8
  }
});

export default QuadroDeAvisosScreen;