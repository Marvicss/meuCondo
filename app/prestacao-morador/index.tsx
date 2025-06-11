import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import PieChart from 'react-native-pie-chart';
// Importa o AsyncStorage para ler os dados que a tela de Login salvou
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
// NOVO: Importa o componente do menu inferior a partir da pasta de componentes
import BottomMenu from '../../components/BottomMenu';


// --- DEFINIÇÃO DE TIPOS (TYPESCRIPT) ---
interface Expense {
  id: string;
  date: string;
  amount: number;
  title: string;
  type: 'EXPENSE' | 'INCOME';
}

interface ChartDataItem {
  label: string;
  value: number;
  color: string;
}

// Interface para um objeto Condomínio, como vem da API
interface Condominium {
    id: string;
    name: string;
    // ...outras propriedades do condomínio
}


// --- COMPONENTES VISUAIS (ExpenseCard e GeneralExpensesChart) ---
// (Nenhuma mudança necessária aqui, eles continuam os mesmos)
const ExpenseCard = ({ expense }: { expense: Expense }) => {
  const formatCurrency = (value: number): string => {
    if (!value && value !== 0) return "R$ 0,00";
    if (value >= 1000 && value < 1000000) return `${(value / 1000).toFixed(0)} Mil`;
    return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
  };
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
  };
  return (
    <View style={styles.cardContainer}>
      <View style={styles.topRow}>
        <View style={styles.dateBox}><Text style={styles.dateText}>{formatDate(expense.date)}</Text></View>
        <View style={styles.valueBox}><Text style={styles.valueText}>{formatCurrency(expense.amount)}</Text></View>
      </View>
      <Text style={styles.expenseTitle}>{expense.title}</Text>
    </View>
  );
};

const PieChartComponent: any = PieChart;
const GeneralExpensesChart = ({ data }: { data: ChartDataItem[] }) => {
    if (!data || data.length === 0) return null;
    const seriesData = data.map(item => ({ value: item.value, color: item.color }));
    return (
      <View style={styles.chartComponentContainer}>
        <Text style={styles.chartTitle}>Resumo dos Gastos</Text>
        <View style={styles.chartAndLegendWrapper}>
            <PieChartComponent widthAndHeight={150} series={seriesData} />
            {/* LEGENDA ADICIONADA AQUI */}
            <View style={styles.legendContainer}>
                {data.map((item) => (
                <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{`${item.label} (${item.value}%)`}</Text>
                </View>
                ))}
            </View>
        </View>
      </View>
    );
  };

// --- A TELA PRINCIPAL ---
export default function PrestacaoDeContasScreen() {
  const router = useRouter();
  // Estado para os dados originais do backend
  const [originalExpenses, setOriginalExpenses] = useState<Expense[]>([]);
  // Estado para o texto do filtro
  const [monthYearFilter, setMonthYearFilter] = useState<string>('');
  // Estado para os dados que serão exibidos na tela (já filtrados)
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect para aplicar o filtro na lista quando o texto muda
  useEffect(() => {
    if (monthYearFilter.trim() === '') {
        setFilteredExpenses(originalExpenses);
    } else {
        const filtered = originalExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            const month = (expenseDate.getMonth() + 1).toString().padStart(2, '0');
            const year = expenseDate.getFullYear().toString();
            const formattedDate = `${month}/${year}`;
            return formattedDate.includes(monthYearFilter);
        });
        setFilteredExpenses(filtered);
    }
  }, [monthYearFilter, originalExpenses]);

  // useEffect para recalcular o gráfico quando a lista filtrada muda
  useEffect(() => {
    if (filteredExpenses.length === 0) {
        setChartData([]);
        return;
    }

    const grouped = filteredExpenses.reduce((acc, expense) => {
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

    const calculatedChartData: ChartDataItem[] = Object.entries(grouped).map(([label, data]) => ({
        label, value: parseFloat(((data.total / totalAmount) * 100).toFixed(1)), color: data.color
    }));

    setChartData(calculatedChartData);
  }, [filteredExpenses]); // Roda sempre que a lista de despesas filtradas mudar

  async function fetchAccountabilityData() {
    setLoading(true);
    setError(null);
    try {
      // ETAPA A: Pega o token salvo pela tela de Login
      const token = await AsyncStorage.getItem('token');
      
      // Se não encontrar o token, o usuário não está logado.
      if (!token) {
        Alert.alert("Acesso Negado", "Você precisa fazer o login para ver esta página.");
        router.replace('/login'); // Envia o usuário de volta para o login
        return;
      }

      // ETAPA B: BUSCAR TODOS OS CONDOMÍNIOS
      const condosResponse = await fetch("https://meu-condo.vercel.app/condominiums/", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!condosResponse.ok) throw new Error("Não foi possível buscar a lista de condomínios.");
      const condominiums: Condominium[] = await condosResponse.json();
      
      if (!condominiums || condominiums.length === 0) {
        throw new Error("Nenhum condomínio encontrado no sistema. Cadastre um condomínio primeiro.");
      }

      // ETAPA C (O "DRIBLE"): Usar o ID do PRIMEIRO condomínio da lista para o teste
      const condominiumIdParaTeste = condominiums[0].id;


      // ETAPA D: BUSCAR AS PRESTAÇÕES DE CONTAS COM O ID OBTIDO
      const expensesResponse = await fetch(
        `https://meu-condo.vercel.app/accountabilities/condominium/${condominiumIdParaTeste}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      if (!expensesResponse.ok) throw new Error("Não foi possível buscar as prestações de contas para o condomínio selecionado.");
      const allData: Expense[] = await expensesResponse.json();
      const expensesOnly = allData.filter(item => item.type === 'EXPENSE');
      setOriginalExpenses(expensesOnly);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Um erro desconhecido ocorreu.";
      setError(errorMessage);
       if (errorMessage.includes("Acesso Negado")) {
         router.replace('/login');
      } else {
        Alert.alert("Erro", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAccountabilityData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /><Text style={{ marginTop: 10 }}>Carregando...</Text></View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centered}>
          <Text style={styles.errorText}>Ocorreu um erro:</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Tentar Novamente" onPress={fetchAccountabilityData} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.headerTitle}>Prestação de Contas</Text>
            <View style={styles.filterContainer}>
            <TextInput 
                placeholder="Pesquisar por Mês/Ano (ex: 06/2025)" 
                style={styles.input} 
                placeholderTextColor="#9CA3AF"
                value={monthYearFilter}
                onChangeText={setMonthYearFilter}
            />
            </View>

            <Text style={styles.sectionTitle}>Gastos do Período</Text>
            {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense) => <ExpenseCard key={expense.id} expense={expense} />)
            ) : (
            <Text style={styles.infoText}>
                {originalExpenses.length > 0 ? 'Nenhuma despesa encontrada para este filtro.' : 'Nenhuma despesa cadastrada.'}
            </Text>
            )}
            <GeneralExpensesChart data={chartData} />
        </ScrollView>
        {/* NOVO: Adiciona o menu inferior à tela */}
        <BottomMenu />
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6', paddingBottom: 40 },
  container: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 24 },
  filterContainer: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, },
  input: { borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  infoText: { textAlign: 'center', paddingVertical: 20, color: '#6B7280' },
  errorText: { textAlign: 'center', color: 'red', marginVertical: 5, fontSize: 16 },
  cardContainer: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  topRow: { flexDirection: 'row', marginBottom: 12 },
  dateBox: { backgroundColor: '#3B82F6', borderRadius: 6, paddingVertical: 10, justifyContent: 'center', alignItems: 'center', flex: 1, marginRight: 8 },
  dateText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  valueBox: { backgroundColor: '#FACC15', borderRadius: 6, justifyContent: 'center', alignItems: 'center', flex: 1.5, marginLeft: 8 },
  valueText: { color: '#374151', fontWeight: 'bold', fontSize: 20 },
  expenseTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  chartComponentContainer: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 20, marginTop: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  chartTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#1F2937' },
  // Estilos adicionados para a legenda
  chartAndLegendWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
  },
  legendContainer: {
    marginLeft: 20,
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColorBox: {
    width: 14,
    height: 14,
    borderRadius: 2,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
    flexShrink: 1, // Permite que o texto quebre a linha se necessário
  },
});
