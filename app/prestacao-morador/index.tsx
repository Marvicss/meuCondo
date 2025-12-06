import { API_URL } from '@/constants/envs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Appbar, Card, Chip, Divider, Text, useTheme } from 'react-native-paper';
import PieChart from 'react-native-pie-chart';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomMenu from '../../components/BottomMenu';
import CustomHeader from '../../components/CustomHeader';

// --- TIPOS ---
interface Expense {
  id: string;
  date: string;
  createdAt?: string;
  amount: number;
  title: string;
  description?: string;
  type: 'EXPENSE' | 'INCOME';
}

interface ChartDataItem { label: string; value: number; color: string; }
interface DecodedToken { userId: string; email: string; userType: string; }
interface Customer { id: string; fullName: string; userType: string; }

// Cores Modernas e Suaves
const COLORS = {
  income: '#90CAF9', // Verde iOS
  expense: '#0095FF', // Vermelho iOS
  bg: '#F8F9FA' // Fundo levemente cinza para destacar os cards brancos
};

// --- COMPONENTE ExpenseCard (ULTRA CLEAN) ---
const ExpenseCard = ({ expense }: { expense: Expense }) => {
  const theme = useTheme();
  
  const formatCurrency = (value: number) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
  
  const tipoNormalizado = expense.type ? expense.type.toUpperCase() : 'EXPENSE';
  const isIncome = tipoNormalizado === 'INCOME' || tipoNormalizado === 'RECEITA';
  const color = isIncome ? COLORS.income : COLORS.expense;
  const dataExibicao = expense.date || expense.createdAt || new Date().toISOString();

  const showDetails = () => {
    Alert.alert(
      expense.title,
      expense.description || "Sem descrição detalhada.",
      [{ text: "Fechar", style: 'cancel' }]
    );
  };

  return (
    <TouchableOpacity onPress={showDetails} activeOpacity={0.7}>
        <View style={styles.cardRow}>
            {/* Ícone/Indicador */}
            <View style={[styles.iconBox, { backgroundColor: isIncome ? '#90CAF9' : '#0095FF' }]}>
                <Text style={{ fontSize: 18 }}>{isIncome ? '↓' : '↑'}</Text>
            </View>

            {/* Informações Principais */}
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '500' }}>
                    {expense.title}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
                    {new Date(dataExibicao).toLocaleDateString('pt-BR')}
                </Text>
            </View>

            {/* Valor */}
            <Text variant="titleMedium" style={{ color: color, fontWeight: '600' }}>
                {isIncome ? '+' : '-'} {formatCurrency(expense.amount)}
            </Text>
        </View>
        <Divider style={{ marginHorizontal: 16, backgroundColor: '#F0F0F0' }} />
    </TouchableOpacity>
  );
};

// --- COMPONENTE GRÁFICO MINIMALISTA ---
const GeneralExpensesChart = ({ data }: { data: ChartDataItem[] }) => {
  const theme = useTheme();

  if (!data || data.length === 0) return null;

  const slicesForChart = data.map(item => ({ value: item.value, color: item.color }));

  return (
    <View style={styles.chartContainer}>
      <Text variant="titleMedium" style={{ marginBottom: 20, fontWeight: '500', color: theme.colors.onSurface, textAlign: 'center' }}>
          Resumo Financeiro
      </Text>
      
      <View style={styles.chartContent}>
        <PieChart widthAndHeight={140} series={slicesForChart} />
        
        {/* Legenda Limpa ao Lado */}
        <View style={{ marginLeft: 24 }}>
          {data.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, marginRight: 8 }} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{item.label}</Text>
                  <Text variant="bodyMedium" style={{ marginLeft: 8, fontWeight: 'bold', color: theme.colors.onSurface }}>
                      {Math.round((item.value / data.reduce((acc, c) => acc + c.value, 0)) * 100)}%
                  </Text>
              </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// --- TELA PRINCIPAL ---
export default function PrestacaoDeContasScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [originalData, setOriginalData] = useState<Expense[]>([]);
  const [filteredData, setFilteredData] = useState<Expense[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  
  // Filtros: 'todos' | 'receita' | 'despesa'
  const [filter, setFilter] = useState<'todos' | 'receita' | 'despesa'>('todos');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountabilityData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Acesso Negado", "Você precisa fazer login.");
        router.replace('/login');
        return;
      }
      const decoded: DecodedToken = jwtDecode(token);
      
      const condosResponse = await fetch(`${API_URL}/condominiums/`, { headers: { "Authorization": `Bearer ${token}` } });
      const condominiums = await condosResponse.json();
      
      if (!condominiums || condominiums.length === 0) {
          setOriginalData([]);
          setLoading(false);
          return;
      }
      
      const expensesResponse = await fetch(
        `${API_URL}/accountabilities/condominium/${condominiums[0].id}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      setOriginalData(await expensesResponse.json());

    } catch (err) {
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchAccountabilityData();
    }, [fetchAccountabilityData])
  );

  // Filtro
  useEffect(() => {
    let currentFiltered = originalData;
    if (filter === 'receita') currentFiltered = currentFiltered.filter(item => item.type === 'INCOME');
    else if (filter === 'despesa') currentFiltered = currentFiltered.filter(item => item.type === 'EXPENSE');
    setFilteredData(currentFiltered);
  }, [originalData, filter]);

  // Gráfico (Sempre Receita vs Despesa)
  useEffect(() => {
    if (filteredData.length === 0) { setChartData([]); return; }

    const totalIncome = filteredData.filter(i => i.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = filteredData.filter(i => i.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);

    const newChartData: ChartDataItem[] = [];
    if (totalIncome > 0) newChartData.push({ label: 'Receitas', value: totalIncome, color: COLORS.income });
    if (totalExpense > 0) newChartData.push({ label: 'Despesas', value: totalExpense, color: COLORS.expense });
    
    setChartData(newChartData);
  }, [filteredData]);

  if (loading) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: COLORS.bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.bg }]}>
      <CustomHeader mode="center-aligned" style={{ backgroundColor: COLORS.bg, elevation: 0 }}>
        <Appbar.Content title="Prestação de Contas" titleStyle={{ color: theme.colors.onSurface, fontWeight: '600', fontSize: 20 }} />
      </CustomHeader>

      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* --- FILTROS CLEAN (CHIPS DE CONTORNO) --- */}
          <View style={styles.filtersContainer}>
              <Chip 
                  selected={filter === 'receita'} 
                  onPress={() => setFilter(filter === 'receita' ? 'todos' : 'receita')}
                  showSelectedOverlay
                  mode="outlined"
                  style={styles.chip}
                  textStyle={{ fontWeight: '500' }}
              >
                  Receitas
              </Chip>
              <Chip 
                  selected={filter === 'despesa'} 
                  onPress={() => setFilter(filter === 'despesa' ? 'todos' : 'despesa')}
                  showSelectedOverlay
                  mode="outlined"
                  style={styles.chip}
                  textStyle={{ fontWeight: '500' }}
              >
                  Despesas
              </Chip>
          </View>

          {/* Gráfico Clean */}
          <GeneralExpensesChart data={chartData} />

          <Text variant="titleMedium" style={{ marginLeft: 4, marginBottom: 12, fontWeight: '600', color: theme.colors.onSurface }}>
            Lançamentos
          </Text>

          {/* Lista Clean (Card Único com Divisores) */}
          <Card style={styles.listCard}>
             {filteredData.length > 0 ? (
                filteredData.map((item) => <ExpenseCard key={item.id} expense={item} />)
             ) : (
                <View style={{ padding: 30, alignItems: 'center' }}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
                        Nenhum lançamento encontrado.
                    </Text>
                </View>
             )}
          </Card>

        </ScrollView>
        
        <BottomMenu />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  mainContent: { flex: 1, justifyContent: 'space-between' },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Filtros
  filtersContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  chip: { flex: 1, backgroundColor: 'transparent' }, // Fundo transparente para ficar clean

  // Gráfico
  chartContainer: { marginBottom: 32, alignItems: 'center' },
  chartContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

  // Lista Clean
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 0, // Sem sombra pesada
    borderWidth: 1, // Borda muito fina e sutil
    borderColor: '#F0F0F0',
    overflow: 'hidden'
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF'
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
});