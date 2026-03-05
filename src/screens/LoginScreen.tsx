import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import type { Palette } from '@/theme/colors';
import { palettes } from '@/theme/colors';
import { useAuth } from '@/state/AuthContext';
import { API_BASE_URL } from '@/config/api';
import { LoginBackground } from '@/components/LoginBackground';

type AuthMode = 'login' | 'register';

const DESKTOP_BREAKPOINT = 1180;
const TABLET_BREAKPOINT = 768;

const HIGHLIGHTS = [
  { icon: '✓', title: 'Tarefas inteligentes' },
  { icon: '📅', title: 'Agenda e calendário' },
  { icon: '🎯', title: 'Metas e progresso' },
  { icon: '💰', title: 'Painel financeiro' },
];

export const LoginScreen = () => {
  const colors = palettes.light;
  const { width, height } = useWindowDimensions();

  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const isTablet = width >= TABLET_BREAKPOINT && width < DESKTOP_BREAKPOINT;
  const isPhone = width < TABLET_BREAKPOINT;
  const isTinyPhone = width <= 360;

  const styles = createStyles(colors, isDesktop, isTablet, width, height);
  const { login, register, loading, error } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Scroll-to-form refs
  const scrollRef = useRef<ScrollView>(null);
  const formLayoutY = useRef(0);
  const contentWrapperLayoutY = useRef(0);

  const scrollToForm = () => {
    scrollRef.current?.scrollTo({
      y: contentWrapperLayoutY.current + formLayoutY.current - 12,
      animated: true,
    });
  };

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
      if (submitError instanceof Error) {
        setLocalError(submitError.message);
      } else {
        setLocalError('Erro inesperado');
      }
    }
  };

  // ── Form card ──────────────────────────────────────────────────────────
  const formCard = (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardTitle}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Text>
        <Text style={styles.cardSubtitle}>
          {mode === 'login'
            ? 'Acesse o Planner com suas credenciais.'
            : 'Cadastre-se para começar a usar o Planner.'}
        </Text>
      </View>

      {mode === 'register' && (
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
      )}

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
          placeholder="••••••"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {(localError ?? error) ? (
        <Text style={styles.errorText}>{localError ?? error}</Text>
      ) : null}

      <Pressable
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonLabel}>
            {mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </Text>
        )}
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={styles.toggleButton}
        onPress={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
      >
        <Text style={styles.toggleLabel}>
          {mode === 'login' ? '✨ Criar uma nova conta' : '← Voltar para login'}
        </Text>
      </Pressable>
    </View>
  );

  // ── Info / hero section ────────────────────────────────────────────────
  const infoSection = (
    <View style={isDesktop ? styles.infoPaneDesktop : styles.infoPaneHero}>
      <View style={styles.infoCenterContent}>
        <Text style={styles.eyebrow}>Planner</Text>
        <Text style={styles.infoTitle}>
          {isPhone ? 'Organize seu dia\ncom clareza.' : 'Organize seu dia com clareza.'}
        </Text>
        <Text style={styles.infoSubtitle}>
          Um lugar para tarefas, metas, agenda, notas e finanças.
          {!isPhone ? '\n' : ' '}
          Você entra em minutos e acompanha tudo em um só fluxo.
        </Text>
        <View style={styles.highlightList}>
          {HIGHLIGHTS.map((item) => (
            <View key={item.title} style={styles.highlightRow}>
              <Text style={styles.highlightIcon}>{item.icon}</Text>
              <Text style={styles.highlightText}>{item.title}</Text>
            </View>
          ))}
        </View>

        {/* "Entrar" scroll link — only on mobile/tablet */}
        {!isDesktop && (
          <Pressable style={styles.scrollBtn} onPress={scrollToForm}>
            <Text style={styles.scrollBtnLabel}>Entrar no Planner</Text>
            <Text style={styles.scrollBtnArrow}>↓</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  // ── Layout ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bgWrapper}>
          <LoginBackground colors={colors} />

          <View
            style={styles.contentWrapper}
            onLayout={(e) => {
              contentWrapperLayoutY.current = e.nativeEvent.layout.y;
            }}
          >
            {isDesktop ? (
              // Desktop: side-by-side
              <>
                {infoSection}
                <View style={styles.formPaneDesktop}>{formCard}</View>
              </>
            ) : (
              // Mobile/tablet: hero info first → form below
              <>
                {infoSection}
                <View
                  style={styles.formPaneMobile}
                  onLayout={(e) => {
                    formLayoutY.current = e.nativeEvent.layout.y;
                  }}
                >
                  {formCard}
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <Text style={styles.hint}>API: {API_BASE_URL}</Text>
    </KeyboardAvoidingView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const createStyles = (
  colors: Palette,
  isDesktop: boolean,
  isTablet: boolean,
  width: number,
  height: number,
) => {
  const isPhone = width < TABLET_BREAKPOINT;
  const isSmallPhone = width <= 430;
  const isTinyPhone = width <= 360;

  const hPad = isTinyPhone ? 16 : isSmallPhone ? 20 : isPhone ? 24 : 32;
  const cardPad = isTinyPhone ? 18 : isSmallPhone ? 22 : 26;
  const cardRadius = isTinyPhone ? 16 : isSmallPhone ? 18 : 22;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },

    // ── Wrapper ──────────────────────────────────────────────────────────
    bgWrapper: {
      flexGrow: 1,
      minHeight: height,
    },
    contentWrapper: {
      flex: 1,
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'center' : 'stretch',
      justifyContent: isDesktop ? 'center' : 'flex-start',
      maxWidth: isDesktop ? 1120 : undefined,
      alignSelf: isDesktop ? 'center' : 'stretch',
      paddingHorizontal: isDesktop ? 40 : 0,
      paddingVertical: isDesktop ? 48 : 0,
      gap: isDesktop ? 64 : 0,
    },

    // ── Info pane: desktop ───────────────────────────────────────────────
    infoPaneDesktop: {
      flex: 1,
      maxWidth: 520,
      gap: 12,
      justifyContent: 'center',
    },
    infoCenterContent: {
      gap: isTinyPhone ? 8 : isSmallPhone ? 10 : 12,
    },

    // ── Info pane: mobile hero (full first screen) ───────────────────────
    infoPaneHero: {
      minHeight: height,
      justifyContent: 'center',
      paddingHorizontal: hPad,
      paddingTop: isTablet ? 40 : isTinyPhone ? 24 : 32,
      paddingBottom: isTinyPhone ? 20 : 28,
    },

    eyebrow: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    infoTitle: {
      fontSize: isDesktop ? 42 : isTablet ? 34 : isTinyPhone ? 28 : isSmallPhone ? 32 : 34,
      lineHeight: isDesktop ? 52 : isTablet ? 42 : isTinyPhone ? 35 : isSmallPhone ? 40 : 42,
      fontWeight: '800',
      color: colors.text,
    },
    infoSubtitle: {
      fontSize: isTinyPhone ? 14 : 15,
      lineHeight: isTinyPhone ? 21 : 23,
      color: colors.textMuted,
      maxWidth: 460,
    },
    highlightList: {
      gap: isTinyPhone ? 6 : 8,
      marginTop: 2,
    },
    highlightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    highlightIcon: {
      fontSize: isPhone ? 17 : 19,
      width: 24,
      textAlign: 'center',
    },
    highlightText: {
      fontSize: isTinyPhone ? 14 : 15,
      color: colors.text,
      fontWeight: '600',
    },

    // ── Scroll-to-form button (mobile hero) ──────────────────────────────
    scrollBtn: {
      marginTop: isTinyPhone ? 16 : isPhone ? 22 : 20,
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 10,
      backgroundColor: colors.accent,
      paddingVertical: isTinyPhone ? 13 : 15,
      paddingHorizontal: isTinyPhone ? 22 : 28,
      borderRadius: 50,
    },
    scrollBtnLabel: {
      color: '#fff',
      fontWeight: '700',
      fontSize: isTinyPhone ? 14 : 16,
    },
    scrollBtnArrow: {
      color: '#fff',
      fontSize: isTinyPhone ? 15 : 17,
      fontWeight: '700',
    },

    // ── Form pane ────────────────────────────────────────────────────────
    formPaneDesktop: {
      flex: 1,
      maxWidth: 440,
      justifyContent: 'center',
    },
    formPaneMobile: {
      paddingHorizontal: hPad,
      paddingTop: isTinyPhone ? 16 : 20,
      paddingBottom: isTinyPhone ? 20 : 28,
    },

    // ── Card ─────────────────────────────────────────────────────────────
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: cardRadius,
      padding: cardPad,
      gap: isTinyPhone ? 12 : 14,
    },
    cardTitle: {
      fontSize: isTinyPhone ? 20 : isSmallPhone ? 22 : 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontSize: isTinyPhone ? 13 : 14,
      color: colors.textMuted,
    },
    fieldGroup: {
      gap: 5,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: isTinyPhone ? 10 : 12,
      paddingHorizontal: isTinyPhone ? 12 : 14,
      paddingVertical: isTinyPhone ? 10 : 12,
      fontSize: isTinyPhone ? 14 : 15,
      color: colors.text,
      backgroundColor: colors.background,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
    },
    submitButton: {
      borderRadius: isTinyPhone ? 12 : 14,
      paddingVertical: isTinyPhone ? 13 : 15,
      alignItems: 'center',
      backgroundColor: colors.accent,
      marginTop: 2,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonLabel: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },
    toggleButton: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: isTinyPhone ? 12 : 14,
      paddingVertical: isTinyPhone ? 11 : 13,
      alignItems: 'center',
    },
    toggleLabel: {
      fontWeight: '600',
      fontSize: isTinyPhone ? 13 : 14,
      color: colors.accent,
    },
    hint: {
      paddingVertical: 8,
      textAlign: 'center',
      fontSize: 11,
      color: colors.textMuted,
    },
  });
};
