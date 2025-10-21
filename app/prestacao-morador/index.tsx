// app/prestacao-morador/index.tsx (ou o caminho correto do seu arquivo)

import { API_URL } from '@/constants/envs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
// Appbar está incluído
import { Picker } from '@react-native-picker/picker'; // Importa o Picker
import { Appbar, Button, Card, Text, useTheme } from 'react-native-paper';
import PieChart from 'react-native-pie-chart';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomMenu from '../../components/BottomMenu'; // Importa o BottomMenu

// --- DEFINIÇÃO DE TIPOS ---
interface Expense { id: string; date: string; amount: number; title: string; type: 'EXPENSE' | 'INCOME'; }
interface ChartDataItem { label: string; value: number; color: string; }
interface Condominium { id: string; name: string; }
interface DecodedToken { userId: string; email: string; userType: string; }
interface Customer { id: string; fullName: string; userType: string; }

// Paleta fixa para gráficos
const CHART_COLORS = [
  '#007bff', '#6c757d', '#17a2b8', '#dc3545', '#28a745', '#ffc107',
];

// --- COMPONENTE ExpenseCard (NOVO LAYOUT) ---
const ExpenseCard = ({ expense }: { expense: Expense }) => {
  const theme = useTheme();
  const formatCurrency = (value: number) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`;

  return (
    <Card style={styles.expenseCard}>
      <Card.Content>
        <Text style={[styles.expenseTitle, { color: theme.colors.onSurface }]}>{expense.title}</Text>
        <Text style={[styles.expenseDescription, { color: theme.colors.onSurfaceVariant }]}>
          Descrição do gasto (ex: "{expense.title}")
        </Text>
        <Text style={[styles.expenseStatus, { color: theme.colors.onSurfaceVariant }]}>
          Status: pago
        </Text>
        <Button 
          mode="contained" 
          onPress={() => Alert.alert("Visualizar Nota", `Detalhes da nota para ${expense.title}`)} 
          style={styles.viewInvoiceButton}
          labelStyle={styles.viewInvoiceButtonText}
          theme={{colors: { primary: '#007bff'}}}
        >
          Visualizar nota fiscal
        </Button>
      </Card.Content>
    </Card>
  );
};

// --- COMPONENTE GeneralExpensesChart (COM TODAS AS CORREÇÕES) ---
const GeneralExpensesChart = ({ data }: { data: ChartDataItem[] }) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          Sem dados de despesas para exibir o gráfico.
        </Text>
      </Card>
    );
  }

  // CORREÇÃO 1: Passar o array de objetos { value, color } para o PieChart
  const slicesForChart = data.map(item => ({ value: item.value, color: item.color }));

  return (
    <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.chartValueTitle, { color: theme.colors.onSurface }]}>Valor</Text>
      <View style={styles.chartWrapper}>
        
        {/* CORREÇÃO 2: Removida a propriedade 'coverRadius' */}
        <PieChart 
          widthAndHeight={180} 
          series={slicesForChart} 
        />
        
        <View style={styles.chartOverlayLegend}>
            {data.map((item, index) => (
                <View key={item.label} style={styles.chartOverlayLegendItem}>
                    <Text style={[styles.chartOverlayLegendText, {color: CHART_COLORS[index % CHART_COLORS.length]}]}>
                        {`${item.label} ${item.value.toFixed(1)}%`}
                    </Text>
                </View>
            ))}
        </View>
      </View>
    </Card>
  );
};

// --- A TELA PRINCIPAL ---
export default function PrestacaoDeContasScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [originalData, setOriginalData] = useState<Expense[]>([]);
  const [filteredData, setFilteredData] = useState<Expense[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('09/2025');
  const [selectedExpenseType, setSelectedExpenseType] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const fetchAccountabilityData = useCallback(async () => {
    // ... (toda a sua lógica de fetch continua a mesma) ...
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Acesso Negado", "Você precisa fazer login para ver esta página.");
        router.replace('/login');
        return;
      }
      const decoded: DecodedToken = jwtDecode(token);
      const [userResponse, condosResponse] = await Promise.all([
        fetch(`${API_URL}/users/${decoded.userId}`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${API_URL}/condominiums/`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      if (!userResponse.ok) throw new Error("Não foi possível buscar dados do usuário.");
      setCustomer(await userResponse.json());
      if (!condosResponse.ok) throw new Error("Não foi possível buscar a lista de condomínios.");
      const condominiums: Condominium[] = await condosResponse.json();
      if (!condominiums || condominiums.length === 0) throw new Error("Nenhum condomínio encontrado.");
      const condominiumIdParaTeste = condominiums[0].id;
      const expensesResponse = await fetch(
        `${API_URL}/accountabilities/condominium/${condominiumIdParaTeste}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      if (!expensesResponse.ok) throw new Error("Não foi possível buscar as prestações de contas.");
      setOriginalData(await expensesResponse.json());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Um erro desconhecido ocorreu.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchAccountabilityData();
    }, [fetchAccountabilityData])
  );

  // ... (toda a sua lógica de useEffect para filtrar e calcular o gráfico continua a mesma) ...
  useEffect(() => {
    let currentFiltered = originalData;
    if (selectedMonthYear !== 'all') {
      currentFiltered = currentFiltered.filter(item => {
        const itemDate = new Date(item.date);
        const formattedDate = `${(itemDate.getMonth() + 1).toString().padStart(2, '0')}/${itemDate.getFullYear()}`;
        return formattedDate === selectedMonthYear;
      });
    }
    if (selectedExpenseType !== 'all') {
      currentFiltered = currentFiltered.filter(item => item.type.toLowerCase() === selectedExpenseType);
    }
    setFilteredData(currentFiltered);
  }, [originalData, selectedMonthYear, selectedExpenseType]);

  useEffect(() => {
    const expensesOnly = filteredData.filter(item => item.type === 'EXPENSE');
    if (expensesOnly.length === 0) { setChartData([]); return; }
    const grouped = expensesOnly.reduce((acc, expense) => {
      const key = expense.title;
      if (!acc[key]) acc[key] = { total: 0, color: '' };
      acc[key].total += expense.amount;
      return acc;
    }, {} as { [key: string]: { total: number, color: string } });
    const totalAmount = Object.values(grouped).reduce((sum, item) => sum + item.total, 0);
    if (totalAmount === 0) { setChartData([]); return; }
    const calculatedChartData = Object.entries(grouped).map(([label, data], index) => ({
      label,
      value: (data.total / totalAmount) * 100,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
    setChartData(calculatedChartData);
  }, [filteredData]);

  if (loading) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: theme.colors.background }]}>
        <Text style={{color: theme.colors.error, marginBottom: 10, textAlign: 'center'}}>{error}</Text>
        <Button mode="contained" onPress={fetchAccountabilityData}>Tentar Novamente</Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* 1. APPBAR (BARRA SUPERIOR) ESTÁ AQUI */}
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Prestação de Contas" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>

      {/* 2. MAINCONTENT PARA ORGANIZAR O SCROLL E O MENU */}
      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Área dos Filtros Dropdown */}
          <View style={styles.filtersContainer}>
            <View style={[styles.pickerWrapper, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
              <Picker
                selectedValue={selectedMonthYear}
                onValueChange={(itemValue) => setSelectedMonthYear(itemValue)}
                style={styles.pickerStyle}
                itemStyle={styles.pickerItemStyle}
              >
                <Picker.Item label="Setembro/2025" value="09/2025" />
                {/* Outras opções podem ser adicionadas aqui */}
              </Picker>
            </View>

            <View style={[styles.pickerWrapper, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
              <Picker
                selectedValue={selectedExpenseType}
                onValueChange={(itemValue) => setSelectedExpenseType(itemValue)}
                style={styles.pickerStyle}
                itemStyle={styles.pickerItemStyle}
              >
                <Picker.Item label="Tipo de Gasto" value="all" />
                <Picker.Item label="Entrada" value="income" />
                <Picker.Item label="Saída" value="expense" />
              </Picker>
            </View>
          </View>

          {/* Gráfico de Despesas */}
          <GeneralExpensesChart data={chartData} />

          {/* Lista de Movimentações (ExpenseCards) */}
          {filteredData.length > 0 ? (
            filteredData.map((item) => <ExpenseCard key={item.id} expense={item} />)
          ) : (
            <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, padding: 20 }}>
              Nenhuma movimentação encontrada para os filtros aplicados.
            </Text>
          )}
        </ScrollView>
        
        {/* 3. BOTTOMMENU ESTÁ AQUI */}
        <BottomMenu />
      </View>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  mainContent: { 
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 20, 
    paddingBottom: 20,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 0, 
    marginBottom: 20,
    zIndex: 10, 
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden', 
    height: 48, 
    justifyContent: 'center',
  },
  pickerStyle: {
    height: 48,
    width: '100%',
  },
  pickerItemStyle: {
    height: 48,
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Estilos do ExpenseCard
  expenseCard: {
    backgroundColor: '#FFFFFF', 
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2, 
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expenseDescription: {
    fontSize: 14,
    marginBottom: 2,
  },
  expenseStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10, 
  },
  viewInvoiceButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  viewInvoiceButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  // Estilos do GeneralExpensesChart
  chartCard: {
    backgroundColor: '#FFFFFF', 
    padding: 16,
    marginTop: 0, 
    marginBottom: 20,
    alignItems: 'center', 
    borderRadius: 8,
    elevation: 2, 
  },
  chartValueTitle: { 
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'flex-start', 
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    width: '100%',
    position: 'relative', 
  },
  chartOverlayLegend: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-around', 
    alignItems: 'center',
    paddingVertical: 10, 
  },
  chartOverlayLegendItem: {
  },
  chartOverlayLegendText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center', 
  }git add .,
});