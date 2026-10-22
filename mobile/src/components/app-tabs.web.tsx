
import { Stack } from 'expo-router';

export default function AppTabs() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#F0F4FA',
        },
      }}
    />
  );
}
