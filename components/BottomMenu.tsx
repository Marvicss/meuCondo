import { useRouter, usePathname } from 'expo-router';
import React from 'react';
// Importe o componente 'Image'
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';

const ICON_ACTIVE_BG = '#0099FF';

const BottomMenu: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Array de menu atualizado com imagens
  const menu = [
    { 
      route: '/home', 
      key: 'home',
      // Substitua com os nomes corretos dos seus arquivos
      icon: require('../assets/icons/Home.png'), 
      iconActive: require('../assets/icons/homecheia.png') 
    },
    { 
      route: '/prestacao-morador', 
      key: 'cash',
      icon: require('../assets/icons/Dollar.png'),
      iconActive: require('../assets/icons/dollarcheia.png')
    },
    { 
      route: '/notice', 
      key: 'notice',
      icon: require('../assets/icons/notice.png'),
      iconActive: require('../assets/icons/noticecheia.png')
    },
    { 
      route: '/reservas/morador', 
      key: 'reservas',
      icon: require('../assets/icons/Todo.png'),
      iconActive: require('../assets/icons/votarcheia.png')
    },
    { 
      route: '/parking', 
      key: 'parking',
      icon: require('../assets/icons/Calendar.png'),
      iconActive: require('../assets/icons/calendarcheia.png')
    },
  ];

  return (
    <View style={styles.container}>
      {menu.map(item => {
        const isActive = pathname === item.route;
        return (
          <TouchableOpacity key={item.key} onPress={() => router.push(item.route as any)}>
            <View style={isActive ? styles.activeCircle : undefined}>
              {/* Usamos o componente Image aqui */}
              <Image
                // A fonte (source) muda se o item estiver ativo
                source={isActive ? item.iconActive : item.icon}
                style={styles.icon}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 5,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  activeCircle: {
    backgroundColor: ICON_ACTIVE_BG,
    borderRadius: 32,
    padding: 12,
  },
  // Novo estilo para definir o tamanho da imagem
  icon: {
    width: 28,
    height: 28,
    resizeMode: 'contain', // Garante que a imagem caiba no espaço
  },
});

export default BottomMenu;