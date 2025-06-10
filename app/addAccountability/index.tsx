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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  const router = useRouter();

  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondoId, setSelectedCondoId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    async function fetchCondominiums() {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Erro", "Token não encontrado. Faça login novamente.");
          return;
        }

        const response = await fetch("https://meu-condo.vercel.app/condominiums/", {
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

  // Função para converter DD-MM-AAAA para AAAA-MM-DD
  function convertToISO(dateStr: string): string {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  }

  const handleDateChange = (text: string) => {
    // Remove tudo que não for dígito
    let cleanedText = text.replace(/[^0-9]/g, '');

    let formattedText = '';

    if (cleanedText.length > 0) {
      formattedText += cleanedText.substring(0, 2); // Dias
      if (cleanedText.length > 2) {
        formattedText += '-' + cleanedText.substring(2, 4); // Meses
      }
      if (cleanedText.length > 4) {
        formattedText += '-' + cleanedText.substring(4, 8); // Anos
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
      const token = await AsyncStorage.getItem("token");

      const response = await fetch("https://meu-condo.vercel.app/accountabilities/", {
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

      // Limpar o formulário
      setTitle("");
      setAmount("");
      setType("EXPENSE");
      setDescription("");
      setDate("");
      setSelectedCondoId("");

    } catch (error) {
      Alert.alert("Erro", "Erro ao conectar ao servidor");
      console.error(error);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 20}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Prestação de Conta</Text>

          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#888" // Adicionado para placeholder visível
          />

          <Text style={styles.label}>Valor</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholderTextColor="#888" // Adicionado para placeholder visível
          />

          <Text style={styles.label}>Tipo</Text>
          <Picker
            selectedValue={type}
            onValueChange={(itemValue) => setType(itemValue)}
            style={styles.input}
            itemStyle={styles.pickerItem} // Estilo para os itens do Picker
          >
            <Picker.Item label="Despesa" value="EXPENSE" />
            <Picker.Item label="Receita" value="INCOME" />
          </Picker>

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#888" // Adicionado para placeholder visível
          />

          <Text style={styles.label}>Data (DD-MM-AAAA)</Text>
          <TextInput
            style={styles.input}
            placeholder="DD-MM-AAAA"
            value={date}
            onChangeText={handleDateChange}
            keyboardType="numeric"
            placeholderTextColor="#888" // Adicionado para placeholder visível
            maxLength={10} // Limita a entrada a 10 caracteres (DD-MM-AAAA)
          />

          <Text style={styles.label}>Condomínio</Text>
          <Picker
            selectedValue={selectedCondoId}
            onValueChange={(value) => setSelectedCondoId(value)}
            style={styles.input}
            itemStyle={styles.pickerItem} // Estilo para os itens do Picker
          >
            <Picker.Item label="Selecione um condomínio" value="" />
            {condominiums.map((condo) => (
              <Picker.Item key={condo.id} label={condo.name} value={condo.id} />
            ))}
          </Picker>

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Criar Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#2F80ED", // Fundo azul
  },
  title: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 24,
  },
  label: {
    color: "#fff",
    marginTop: 16,
    marginBottom: 4, // Espaço entre o label e o input
    fontWeight: "bold", // Para destacar o label
  },
  input: {
    backgroundColor: "#fff", // Fundo branco para o input
    borderWidth: 1, // Adicionado borda para melhor visualização
    borderColor: "#ccc",
    borderRadius: 8, // Borda arredondada
    paddingHorizontal: 12, // Espaçamento interno
    paddingVertical: 10,
    marginBottom: 16, // Mais espaço entre os inputs
    color: "#000", // Cor do texto dentro do input para preto
  },
  pickerItem: {
    color: "#000", // Cor do texto dos itens do Picker para preto
  },
  button: {
    backgroundColor: "#F2C94C",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#2F80ED",
    fontSize: 16, // Aumentado para melhor leitura
  },
});