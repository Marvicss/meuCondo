import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  parking: {
    name: string;
    description?: string | null;
    available: boolean;
  };
}

export function ParkingCard({ parking }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="car-sport" size={24} color="#1877F2" />
        <Text style={styles.name}>{parking.name}</Text>
      </View>
      <Text style={styles.description}>
        {parking.description ?? "Sem descrição"}
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {parking.available ? "LIVRE" : "OCUPADO"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#4CD964",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
});
