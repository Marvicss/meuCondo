// app/components/SideMenu.tsx

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons'; // Usaremos os ícones do Feather

// --- DADOS DO USUÁRIO E ITENS DO MENU ---
// No seu app real, esses dados viriam do estado global, AsyncStorage ou de uma API
const userData = {
  name: 'Maria Clara',
  apartment: 'Apt. 202',
  avatarUrl: 'https://i.pravatar.cc/150?u=mariaclara', // Usando uma imagem de placeholder
};

const menuItems = [
  { key: 'home', title: 'Home', icon: 'home' },
  { key: 'occurrences', title: 'Ocorrências', icon: 'file-text' },
  { key: 'parking', title: 'Estacionamento', icon: 'truck' },
  // Adicione mais itens aqui conforme necessário
  // { key: 'reservations', title: 'Reservas', icon: 'calendar' },
  // { key: 'logout', title: 'Sair', icon: 'log-out' },
];

// --- O COMPONENTE DO MENU ---
const SideMenu = () => {
  // Função para lidar com o clique (aqui só exibimos no console)
  const handleMenuPress = (screenKey: string) => {
    console.log(`Navegar para a tela: ${screenKey}`);
    // Aqui você colocaria a lógica de navegação, por exemplo:
    // router.push(`/${screenKey}`);
  };

  return (
    <View style={styles.container}>
      {/* Seção do Perfil do Usuário */}
      <View style={styles.profileContainer}>
        <Image source={{ uri: userData.avatarUrl }} style={styles.profileImage} />
        <Text style={styles.profileName}>{userData.name}</Text>
        <Text style={styles.profileSubtitle}>{userData.apartment}</Text>
      </View>

      {/* Linha Separadora */}
      <View style={styles.separator} />

      {/* Seção dos Itens do Menu */}
      <View style={styles.menuItemsContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity 
            key={item.key} 
            style={styles.menuItem} 
            onPress={() => handleMenuPress(item.key)}
          >
            <Feather name={item.icon as any} size={22} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 40, // Espaço para a status bar
    paddingHorizontal: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45, // Metade da largura/altura para fazer um círculo
    borderWidth: 2,
    borderColor: '#F0F0F0',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    width: '100%',
    marginVertical: 15,
  },
  menuItemsContainer: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // Espaçamento vertical de cada item
  },
  menuIcon: {
    marginRight: 20,
    color: '#555555',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
});

export default SideMenu;