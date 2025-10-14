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
  Pressable, // 1. Importar o Pressable
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // 2. Importar o pacote de ícones

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // 3. Adicionar estado para visibilidade da senha
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);

  async function handleLogin() {
    try {
      const response = await fetch("https://meu-condo.vercel.app/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert("Erro", errorData.message || "Falha no login");
        return;
      }

      const data = await response.json();
      await AsyncStorage.setItem("token", data.token);
      router.replace("./home");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
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
          <Text style={styles.title}>Bem Vindo ao</Text>
          <Text style={styles.brand}>MeuCondo!</Text>
          <Text style={styles.subtitle}>Transparência e organização para a vida em condomínio</Text>

          <Text style={styles.formLabel}>Faça Login para continuar</Text>
          <TextInput
            placeholder="E-Mail"
            style={styles.input}
            placeholderTextColor="#e0e0e0"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* 4. Criar um container para o input de senha e o ícone */}
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Senha"
              secureTextEntry={isPasswordVisible} // Controlado pelo estado
              style={styles.passwordInput}
              placeholderTextColor="#e0e0e0"
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              <Ionicons
                name={isPasswordVisible ? "eye-off" : "eye"} // Alterna o ícone
                size={24}
                color="#e0e0e0"
              />
            </Pressable>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <Text style={styles.linkText}>
            Não tem uma conta?{" "}
            <Text style={styles.link} onPress={() => router.push("/register")}>
              Cadastre-se.
            </Text>
          </Text>

          <View style={styles.roleButton}>
            <Text style={styles.roleText}>Sou Síndico</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ... (estilos existentes)
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
    fontFamily: "System",
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
  // 5. Adicionar os novos estilos para o campo de senha
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 18,
  },
  passwordInput: {
    flex: 1,
    color: "#fff",
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
  linkText: {
    color: "#fff",
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
  },
  link: {
    textDecorationLine: "underline",
    color: "#fff",
    fontWeight: "bold",
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