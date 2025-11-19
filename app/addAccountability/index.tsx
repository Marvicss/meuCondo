import { API_URL } from "@/constants/envs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Condominium {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
}

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
          const errorData = await response.json();
          Alert.alert("Erro ao carregar", errorData.message || "Erro desconhecido");
          return;
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          Alert.alert("Erro", "Resposta inesperada do servidor.");
          console.error("Resposta recebida:", data);
          return;
        }

        setCondominiums(data);
      } catch (error) {
        Alert.alert("Erro", "Falha ao buscar condomínios");
        console.error(error);
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
    if (!selectedCondoId) {
      Alert.alert("Erro", "Selecione um condomínio");
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
          amount: parseFloat(amount),
          type,
          description,
          date: new Date(convertToISO(date)).toISOString(),
          condominiumId: selectedCondoId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert("Erro", errorData.message || "Falha ao criar conta");
        return;
      }

      Alert.alert("Sucesso", "Conta criada com sucesso!");
      
      setTitle("");
      setAmount("");
      setType("EXPENSE");
      setDescription("");
      setDate("");
      setSelectedCondoId("");
      
      router.back();
      
    } catch (error) {
      Alert.alert("Erro", "Erro ao conectar ao servidor");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurface} />
        <Appbar.Content title="Nova Prestação de Conta" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.formContainer}>
            
            <TextInput
              label="Título"
              mode="outlined"
              value={title}
              onChangeText={setTitle}
              placeholder="Digite o título"
              style={styles.input}
              theme={{ colors: { background: theme.colors.surface } }}
            />

            <TextInput
              label="Valor"
              mode="outlined"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="Digite o valor"
              style={styles.input}
              left={<TextInput.Affix text="R$ " />}
              theme={{ colors: { background: theme.colors.surface } }}
            />

            {/* Picker de TIPO */}
            <View style={styles.pickerContainer}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
                Tipo de Movimentação
              </Text>
              <View style={[
                styles.pickerWrapper, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                }
              ]}>
                <Picker
                  selectedValue={type}
                  onValueChange={(itemValue) => setType(itemValue)}
                  // Quando FECHADO, usa a cor do tema (branco no escuro, preto no claro)
                  style={{ color: theme.colors.onSurface }} 
                  dropdownIconColor={theme.colors.onSurface}
                >
                  {/* Quando ABERTO, forçamos PRETO porque o fundo é branco */}
                  <Picker.Item label="Despesa" value="EXPENSE" color="#000000"/>
                  <Picker.Item label="Receita" value="INCOME" color="#000000"/>
                </Picker>
              </View>
            </View>

            <TextInput
              label="Descrição"
              mode="outlined"
              value={description}
              onChangeText={setDescription}
              placeholder="Digite uma descrição"
              multiline
              numberOfLines={3}
              style={styles.input}
              theme={{ colors: { background: theme.colors.surface } }}
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
              right={<TextInput.Icon icon="calendar" />}
              theme={{ colors: { background: theme.colors.surface } }}
            />

            {/* Picker de CONDOMÍNIO */}
            <View style={styles.pickerContainer}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
                Condomínio
              </Text>
              <View style={[
                styles.pickerWrapper, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                }
              ]}>
                <Picker
                  selectedValue={selectedCondoId}
                  onValueChange={(value) => setSelectedCondoId(value)}
                  style={{ color: theme.colors.onSurface }}
                  dropdownIconColor={theme.colors.onSurface}
                >
                  <Picker.Item 
                    label="Selecione um condomínio" 
                    value="" 
                    color="#666666" // Cinza escuro para o placeholder
                  />
                  {condominiums.map((condo) => (
                    <Picker.Item 
                      key={condo.id} 
                      label={condo.name} 
                      value={condo.id} 
                      color="#000000" // Preto para os itens
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <Button 
              mode="contained" 
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={{ height: 50 }}
              labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            >
              Criar Conta
            </Button>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  formContainer: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4, 
  },
  button: {
    backgroundColor: "#0095FF", // Azul oficial do app
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#FFFFFF", // Texto branco para dar contraste
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    justifyContent: 'center',
  },
});
