import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();

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

          <TextInput placeholder="Nome" style={styles.input} placeholderTextColor="#ccc" />
          <TextInput
            placeholder="E-Mail"
            style={styles.input}
            placeholderTextColor="#ccc"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Senha"
            style={styles.input}
            placeholderTextColor="#ccc"
            secureTextEntry
          />
          <TextInput
            placeholder="Nome de Usuário"
            style={styles.input}
            placeholderTextColor="#ccc"
          />
          <TextInput
            placeholder="Número de telefone"
            style={styles.input}
            placeholderTextColor="#ccc"
            keyboardType="phone-pad"
          />
          <TextInput
            placeholder="CPF"
            style={styles.input}
            placeholderTextColor="#ccc"
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.roleButton}>
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
  roleButton: {
    marginTop: 32,
    alignItems: "center",
  },
  roleText: {
    color: "#000",
    fontWeight: "bold",
  },
});
