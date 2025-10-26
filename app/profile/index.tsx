import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import api from '../services/api';


export const options = {
  headerShown: false,
};

type User = {
  id: string;
  name?: string;
  email?: string;
  apartment?: string | null;
  avatarUrl?: string | null;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/login');
          return;
        }

     
        const tryGet = async (path: string) => {
          try {
            const res = await api.get(path, { headers: { Authorization: `Bearer ${token}` } });
            return res.data;
          } catch {
            return null;
          }
        };

        let data = null;


        try {
          const parts = token.split('.');
          if (parts.length >= 2) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            const userId = payload.userId || payload.sub;
            if (userId) {
              try {
                const res = await api.get(`/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
                data = res.data;
              } catch {
                data = null;
              }
            }
          }
        } catch (err) {
        
        }

      
        if (!data) {
          data = (await tryGet('/users/me')) || (await tryGet('/auth/me')) || (await tryGet('/users/'));
        }

        if (mounted && data) {
          setUser({
            id: data.id,
            name: data.fullName || data.name || data.username || data.email,
            apartment: data.apartment || data.apt || data.apartmentNumber || null,
            avatarUrl: data.avatarUrl || data.picture || null,
            email: data.email,
          });
        }
      } catch (error) {
        console.error('Erro ao buscar usuário logado', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.replace('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={
            user?.avatarUrl
              ? { uri: user.avatarUrl }
              : {
                  uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name ?? 'Usuário'
                  )}&background=ffffff&color=0A84FF&rounded=true&size=128`,
                }
          }
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {user?.name ?? 'Usuário'}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.apartment}>
            {user?.apartment ? `Apt. ${user.apartment}` : ''}
          </ThemedText>
        </View>
      </View>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.item} onPress={() => router.push('/home' as any)}>
        <View style={styles.iconWrapper}>
          <Feather name="home" size={20} color="#0A84FF" />
        </View>
        <ThemedText style={styles.itemText}>Home</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => router.push('/ocorrencias-sindico' as any)}>
        <View style={styles.iconWrapper}>
          <Feather name="file" size={20} color="#0A84FF" />
        </View>
        <ThemedText style={styles.itemText}>Ocorrências</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => router.push('/parking' as any)}>
        <View style={styles.iconWrapper}>
          <Feather name="truck" size={20} color="#0A84FF" />
        </View>
        <ThemedText style={styles.itemText}>Estacionamento</ThemedText>
      </TouchableOpacity>
      {/* Botão de Logout */}
      <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
        <View style={styles.logoutIconWrapper}>
          <Feather name="log-out" size={20} color="#FF3B30" />
        </View>
        <ThemedText style={styles.logoutText}>Sair</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // aumenta o espaçamento superior para "descer" todo o conteúdo
  container: { flex: 1, padding: 20, paddingTop: 44, backgroundColor: '#fff' },

  // dá mais espaço entre avatar e lista
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },

  avatar: { width: 72, height: 72, borderRadius: 36, marginRight: 12 },
  userInfo: { flex: 1 },
  name: { fontSize: 25, fontWeight: '700', color: '#111' },
  apartment: { fontSize: 14, color: '#777', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },

  // aumenta espaçamento vertical dos itens e do ícone
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
  itemText: { fontSize: 16, color: '#111', marginLeft: 16 },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f1f7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // pequenos ajustes visuais
  footerSpacer: { height: 80 },

  // estilos específicos para o botão de logout
  logoutItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 18, 
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
   },
   logoutText: { 
    fontSize: 16, 
    color: '#FF3B30', 
    marginLeft: 16, 
    fontWeight: '500' 
   },
   logoutIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff2f2',
    alignItems: 'center',
    justifyContent: 'center',
   },
});