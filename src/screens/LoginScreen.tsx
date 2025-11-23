import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/colors';
import { useAuth } from '@/state/AuthContext';

type AuthMode = 'login' | 'register';

export const LoginScreen = () => {
  const colors = useColors();
  const styles = createStyles(colors);
  const { login, register, loading, error } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password || (mode === 'register' && !name.trim())) {
      setLocalError('Preencha todos os campos obrigatórios.');
      return;
    }
    try {
      setLocalError(null);
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim());
      }
    } catch (submitError) {
      // erro já tratado no contexto; guardamos uma flag local para feedback imediato
      if (submitError instanceof Error) {
        setLocalError(submitError.message);
      } else {
        setLocalError('Erro inesperado');
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Acesse o Planner com suas credenciais.' : 'Cadastre-se para começar a usar o Planner.'}
        </Text>

        {mode === 'register' ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome completo"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="voce@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="******"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {(localError || error) && <Text style={styles.error}>{localError ?? error}</Text>}

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buttonLabel}>{mode === 'login' ? 'Entrar' : 'Cadastrar'}</Text>
          )}
        </Pressable>
        <Pressable onPress={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}>
          <Text style={styles.toggle}>
            {mode === 'login' ? 'Ainda não possui conta? Cadastre-se.' : 'Já possui conta? Entre aqui.'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.background
    },
    card: {
      width: '100%',
      maxWidth: 420,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      backgroundColor: colors.surface,
      gap: 16
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 14
    },
    fieldGroup: {
      gap: 6
    },
    label: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase'
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.text
    },
    button: {
      marginTop: 8,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.accent
    },
    buttonDisabled: {
      opacity: 0.6
    },
    buttonLabel: {
      color: colors.background,
      fontWeight: '600'
    },
    error: {
      color: '#f87171',
      fontSize: 13
    },
    toggle: {
      textAlign: 'center',
      color: colors.accent,
      fontWeight: '600'
    }
  });
