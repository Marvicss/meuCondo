import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text,
  TextInput,
  TouchableOpacity, View
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cpf, setCpf] = useState("");
  const [userType, setUserType] = useState<"USER" | "ADMIN">("USER");

  async function handleRegister() {
    try {
      const response = await fetch("https://meu-condo.vercel.app/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          username,
          phoneNumber,
          cpf,
          userType,
        }),
      });

      if (response.ok) {
        Alert.alert("Sucesso", "Cadastro realizado com sucesso!");
        router.push("/login");
      } else {
        const errorData = await response.json();
        Alert.alert("Erro", errorData.message || "Erro ao cadastrar");
      }
    } catch (err) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
      console.error(err);
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
          <Text style={styles.title}>Bem Vindo ao</Text>
          <Text style={styles.brand}>MeuCondo!</Text>
          <Text style={styles.subtitle}>
            Transparência e organização para a vida em condomínio
          </Text>

          <Text style={styles.formLabel}>Cadastre-se para continuar</Text>

          <TextInput
            placeholder="Nome completo"
            style={styles.input}
            placeholderTextColor="#e0e0e0"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            placeholder="E-Mail"
            style={styles.input}
            placeholderTextColor="#e0e0e0"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Senha"
            style={styles.input}
            placeholderTextColor="#e0e0e0"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            placeholder="Nome de Usuário"
            style={styles.input}
            placeholderTextColor="#e0e0e0"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            placeholder="Número de telefone"
            style={styles.input}
            placeholderTextColor="#e0e0e0"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TextInput
            placeholder="CPF"
            style={styles.input}
            placeholderTextColor="#e0e0e0"
            keyboardType="numeric"
            value={cpf}
            onChangeText={setCpf}
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.roleButton} onPress={() => setUserType("USER")}>
            <Text style={styles.roleText}>Sou Morador</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0095FF",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "400",
    marginBottom: 0,
  },
  brand: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "900",
    fontFamily: 'System',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 32,
  },
  formLabel: {
    color: "#fff",
    marginBottom: 8,
    fontWeight: "bold",
    fontSize: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    color: "#fff",
    marginBottom: 18,
    paddingVertical: 6,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
    elevation: 2,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#0095FF",
    fontSize: 18,
  },
  roleButton: {
    marginTop: 32,
    alignItems: "center",
  },
  roleText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    opacity: 0.8,
  },
});
