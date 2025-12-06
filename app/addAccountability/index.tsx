import { API_URL } from "@/constants/envs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import BottomMenu from '../../components/BottomMenu';

interface Condominium {
  id: string;
  name: string;
}

// Ícone Check (Branco)
const IconCheck = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
`;

export default function AddAccountability() {
  const theme = useTheme();
  const router = useRouter();

  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondoId, setSelectedCondoId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCondominiums() {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Erro", "Token não encontrado. Faça login novamente.");
          router.replace('/login');
          return;
        }

        const response = await fetch(`${API_URL}/condominiums/`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          // Silently fail or show generic error
          return;
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          setCondominiums(data);
          // Seleciona o primeiro automaticamente para facilitar
          setSelectedCondoId(data[0].id);
        }
      } catch (error) {
        console.error("Falha ao buscar condomínios");
      }
    }

    fetchCondominiums();
  }, []);

  function convertToISO(dateStr: string): string {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  }

  const handleDateChange = (text: string) => {
    let cleanedText = text.replace(/[^0-9]/g, '');
    let formattedText = '';

    if (cleanedText.length > 0) {
      formattedText += cleanedText.substring(0, 2);
      if (cleanedText.length > 2) {
        formattedText += '-' + cleanedText.substring(2, 4);
      }
      if (cleanedText.length > 4) {
        formattedText += '-' + cleanedText.substring(4, 8);
      }
    }
    setDate(formattedText);
  };

  async function handleSubmit() {
    if (!selectedCondoId || !title || !amount || !date) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_URL}/accountabilities/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          amount: parseFloat(amount.replace(',', '.')), // Garante formato correto
          type,
          description,
          date: new Date(convertToISO(date)).toISOString(),
          condominiumId: selectedCondoId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao publicar");
      }

      Alert.alert("Sucesso", "Conta criada com sucesso!");
      
      // Reset fields
      setTitle("");
      setAmount("");
      setType("EXPENSE");
      setDescription("");
      setDate("");
      
      router.back();
      
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao conectar ao servidor");
    } finally {
      setLoading(false);
    }
  }

  const primaryColor = '#0095FF';
  const pickerTextColor = theme.dark ? '#FFFFFF' : '#000000';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      
      {/* Header Clean: Sem botão de voltar */}
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: '#F8F9FA', elevation: 0 }}>
        <Appbar.Content 
            title="Nova Prestação" 
            titleStyle={{ color: '#1A1A1A', fontWeight: '600', fontSize: 18 }} 
        />
      </Appbar.Header>

      <View style={styles.mainContent}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            
            {/* Container do Formulário */}
            <View style={styles.formCard}>
              
              <TextInput
                label="Título"
                mode="outlined"
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Manutenção Elevador"
                style={styles.input}
                theme={{ colors: { background: '#FFFFFF', outline: '#E0E0E0', primary: primaryColor } }}
                textColor="#1A1A1A"
              />

              <TextInput
                label="Valor"
                mode="outlined"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0,00"
                style={styles.input}
                left={<TextInput.Affix text="R$ " />}
                theme={{ colors: { background: '#FFFFFF', outline: '#E0E0E0', primary: primaryColor } }}
                textColor="#1A1A1A"
              />

              {/* Picker de TIPO Simplificado */}
              <View style={styles.inputGroup}>
                <Text variant="bodySmall" style={{ color: '#666', marginBottom: 4, marginLeft: 2 }}>
                  Tipo de Movimentação
                </Text>
                <View style={[styles.pickerWrapper, { borderColor: '#E0E0E0' }]}>
                  <Picker
                    selectedValue={type}
                    onValueChange={(itemValue) => setType(itemValue)}
                    style={{ color: '#1A1A1A', height: 56 }} 
                    mode="dropdown"
                    dropdownIconColor="#1A1A1A"
                  >
                    {/* Labels simplificadas */}
                    <Picker.Item label="Despesa" value="EXPENSE" color={pickerTextColor}/>
                    <Picker.Item label="Receita" value="INCOME" color={pickerTextColor}/>
                  </Picker>
                </View>
              </View>

              <TextInput
                label="Descrição"
                mode="outlined"
                value={description}
                onChangeText={setDescription}
                placeholder="Detalhes do gasto ou receita..."
                multiline
                numberOfLines={3}
                style={styles.input}
                theme={{ colors: { background: '#FFFFFF', outline: '#E0E0E0', primary: primaryColor } }}
                textColor="#1A1A1A"
              />

              <TextInput
                label="Data (DD-MM-AAAA)"
                mode="outlined"
                value={date}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                placeholder="DD-MM-AAAA"
                maxLength={10}
                style={styles.input}
                right={<TextInput.Icon icon="calendar" color="#8E8E93"/>}
                theme={{ colors: { background: '#FFFFFF', outline: '#E0E0E0', primary: primaryColor } }}
                textColor="#1A1A1A"
              />

              {/* Picker de CONDOMÍNIO */}
              <View style={styles.inputGroup}>
                <Text variant="bodySmall" style={{ color: '#666', marginBottom: 4, marginLeft: 2 }}>
                  Condomínio
                </Text>
                <View style={[styles.pickerWrapper, { borderColor: '#E0E0E0' }]}>
                  <Picker
                    selectedValue={selectedCondoId}
                    onValueChange={(value) => setSelectedCondoId(value)}
                    style={{ color: '#1A1A1A', height: 56 }}
                    mode="dropdown"
                    dropdownIconColor="#1A1A1A"
                  >
                    <Picker.Item label="Selecione um condomínio" value="" color="#999" />
                    {condominiums.map((condo) => (
                      <Picker.Item 
                        key={condo.id} 
                        label={condo.name} 
                        value={condo.id} 
                        color={pickerTextColor}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Botão Publicar (Pílula Azul) */}
              <TouchableOpacity 
                style={[styles.publishButtonCustom, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]} 
                onPress={handleSubmit}
                activeOpacity={0.9}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <SvgXml xml={IconCheck} width="20" height="20" style={{ marginRight: 8 }} />
                    <Text style={styles.publishButtonTextCustom}>Publicar</Text>
                  </>
                )}
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
        <BottomMenu />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100, // Espaço para não ficar atrás do menu
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2, // Sombra leve
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4, 
    backgroundColor: '#FFFFFF'
  },
  
  // Botão Pílula Azul
  publishButtonCustom: {
    borderRadius: 30,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#0095FF',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  publishButtonTextCustom: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});