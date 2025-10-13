import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer'; 
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

type DecodedToken = { userId: string; email: string; userType: string; };
type UserProfile = { fullName: string; };

const menuItems = [
  { icon: 'home-outline', label: 'Home', route: '/home' },
  { icon: 'car-sport-outline', label: 'Parking', route: '/parking' },
];

export default function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          const decoded: DecodedToken = jwtDecode(token);
          const response = await fetch(`https://meu-condo.vercel.app/users/${decoded.userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        } catch (e) {
          console.error("Failed to fetch user data for drawer:", e);
        }
      }
    };
    fetchUserData();
  }, []);

  return (
    <DrawerContentScrollView {...props} style={{backgroundColor: '#fff'}}>
      <View style={styles.container}>
        <View style={styles.profileContainer}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{user?.fullName || 'Nome do Usuário'}</Text>
          <Text style={styles.profileInfo}>Apt. 202</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.navSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.navItem, pathname === item.route && styles.navItemActive]}
              // CORREÇÃO 4
              onPress={() => router.push(item.route as any)}
            >
              <Ionicons 
                name={item.icon as any} 
                size={22} 
                color={pathname === item.route ? '#007AFF' : '#555'}
              />
              <Text style={[styles.navLabel, pathname === item.route && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, },
  profileContainer: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 25, },
  profileImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 2, borderColor: '#eee' },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#333', },
  profileInfo: { fontSize: 14, color: '#888', },
  divider: { borderBottomColor: '#f0f0f0', borderBottomWidth: 1, marginHorizontal: 20, marginBottom: 15, },
  navSection: { marginTop: 10, paddingHorizontal: 15, },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 15, borderRadius: 8, marginBottom: 5, },
  navItemActive: { backgroundColor: 'rgba(0, 122, 255, 0.1)', },
  navLabel: { fontSize: 16, marginLeft: 20, color: '#555', fontWeight: '500', },
  navLabelActive: { color: '#007AFF', fontWeight: 'bold', },
});