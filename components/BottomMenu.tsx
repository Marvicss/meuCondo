import { Feather, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const BottomMenu: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push('/home')}>
        <Feather name="home" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/prestacao-morador')}>
        <Feather name="file-text" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/notice')}>
        <Feather name="volume-2" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/parking')}>
        <FontAwesome name="car" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/reservas/morador')}>
        <Feather name="calendar" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#2F80ED',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});

export default BottomMenu;