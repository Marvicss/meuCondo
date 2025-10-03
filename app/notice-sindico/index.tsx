import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
// Dependências para o filtro funcional
import RNPickerSelect from 'react-native-picker-select';
import { Chevron } from 'react-native-shapes';

// --- Ícones (SVG como strings) ---
const Icones = {
  plus: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `,
  edit: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  `,
  remove: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  `,
};

// --- Tipagem dos dados (ajuste conforme sua API) ---
type Aviso = {
  id: string;
  titulo: string;
  data: string;
  horario: string;
};

// --- Componente do Card de Aviso ---
const AvisoCard = ({ item }: { item: Aviso }) => (
  <View style={styles.cardContainer}>
    <View style={styles.cardIndicator} />
    <View style={styles.cardContent}>
      <View>
        <Text style={styles.cardTitle}>{item.titulo}</Text>
        <Text style={styles.cardDetails}>Data: {item.data}</Text>
        <Text style={styles.cardDetails}>Horário: {item.horario}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.cardButton, styles.editButton]}>
          <SvgXml xml={Icones.edit} width="16" height="16" />
          <Text style={styles.cardButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cardButton, styles.removeButton]}>
          <SvgXml xml={Icones.remove} width="16" height="16" />
          <Text style={styles.cardButtonText}>Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// --- Componente da Tela Principal ---
const QuadroDeAvisosScreen = () => {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para controlar o valor selecionado nos filtros
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvisos = async () => {
      try {
        // Simulação de chamada de API. Troque pela sua URL real.
        // const response = await fetch('https://sua-api.com/avisos');
        // if (!response.ok) throw new Error('Erro de rede');
        // const data = await response.json();
        // setAvisos(data);
        console.log("Buscando dados...");
      } catch (error) {
        console.error("Falha ao buscar avisos:", error);
        Alert.alert('Erro', 'Não foi possível carregar os avisos.');
      } finally {
        setLoading(false);
      }
    };

    fetchAvisos();
  }, []);

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
        <Text style={styles.headerTitle}>Quadro de Avisos</Text>

        <TouchableOpacity style={styles.novoAvisoButton}>
          <SvgXml xml={Icones.plus} width="24" height="24" />
          <Text style={styles.novoAvisoButtonText}>Novo Aviso</Text>
        </TouchableOpacity>

        <Text style={styles.subHeaderTitle}>Avisos Recentes</Text>

        {/* Filtros Funcionais */}
        <View style={styles.filtersContainer}>
          <View style={styles.pickerContainer}>
            <RNPickerSelect
              onValueChange={(value) => setMesSelecionado(value)}
              placeholder={{ label: 'Mês/Ano', value: null }}
              items={[
                { label: 'Outubro/2025', value: '2025-10' },
                { label: 'Novembro/2025', value: '2025-11' },
                { label: 'Dezembro/2025', value: '2025-12' },
              ]}
              value={mesSelecionado}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
              Icon={() => <Chevron size={1.5} color="gray" />}
            />
          </View>

          <View style={styles.pickerContainer}>
            <RNPickerSelect
              onValueChange={(value) => setCategoriaSelecionada(value)}
              placeholder={{ label: 'Categoria', value: null }}
              items={[
                { label: 'Geral', value: 'geral' },
                { label: 'Manutenção', value: 'manutencao' },
                { label: 'Eventos', value: 'eventos' },
              ]}
              value={categoriaSelecionada}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
              Icon={() => <Chevron size={1.5} color="gray" />}
            />
          </View>
        </View>

        <FlatList
          data={avisos}
          renderItem={({ item }) => <AvisoCard item={item} />}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
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

// --- Estilos ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5F7' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#333' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333', marginBottom: 25 },
  novoAvisoButton: { backgroundColor: '#0095FF', borderRadius: 12, paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30, elevation: 3 },
  novoAvisoButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  subHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#444', marginBottom: 15 },
  filtersContainer: { flexDirection: 'row', marginBottom: 20 },
  pickerContainer: { flex: 1, marginRight: 10 },
  cardContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 15, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: '#EFEFEF' },
  cardIndicator: { width: 8, backgroundColor: '#0095FF' },
  cardContent: { flex: 1, padding: 15 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  cardDetails: { fontSize: 14, color: '#666', marginBottom: 4 },
  cardActions: { flexDirection: 'row', marginTop: 15 },
  cardButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 10 },
  editButton: { backgroundColor: '#0095FF' },
  removeButton: { backgroundColor: '#FF3B30' },
  cardButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14, marginLeft: 6 },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16, paddingVertical: 12, paddingHorizontal: 10, borderWidth: 1,
    borderColor: '#DDE3E9', borderRadius: 8, color: 'black', paddingRight: 30,
    backgroundColor: 'white',
  },
  inputAndroid: {
    fontSize: 16, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1,
    borderColor: '#DDE3E9', borderRadius: 8, color: 'black', paddingRight: 30,
    backgroundColor: 'white',
  },
  iconContainer: { top: 15, right: 15 },
  placeholder: { color: '#555' },
});

export default QuadroDeAvisosScreen;