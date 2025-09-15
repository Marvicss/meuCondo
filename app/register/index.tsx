import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text,
  TextInput,
  TouchableOpacity, useColorScheme, View
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cpf, setCpf] = useState("");
  const [userType, setUserType] = useState<"USER" | "ADMIN">("USER"); // default

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
          <Text style={[styles.brand, colorScheme === 'light' && { fontFamily: 'System', fontWeight: '900', color: '#FFFFFF', fontSize: 40, letterSpacing: 1 }]}>MeuCondo!</Text>
          <Text style={styles.subtitle}>
            Transparência e organização para a vida em condomínio
          </Text>

          <Text style={styles.formLabel}>Cadastre-se para continuar</Text>

          <TextInput
            placeholder="Nome completo"
            style={styles.input}
            placeholderTextColor="#ccc"
            value={fullName}
            onChangeText={setFullName}
          />
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
            style={styles.input}
            placeholderTextColor="#ccc"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            placeholder="Nome de Usuário"
            style={styles.input}
            placeholderTextColor="#ccc"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            placeholder="Número de telefone"
            style={styles.input}
            placeholderTextColor="#ccc"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TextInput
            placeholder="CPF"
            style={styles.input}
            placeholderTextColor="#ccc"
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

          {/* Se quiser trocar para síndico futuramente:
          <TouchableOpacity onPress={() => setUserType("MANAGER")}>
            <Text style={{ color: "#fff", marginTop: 8 }}>Sou Síndico</Text>
          </TouchableOpacity>
          */}
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
  roleButton: {
    marginTop: 32,
    alignItems: "center",
  },
  roleText: {
    color: "#000",
    fontWeight: "bold",
  },
});
