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
    } catch (error) {
      Alert.alert("Erro", "Erro ao conectar ao servidor");
      console.error(error);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 20}
    >
      <View style={styles.headerContainerComSombra}>
        <Text style={styles.title}>Prestação de Conta</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Digite o título"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Valor</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="Digite o valor"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={type}
              onValueChange={(itemValue) => setType(itemValue)}
              style={styles.input}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Despesa" value="EXPENSE" />
              <Picker.Item label="Receita" value="INCOME" />
            </Picker>
          </View>

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="Digite uma descrição"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Data (DD-MM-AAAA)</Text>
          <TextInput
            style={styles.input}
            placeholder="DD-MM-AAAA"
            value={date}
            onChangeText={handleDateChange}
            keyboardType="numeric"
            placeholderTextColor="#888"
          	maxLength={10}
        	/>

        	<Text style={styles.label}>Condomínio</Text>
        	<View style={styles.pickerContainer}>
          	<Picker
            	selectedValue={selectedCondoId}
            	onValueChange={(value) => setSelectedCondoId(value)}
            	style={styles.input}
            	itemStyle={styles.pickerItem}
          	>
            	<Picker.Item label="Selecione um condomínio" value="" />
            	{condominiums.map((condo) => (
              	<Picker.Item key={condo.id} label={condo.name} value={condo.id} />
            	))}
          	</Picker>
        	</View>

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
    paddingTop: 0, 
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    color: "#333",
    fontWeight: "bold",
  },
  headerContainerComSombra: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 24, 
    paddingBottom: 24, 
    
    // A Sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    color: "#333",
    marginTop: 16,
    marginBottom: 4,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    color: "#000",
    elevation: 2, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, // Erro do "D" removido
    shadowRadius: 2,
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
  pickerItem: {
    color: "#000",
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
    fontSize: 16,
  },
});