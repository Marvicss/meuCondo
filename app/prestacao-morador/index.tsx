import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, FAB, Text, TextInput, useTheme } from 'react-native-paper';
import PieChart from 'react-native-pie-chart';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomMenu from '../../components/BottomMenu';

// --- DEFINIÇÃO DE TIPOS ---
interface Expense { id: string; date: string; amount: number; title: string; type: 'EXPENSE' | 'INCOME'; }
interface ChartDataItem { label: string; value: number; color: string; }
interface Condominium { id: string; name: string; }
interface DecodedToken { userId: string; email: string; userType: string; }
interface Customer { id: string; fullName: string; userType: string; }

// --- COMPONENTES VISUAIS ---
const ExpenseCard = ({ expense }: { expense: Expense }) => {
  const theme = useTheme();
  const isIncome = expense.type === 'INCOME';
  
  // Tons mais vivos, iguais em claro/escuro para manter consistência visual
  const incomeBackground = '#0EA5A5'; // teal vibrante
  const expenseBackground = '#EF4444'; // vermelho vibrante
  const cardColor = isIncome ? incomeBackground : expenseBackground;
  const textColor = '#FFFFFF';

  const formatCurrency = (value: number) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <Card style={{ marginBottom: 12, backgroundColor: cardColor }}>
      <Card.Content>
        <View style={styles.cardTopRow}>
          <Text style={[{ color: textColor, flex: 1, fontWeight: 'bold' }, theme.fonts.labelLarge]}>{expense.title}</Text>
          <Text style={[{ color: textColor, fontWeight: 'bold' }, theme.fonts.titleMedium]}>
            {isIncome ? '+' : '-'} {formatCurrency(expense.amount)}
          </Text>
        </View>
        <Text style={[{ color: textColor }, theme.fonts.bodySmall]}>{formatDate(expense.date)}</Text>
      </Card.Content>
    </Card>
  );
};

// Paleta fixa e amigável para gráficos (Okabe-Ito), fica igual no dark
const CHART_COLORS = [
  '#0072B2', // blue
  '#E69F00', // orange
  '#009E73', // green
  '#D55E00', // vermillion
  '#CC79A7', // pink
  '#F0E442', // yellow
  '#56B4E9', // sky blue
  '#000000', // black
];

const GeneralExpensesChart = ({ data }: { data: ChartDataItem[] }) => {
  const theme = useTheme();
  if (!data || data.length === 0) {
    return (
      <Card style={{ backgroundColor: theme.colors.surface, padding: 16, marginTop: 20 }}>
        <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          Sem dados de despesas para exibir o gráfico.
        </Text>
      </Card>
    );
  }

  const slices = data.map((item, index) => ({ value: item.value, color: CHART_COLORS[index % CHART_COLORS.length] }));

  return (
    <Card style={{ backgroundColor: theme.colors.surface, padding: 16, marginTop: 20, alignItems: 'center' }}>
      <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>Resumo dos Gastos</Text>
      <View style={styles.chartAndLegendWrapper}>
        <PieChart widthAndHeight={150} series={slices} />
        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendColorBox, { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]} />
              <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant, flexShrink: 1 }]}>
                {`${item.label} (${item.value.toFixed(1)}%)`}
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
  const [monthYearFilter, setMonthYearFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const fetchAccountabilityData = useCallback(async () => {
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
        fetch(`https://meu-condo.vercel.app/users/${decoded.userId}`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("https://meu-condo.vercel.app/condominiums/", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (!userResponse.ok) throw new Error("Não foi possível buscar dados do usuário.");
      const userData: Customer = await userResponse.json();
      setCustomer(userData);

      if (!condosResponse.ok) throw new Error("Não foi possível buscar a lista de condomínios.");
      const condominiums: Condominium[] = await condosResponse.json();
      if (!condominiums || condominiums.length === 0) throw new Error("Nenhum condomínio encontrado.");

      const condominiumIdParaTeste = condominiums[0].id;

      const expensesResponse = await fetch(
        `https://meu-condo.vercel.app/accountabilities/condominium/${condominiumIdParaTeste}`,
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

  // ✅ Correção: useFocusEffect com função síncrona
  useFocusEffect(
    useCallback(() => {
      fetchAccountabilityData();
    }, [fetchAccountabilityData])
  );

  useEffect(() => {
    if (monthYearFilter.trim() === '') {
      setFilteredData(originalData);
    } else {
      const filtered = originalData.filter(item => {
        const itemDate = new Date(item.date);
        const formattedDate = `${(itemDate.getMonth() + 1).toString().padStart(2, '0')}/${itemDate.getFullYear()}`;
        return formattedDate.includes(monthYearFilter);
      });
      setFilteredData(filtered);
    }
  }, [monthYearFilter, originalData]);

  useEffect(() => {
    const expensesOnly = filteredData.filter(item => item.type === 'EXPENSE');
    if (expensesOnly.length === 0) {
      setChartData([]);
      return;
    }

    const grouped = expensesOnly.reduce((acc, expense) => {
      const key = expense.title;
      if (!acc[key]) acc[key] = { total: 0, color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}` };
      acc[key].total += expense.amount;
      return acc;
    }, {} as { [key: string]: { total: number, color: string } });

    const totalAmount = Object.values(grouped).reduce((sum, item) => sum + item.total, 0);
    if (totalAmount === 0) {
      setChartData([]);
      return;
    }

    const calculatedChartData = Object.entries(grouped).map(([label, data]) => ({
      label,
      value: (data.total / totalAmount) * 100,
      color: data.color
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Prestação de Contas" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>

      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 24 }}>
            <Card.Content>
              <TextInput 
                label="Pesquisar por Mês/Ano (ex: 06/2025)"
                value={monthYearFilter}
                onChangeText={setMonthYearFilter}
                mode="outlined"
              />
            </Card.Content>
          </Card>

          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Movimentações</Text>

          {filteredData.length > 0 ? (
            filteredData.map((item) => <ExpenseCard key={item.id} expense={item} />)
          ) : (
            <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, padding: 20 }}>
              Nenhuma movimentação encontrada para o período.
            </Text>
          )}

          <GeneralExpensesChart data={chartData} />
        </ScrollView>

        {customer?.userType === 'ADMIN' && (
          <FAB
            icon="plus"
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/addAccountability')}
            color={theme.colors.onPrimary}
          />
        )}

        <BottomMenu />
      </View>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  mainContent: { flex: 1, justifyContent: 'space-between' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  chartTitle: { fontSize: 20, fontWeight: 'bold' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chartAndLegendWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-around' },
  legendContainer: { marginLeft: 20, flex: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendColorBox: { width: 14, height: 14, borderRadius: 2, marginRight: 8 },
  legendText: { fontSize: 12 },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
  },
});
