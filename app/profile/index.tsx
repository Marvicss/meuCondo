import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import api from '../services/api';
import { API_URL } from '@/constants/envs';


ProfileScreen.options = {
  headerShown: false,
};

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
                // Usa diretamente a rota de avatar que você criou
                const avatarResponse = await fetch(`${getUploadBaseURL()}/users/${userId}/avatar`, {
                  method: 'GET',
                  headers: { 'Authorization': `Bearer ${token}` },
                });
                
                if (avatarResponse.ok) {
                  data = await avatarResponse.json();
                } else {
                  // Se falhar, tenta a rota padrão
                  const res = await api.get(`/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
                  data = res.data;
                }
              } catch {
                data = null;
              }
            }
          }
        } catch (err) {
          // falha ao decodificar token
        }

        if (!data) {
          data = (await tryGet('/users/me')) || (await tryGet('/auth/me')) || (await tryGet('/users/'));
        }

        if (mounted && data) {
          // Constrói URL completa do avatar se existir
          const existingAvatarPath = data.avatarUrl || data.picture || data.avatar;
          const fullAvatarUrl = buildAvatarUrl(existingAvatarPath);
         
         console.log('🖼️ Avatar path encontrado:', existingAvatarPath);
         console.log('🖼️ Avatar URL final:', fullAvatarUrl);

          setUser({
            id: data.id,
            name: data.fullName || data.name || data.username || data.email,
            apartment: data.apartment || data.apt || data.apartmentNumber || null,
            avatarUrl: fullAvatarUrl,
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

  // Função para selecionar e fazer upload do avatar
  const handleSelectAvatar = async () => {
    try {
      // Solicita permissões
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'É preciso permitir acesso à galeria para alterar o avatar.');
        return;
      }

      // Abre seletor de imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        // Força o formato JPEG para compatibilidade
        allowsMultipleSelection: false,
      });

      console.log('ImagePicker result:', result); // Debug

      if (result.canceled || !result.assets[0]) {
        console.log('Seleção cancelada ou sem assets');
        return;
      }

      const imageUri = result.assets[0].uri;
      console.log('URI da imagem selecionada:', imageUri); // Debug
      await uploadAvatar(imageUri);
    } catch (error) {
      console.error('Erro ao selecionar avatar:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  // Função para determinar qual URL usar
  const getUploadBaseURL = () => {
    const url = API_URL;
    console.log('🔧 Base URL configurada:', url);
    return url;
  };

  // Função para construir URL completa do avatar
  const buildAvatarUrl = (avatarPath: string | null | undefined): string | null => {
    if (!avatarPath) return null;
    
    // Se já é uma URL completa, retorna como está
    if (avatarPath.startsWith('http')) return avatarPath;
    
    // Se é path relativo, constrói URL completa
    if (avatarPath.startsWith('/uploads/')) {
      return `${getUploadBaseURL()}${avatarPath}`;
    }
    
    return avatarPath;
  };

  // Função para fazer upload do avatar
  const uploadAvatar = async (imageUri: string) => {
    if (!user?.id) {
      console.log('❌ Erro: user.id não encontrado');
      Alert.alert('Erro', 'ID do usuário não encontrado');
      return;
    }

    console.log('🚀 Iniciando upload para usuário:', user.id);
    setUploadingAvatar(true);
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('❌ Token não encontrado');
        router.replace('/login');
        return;
      }

      console.log('✅ Token encontrado');

      // Criar FormData
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const uploadURL = `${getUploadBaseURL()}/users/${user.id}/avatar`;
      console.log('🌐 Upload URL:', uploadURL);

      // Testar se o backend está respondendo primeiro
      console.log('🔍 Testando conexão com backend...');
      try {
        const testResponse = await fetch(getUploadBaseURL(), { method: 'GET' });
        console.log('✅ Backend respondeu:', testResponse.status);
      } catch (testError) {
        console.log('❌ Backend não está respondendo:', testError);
        Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
        return;
      }

      console.log('📤 Enviando arquivo para:', uploadURL);
      const response = await fetch(uploadURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Erro do servidor:', errorText);
        Alert.alert('Erro do Servidor', `Status: ${response.status}\nDetalhes: ${errorText}`);
        throw new Error(`Falha no upload: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Resultado do upload:', result);
      
      // Atualiza o estado local - constrói URL completa
      const avatarPath = result.data?.avatarUrl || result.data?.avatar || result.avatarUrl;
      const newAvatarUrl = buildAvatarUrl(avatarPath) || imageUri;
      console.log('🖼️ Nova URL do avatar:', newAvatarUrl);

      setUser(prev => prev ? {
        ...prev,
        avatarUrl: newAvatarUrl
      } : null);

      Alert.alert('Sucesso! 🎉', 'Avatar atualizado com sucesso!');
    } catch (error) {
      console.log('❌ Erro completo:', error);
      Alert.alert('Erro', `Detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

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
        <TouchableOpacity onPress={handleSelectAvatar} disabled={uploadingAvatar}>
          <View style={styles.avatarContainer}>
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
            {uploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            <View style={styles.avatarEditIcon}>
              <Feather name="camera" size={16} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
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

      <TouchableOpacity style={styles.item} onPress={() => router.push('/ocurrency' as any)}>
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
  container: { flex: 1, padding: 20, paddingTop: 44, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  
  // Estilos para avatar editável
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  userInfo: { flex: 1 },
  name: { fontSize: 25, fontWeight: '700', color: '#111' },
  apartment: { fontSize: 14, color: '#777', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
  
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
  
  footerSpacer: { height: 80 },
  
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