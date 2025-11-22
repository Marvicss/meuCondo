import { API_URL, RECAPTCHA_SITE_KEY } from "@/constants/envs";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import Recaptcha from "react-native-recaptcha-that-works";



export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // reCAPTCHA
  const recaptchaRef = useRef<any>(null);
  const siteKey = RECAPTCHA_SITE_KEY;
  const baseUrl = API_URL;
  const AUTH_USER_ID_KEY = 'authUserId';

  // Verifica se já existe um token ao carregar a tela
  useEffect(() => {
    checkExistingToken();
  }, []);

  async function checkExistingToken() {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const decoded: { userType: string; userId?: string } = jwtDecode(token);
        if (decoded?.userId) {
          await AsyncStorage.setItem(AUTH_USER_ID_KEY, String(decoded.userId));
        }
        if (decoded.userType === "ADMIN") {
          router.replace("/home/sindico");
        } else {
          router.replace("/home");
        }
        return;
      }
    } catch (error) {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem(AUTH_USER_ID_KEY);
      console.log("Token inválido removido");
    } finally {
      setLoading(false);
    }
  }

  async function doLoginWithCaptcha(captchaToken: string) {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, captchaToken }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert("Erro", errorData.message || "Falha no login");
        return;
      }
      const data = await response.json();
      await AsyncStorage.setItem("token", data.token);
      const decoded: { userType: string; userId?: string } = jwtDecode(data.token);
      if (decoded?.userId) {
        await AsyncStorage.setItem(AUTH_USER_ID_KEY, String(decoded.userId));
      }
      if (decoded.userType === "ADMIN") {
        router.replace("/home/sindico");
      } else {
        router.replace("/home");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openRecaptcha() {
    recaptchaRef.current?.open();
  }

  function handleLogin() {
    if (!email || !password) {
      Alert.alert("Atenção", "Preencha email e senha");
      return;
    }
    openRecaptcha();
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0095FF' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Bem Vindo ao</Text>
          <Text style={styles.brand}>MeuCondo!</Text>
          <Text style={styles.subtitle}>Transparência e organização para a vida em condomínio</Text>

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
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eyeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#ffffff"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <Text style={styles.linkText}>
            Não tem uma conta?{" "}
            <Text style={styles.link} onPress={() => router.push("/register")}>Cadastre-se.</Text>
          </Text>

          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => router.push("/login/sindico" as any)}
          >
            <Text style={styles.roleText}>Sou Síndico</Text>
          </TouchableOpacity>

          {/* ========================= reCAPTCHA ========================= */}
          <Recaptcha
            ref={recaptchaRef}
            siteKey={siteKey}
            baseUrl={baseUrl}
            size="invisible"
            onVerify={(token: string) => {
              doLoginWithCaptcha(token);
            }}
            onExpire={() => Alert.alert("Erro", "O reCAPTCHA expirou, tente novamente")}
          />
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
  button: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
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
    padding: 10,
  },
  roleText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    opacity: 0.8,
  },
  inputWrapper: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    position: "absolute",
    right: 0,
    top: 6,
    padding: 6,
  },
});
