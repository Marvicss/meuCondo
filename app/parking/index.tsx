import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomMenu from '@/components/BottomMenu';
import { FontAwesome } from '@expo/vector-icons'; // lá no topo


type ParkingLot = {
  id: string;
  name: string;
  description: string;
  status: 'LIVRE' | 'OCUPADO';
  available: boolean;
};

export default function ParkingLotPage() {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchParkings = async () => {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      fetch("https://meu-condo.vercel.app/parkings/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setParkingLots(data);
        })
        .catch((err) => console.error("Erro ao buscar estacionamentos:", err));
    };

    fetchParkings();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <Text style={{ textAlign: 'center', marginTop: 40, fontSize: 22, fontWeight: '700', color: '#1E60E5' }}>
        Vagas do Condomínio
      </Text>

      <ScrollView style={{ padding: 16 }}>
        {parkingLots.map((lot) => (
          <View
            key={lot.id}
            style={{
              backgroundColor: '#fff',
              padding: 20,
              borderRadius: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <FontAwesome name="car" size={28} color="#1E60E5" style={{ marginRight: 10 }} />

              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{lot.name}</Text>
            </View>

            <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 10 }}>{lot.description}</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: lot.available ? '#10B981' : '#EF4444',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>
                  {lot.available ? 'Disponível' : 'Indisponível'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push(`/parking/${lot.id}`)}
              style={{
                backgroundColor: '#1E60E5',
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Ver detalhes</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <BottomMenu />
    </View>
  );
}
