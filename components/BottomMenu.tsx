import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const ICON_COLOR_INACTIVE = '#A0A0A0';
const ICON_COLOR_ACTIVE = '#FFFFFF';
const ICON_BG_ACTIVE = '#0095FF';

type Role = 'ADMIN' | 'USER';

interface DecodedToken {
  userId: string;
  email: string;
  userType: Role;
  iat: number;
  exp: number;
}

const MORADOR_ROUTES = {
  home: '/home',
  cash: '/prestacao-morador',
  notice: '/notice',
  reservas: '/votation/morador',
  parking: '/reservas/morador',
};

const ADMIN_ROUTES = {
  home: '/home',
  cash: '/addAccountability',
  notice: '/news-sindico',
  reservas: '/votation/sindico',
  parking: '/reservas/sindico',
};

const BottomMenu: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<Role>('USER');

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded?.userType === 'ADMIN' || decoded?.userType === 'USER') {
          setRole(decoded.userType);
        } else {
          setRole('USER');
        }
      } catch {
        setRole('USER');
      }
    })();
  }, []);

  const routes = role === 'ADMIN' ? ADMIN_ROUTES : MORADOR_ROUTES;

  const menuItems = [
    { key: 'home', icon: <Feather name="home" size={28} /> },
    { key: 'cash', icon: <Ionicons name="cash-outline" size={28} /> },
    { key: 'notice', icon: <Feather name="bell" size={28} /> },
    { key: 'reservas', icon: <Ionicons name="checkmark-done-outline" size={28} /> },
    { key: 'parking', icon: <Ionicons name="calendar-outline" size={28} /> },
  ] as const;

  const getActiveIconName = (name: string) => name.replace('-outline', '');

  return (
    <View style={styles.container}>
      {menuItems.map(item => {
        const route = routes[item.key as keyof typeof routes];
        const isActive = pathname === route;

        return (
          <TouchableOpacity
            key={item.key}
            onPress={() => router.push(route as any)}
            style={styles.tabButton}
          >
            <View style={isActive ? styles.activeIconContainer : null}>
              {React.cloneElement(item.icon, {
                color: isActive ? ICON_COLOR_ACTIVE : ICON_COLOR_INACTIVE,
                name: isActive ? getActiveIconName(item.icon.props.name) : item.icon.props.name,
              })}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 70,
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    backgroundColor: ICON_BG_ACTIVE,
    padding: 12,
    borderRadius: 30,
  },
});

export default BottomMenu;