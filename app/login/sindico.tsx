// app/login/sindico.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
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

export default function LoginSindicoScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLoginSindico() {
    try {
      const response = await fetch("https://meu-condo.vercel.app/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "sindico" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert("Erro no Login", errorData.message || "Credenciais de síndico inválidas");
        return;
      }

      const data = await response.json();
      await AsyncStorage.setItem("token", data.token);
      router.replace("/home");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
      console.error(error);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Área do</Text>
          <Text style={styles.brand}>Síndico</Text>
          <Text style={styles.subtitle}>Acesso administrativo do MeuCondo</Text>

          <Text style={styles.formLabel}>Faça login para continuar</Text>
          <TextInput
            placeholder="E-mail"
            style={styles.input}
            placeholderTextColor="#e0e0e0"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Senha"
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#e0e0e0"
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLoginSindico}>
            <Text style={styles.buttonText}>Entrar como Síndico</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.back()}>
             <Text style={styles.link}>Voltar</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ===== ESTILOS COM A COR DO "VOLTAR" AJUSTADA =====
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
    marginBottom: 24,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#0095FF",
    fontSize: 18,
  },
  link: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 15, // Ajustado para ficar igual ao "Sou Síndico"
    opacity: 0.8, // <-- AQUI ESTÁ A MUDANÇA
  },
});