import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from '@/screens/HomeScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { ThemeProvider, useThemeMode, useColors } from '@/theme/ThemeProvider';
import { DesktopShell } from '@/components/DesktopShell';
import { AuthProvider, useAuth } from '@/state/AuthContext';

const Root = () => {
  const { mode } = useThemeMode();
  const colors = useColors();
  const { bootstrapping, token } = useAuth();

  if (bootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {token ? <HomeScreen /> : <LoginScreen />}
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <DesktopShell>
            <Root />
          </DesktopShell>
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
