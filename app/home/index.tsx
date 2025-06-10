// app/home.tsx
import BottomMenu from '@/components/BottomMenu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type DecodedToken = {
  userId: string;
  email: string;
  userType: string;
};

type Customer = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  cpf: string;
  userType: string;
  createdAt: string;
};

type News = {
  id: string;
  condomimniumId: string;
  message: string;
  type: string;
  createdAt: string;
};

type PartyRoom = {
  id: string;
  name: string;
  description: string;
  capacity: string;
  availabe: boolean;
  condominiumId: string;
  createdAt: string;
  updatedAt: string;
};

const Home = () => {
  const router = useRouter();
  const [user, setUser] = useState<Customer | null>(null);
  const [news, setNews] = useState<News[] | null>(null);
  const [partyRoom, setPartyRoom] = useState<PartyRoom[] | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("Falha ao decodificar o token");
        return;
      }

      const decoded: DecodedToken = jwtDecode(token);

      try {
        const [userResponse, newsResponse, partyRoomResponse] = await Promise.all([
          fetch(`https://meu-condo.vercel.app/users/${decoded.userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`https://meu-condo.vercel.app/news/`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`https://meu-condo.vercel.app/partyrooms/`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!userResponse.ok || !newsResponse.ok) {
          const errorUser = await userResponse.json();
          const errorNews = await newsResponse.json();
          Alert.alert("Erro ao carregar", errorUser.message || errorNews.message || "Erro desconhecido");
          return;
        }

        const userData = await userResponse.json();
        const newsData: News[] = await newsResponse.json();
        const paratyRoomData: PartyRoom[] = await partyRoomResponse.json();

        setUser(userData);
        setNews(newsData);
        setPartyRoom(paratyRoomData);
      } catch (err) {
        Alert.alert("Erro", "Falha na comunicação com o servidor.");
      }
    };

    fetchUserInfo();
  }, []);

  const latestNews = news?.slice().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* 1. Informações do usuário */}
        <View style={styles.userInfo}>
          <View style={styles.avatarPlaceholder} />
          <View>
            <Text style={styles.userName}>{user?.fullName || 'Usuário'}</Text>
            <Text>cpf : {user?.cpf || '-'}</Text>
            <Text>type : {user?.userType || '-'}</Text>
          </View>
        </View>

        {/* 2. Último aviso publicado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Último aviso publicado</Text>
          {latestNews ? (
            <View style={styles.cardAviso}>
              <View style={styles.blueBar} />
              <View style={styles.avisoContent}>
                <Text style={styles.avisoTitle}>{latestNews.message}</Text>
                <Text style={{ color: '#888', fontSize: 12 }}>
                  Publicado em {new Date(latestNews.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={{ color: '#888' }}>Nenhum aviso disponível</Text>
          )}
          <TouchableOpacity onPress={() => router.push('./notice')}>
            <Text style={styles.verMais}>Ver mais avisos</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Próximas reservas - agora como lista vertical */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas reservas</Text>
          {partyRoom && partyRoom.length > 0 ? (
            partyRoom.map((item) => (
              <View key={item.id} style={styles.reservaCard}>
                <Text style={styles.reservaTitle}>{item.name}</Text>
                <Text>Descrição: {item.description}</Text>
                <Text>Capacidade: {item.capacity}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#888' }}>Nenhuma reserva encontrada</Text>
          )}
        </View>

      </ScrollView>

      {/* Bottom Menu */}
      <BottomMenu />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 40 
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2C94C',
    marginRight: 12,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardAviso: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    padding: 12,
    marginBottom: 8,
  },
  blueBar: {
    width: 6,
    backgroundColor: '#2F80ED',
    borderRadius: 4,
    marginRight: 12,
  },
  avisoContent: {
    flex: 1,
  },
  avisoTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  verMais: {
    color: '#2F80ED',
    fontWeight: 'bold',
    alignSelf: 'flex-end',
  },
  reservaCard: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reservaTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
