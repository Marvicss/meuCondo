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
  View
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
      // Salve o token no AsyncStorage, Context, Redux, ou onde preferir
      console.log("Token recebido:", data.token);
      // Navegue para a tela principal após login
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
            placeholderTextColor="#ccc"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Senha"
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#ccc"
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <Text style={styles.linkText}>
            Não tem uma conta?{" "}
            <Text style={styles.link} onPress={() => router.push("/register")}>
              Cadastre-se.
            </Text>
          </Text>

          <TouchableOpacity style={styles.roleButton}>
            <Text style={styles.roleText}>Sou Síndico</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2F80ED",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "400",
  },
  brand: {
    fontSize: 32,
    color: "#F2C94C",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 32,
  },
  formLabel: {
    color: "#fff",
    marginBottom: 8,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    color: "#fff",
    marginBottom: 16,
    paddingVertical: 4,
  },
  button: {
    backgroundColor: "#F2C94C",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#2F80ED",
  },
  linkText: {
    color: "#fff",
    marginTop: 16,
    textAlign: "center",
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
    color: "#000",
    fontWeight: "bold",
  },
});