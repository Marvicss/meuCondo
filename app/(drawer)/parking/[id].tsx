import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ParkingLot {
  id: string;
  name: string;
  description: string;
  capacity: number;
  available: boolean;
  condominiumId: string;
  createdAt: string;
  updatedAt: string;
}

export default function ParkingDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [parking, setParking] = useState<ParkingLot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParking = async () => {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`https://meu-condo.vercel.app/parkings/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setParking(data);
      setLoading(false);
    };

    fetchParking();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10 }}>Carregando vaga...</Text>
      </View>
    );
  }

  if (!parking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "red" }}>Erro ao carregar vaga.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{parking.name}</Text>

      <View style={styles.card}>
        <MaterialIcons name="local-parking" size={48} color="#2563eb" style={styles.icon} />

        <Text style={styles.label}>Descrição:</Text>
        <Text style={styles.text}>{parking.description || "Sem descrição"}</Text>

        <Text style={styles.label}>Capacidade:</Text>
        <Text style={styles.text}>{parking.capacity}</Text>

        <Text style={styles.label}>Disponível:</Text>
        <Text
          style={[
            styles.badge,
            parking.available ? styles.available : styles.unavailable,
          ]}
        >
          {parking.available ? "Sim" : "Não"}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    alignSelf: "center",
    marginBottom: 16,
  },
  label: {
    fontWeight: "bold",
    color: "#475569",
    marginTop: 12,
  },
  text: {
    fontSize: 16,
    color: "#334155",
  },
  badge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    fontWeight: "bold",
    color: "#fff",
  },
  available: {
    backgroundColor: "#22c55e",
  },
  unavailable: {
    backgroundColor: "#ef4444",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    marginTop: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});