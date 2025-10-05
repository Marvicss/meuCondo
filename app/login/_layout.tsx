// app/login/_layout.tsx
import { Stack } from 'expo-router';

export default function LoginLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}