// app/login/sindico.tsx

import { API_URL } from "@/constants/envs";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
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
  const [showPassword, setShowPassword] = useState(false);

  async function handleLoginSindico() {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
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
      
      // Persiste o userId do token
      try {
        const decoded: { userId?: string } = jwtDecode(data.token);
        if (decoded?.userId) {
          await AsyncStorage.setItem('authUserId', String(decoded.userId));
        }
      } catch {
        // ignore decode errors
      }
      
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
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Senha"
              secureTextEntry={!showPassword}
              style={[styles.input, styles.passwordInput]}
              placeholderTextColor="#e0e0e0"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(v => !v)}
              style={styles.eyeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Mostrar/ocultar senha"
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#fff" />
            </TouchableOpacity>
          </View>

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
  inputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 6,
    padding: 6,
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
    fontSize: 15, 
    opacity: 0.8, 
  },
});