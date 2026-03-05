import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/colors';

interface LoginBackgroundProps {
  colors?: Palette;
}

// ── Pencil shape ─────────────────────────────────────────────────────────────
const Pencil = ({ color, size = 1 }: { color: string; size?: number }) => (
  <View style={{ alignItems: 'center' }}>
    {/* eraser */}
    <View style={{ width: 14 * size, height: 8 * size, backgroundColor: '#F472B6', borderRadius: 3 * size }} />
    {/* ferrule */}
    <View style={{ width: 14 * size, height: 4 * size, backgroundColor: '#94A3B8' }} />
    {/* body */}
    <View style={{ width: 14 * size, height: 48 * size, backgroundColor: color }} />
    {/* wood section */}
    <View style={{ width: 14 * size, height: 8 * size, backgroundColor: '#D97706' }} />
    {/* graphite tip */}
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: 7 * size,
        borderRightWidth: 7 * size,
        borderTopWidth: 10 * size,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#78350F',
      }}
    />
  </View>
);

// ── Ruler shape ───────────────────────────────────────────────────────────────
const Ruler = ({ color, width = 110, height = 22 }: { color: string; width?: number; height?: number }) => (
  <View style={{ width, height, backgroundColor: color, borderRadius: 3, overflow: 'hidden' }}>
    {[...Array(12)].map((_, i) => (
      <View
        key={i}
        style={{
          position: 'absolute',
          left: 6 + i * 9,
          top: 0,
          width: 1,
          height: i % 4 === 0 ? 10 : 6,
          backgroundColor: 'rgba(255,255,255,0.55)',
        }}
      />
    ))}
    {/* number labels suggestion with small lines at bottom */}
    {[...Array(12)].map((_, i) => (
      <View
        key={`b${i}`}
        style={{
          position: 'absolute',
          left: 6 + i * 9,
          bottom: 0,
          width: 1,
          height: i % 4 === 0 ? 10 : 6,
          backgroundColor: 'rgba(255,255,255,0.55)',
        }}
      />
    ))}
  </View>
);

// ── Pen shape ─────────────────────────────────────────────────────────────────
const FountainPen = ({ color }: { color: string }) => (
  <View style={{ alignItems: 'center' }}>
    {/* clip/button */}
    <View style={{ width: 8, height: 6, backgroundColor: '#CBD5E1', borderRadius: 3 }} />
    {/* cap */}
    <View style={{ width: 10, height: 20, backgroundColor: '#334155', borderRadius: 5 }} />
    {/* body */}
    <View style={{ width: 10, height: 40, backgroundColor: color, borderRadius: 2 }} />
    {/* grip section */}
    <View style={{ width: 9, height: 12, backgroundColor: '#475569', borderRadius: 2 }} />
    {/* nib */}
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: 4.5,
        borderRightWidth: 4.5,
        borderTopWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#CBD5E1',
      }}
    />
  </View>
);

// ── Eraser shape ──────────────────────────────────────────────────────────────
const Eraser = ({ color }: { color: string }) => (
  <View
    style={{
      width: 42,
      height: 20,
      backgroundColor: color,
      borderRadius: 4,
      justifyContent: 'center',
      paddingLeft: 16,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.08)',
    }}
  >
    <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginBottom: 4 }} />
    <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.1)' }} />
  </View>
);

// ── Paperclip shape ───────────────────────────────────────────────────────────
const Paperclip = ({ color }: { color: string }) => (
  <View style={{ width: 16, height: 42, alignItems: 'center', justifyContent: 'center' }}>
    {/* outer loop */}
    <View
      style={{
        position: 'absolute',
        width: 16,
        height: 38,
        borderWidth: 2.5,
        borderColor: color,
        borderRadius: 8,
        top: 0,
      }}
    />
    {/* inner curve - smaller */}
    <View
      style={{
        position: 'absolute',
        width: 10,
        height: 24,
        borderWidth: 2.5,
        borderColor: color,
        borderRadius: 5,
        top: 10,
      }}
    />
  </View>
);

// ── Target / Goal ─────────────────────────────────────────────────────────────
const Target = ({ color, size = 52 }: { color: string; size?: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ position: 'absolute', width: size, height: size, borderWidth: 2, borderColor: color, borderRadius: size / 2 }} />
    <View style={{ position: 'absolute', width: size * 0.62, height: size * 0.62, borderWidth: 2, borderColor: color, borderRadius: size / 2 }} />
    <View style={{ width: size * 0.25, height: size * 0.25, backgroundColor: color, borderRadius: size / 2 }} />
  </View>
);

// ── Checkbox item ─────────────────────────────────────────────────────────────
const CheckItem = ({ color, checked = false, lineWidth = 40 }: { color: string; checked?: boolean; lineWidth?: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <View
      style={{
        width: 14,
        height: 14,
        borderWidth: 2,
        borderColor: color,
        borderRadius: 3,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {checked && <Text style={{ fontSize: 9, color, fontWeight: '700', lineHeight: 11 }}>✓</Text>}
    </View>
    <View style={{ width: lineWidth, height: 2, backgroundColor: color, borderRadius: 1, opacity: checked ? 0.4 : 0.7 }} />
  </View>
);

// ── Note card ─────────────────────────────────────────────────────────────────
const NoteCard = ({ color, lines = 3 }: { color: string; lines?: number }) => (
  <View
    style={{
      width: 64,
      padding: 8,
      paddingTop: 10,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: color,
      borderLeftWidth: 4,
      gap: 5,
    }}
  >
    {Array.from({ length: lines }).map((_, i) => (
      <View
        key={i}
        style={{
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
          width: i === lines - 1 ? '55%' : i === 1 ? '75%' : '100%',
        }}
      />
    ))}
  </View>
);

// ── Calendar icon ─────────────────────────────────────────────────────────────
const CalendarIcon = ({ color, size = 52 }: { color: string; size?: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderWidth: 2,
      borderColor: color,
      borderRadius: 8,
      overflow: 'hidden',
    }}
  >
    {/* header bar */}
    <View style={{ height: size * 0.28, backgroundColor: color, opacity: 0.25 }} />
    {/* grid */}
    <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 3, gap: 2 }}>
      {[...Array(6)].map((_, i) => (
        <View
          key={i}
          style={{
            width: (size - 14) / 3 - 1,
            height: (size * 0.72 - 16) / 2,
            borderRadius: 2,
            backgroundColor: i === 2 ? color : 'transparent',
            borderWidth: 1,
            borderColor: color,
            opacity: 0.6,
          }}
        />
      ))}
    </View>
  </View>
);

// ── Bookmark ──────────────────────────────────────────────────────────────────
const Bookmark = ({ color }: { color: string }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={{ width: 24, height: 36, backgroundColor: color, borderRadius: 3 }} />
    <View
      style={{
        marginTop: -1,
        width: 0,
        height: 0,
        borderLeftWidth: 12,
        borderRightWidth: 12,
        borderTopWidth: 10,
        borderLeftColor: color,
        borderRightColor: color,
        borderTopColor: 'transparent',
        transform: [{ rotate: '180deg' }],
      }}
    />
  </View>
);

// ── Star ──────────────────────────────────────────────────────────────────────
const Star = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Text style={{ fontSize: size, color, lineHeight: size * 1.2 }}>★</Text>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Main background component
// ═══════════════════════════════════════════════════════════════════════════════
export const LoginBackground = ({ colors: overrideColors }: LoginBackgroundProps) => {
  const themedColors = useColors();
  const colors = overrideColors ?? themedColors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.background}>
      {/* Photo background */}
      <Image
        source={require('@/img/Planner.jpg')}
        style={styles.bgImage}
        resizeMode="cover"
      />
      {/* Whitening overlay so text remains readable */}
      <View style={[styles.fill, { backgroundColor: colors.background, opacity: 0.72 }]} />

      {/* ── TOP-LEFT CORNER ────────────────────────────────────────────────── */}
      <View style={[styles.el, { top: 18, left: 10, opacity: 0.12, transform: [{ rotate: '-12deg' }] }]}>
        <Pencil color={colors.accent} />
      </View>

      <View style={[styles.el, { top: 8, left: 60, opacity: 0.09 }]}>
        <CalendarIcon color={colors.primary} size={44} />
      </View>

      <View style={[styles.el, { top: 90, left: 8, opacity: 0.08 }]}>
        <Ruler color={colors.primary} width={90} height={18} />
      </View>

      <View style={[styles.el, { top: 40, left: 130, opacity: 0.06 }]}>
        <Star color={colors.accent} size={14} />
      </View>

      {/* ── TOP-RIGHT CORNER ───────────────────────────────────────────────── */}
      <View style={[styles.el, { top: 12, right: 14, opacity: 0.10, transform: [{ rotate: '10deg' }] }]}>
        <FountainPen color={colors.primary} />
      </View>

      <View style={[styles.el, { top: 16, right: 80, opacity: 0.08 }]}>
        <NoteCard color={colors.primary} lines={3} />
      </View>

      <View style={[styles.el, { top: 100, right: 10, opacity: 0.09, transform: [{ rotate: '-6deg' }] }]}>
        <Ruler color={colors.accent} width={80} height={16} />
      </View>

      <View style={[styles.el, { top: 70, right: 100, opacity: 0.06 }]}>
        <Star color={colors.primary} size={12} />
      </View>

      {/* ── MID-LEFT EDGE ──────────────────────────────────────────────────── */}
      <View style={[styles.el, { top: '22%', left: 6, opacity: 0.07 }]}>
        <Paperclip color={colors.accent} />
      </View>

      <View style={[styles.el, { top: '30%', left: 14, opacity: 0.06 }]}>
        <CheckItem color={colors.primary} checked />
      </View>
      <View style={[styles.el, { top: '35%', left: 14, opacity: 0.05 }]}>
        <CheckItem color={colors.primary} checked={false} lineWidth={32} />
      </View>
      <View style={[styles.el, { top: '40%', left: 14, opacity: 0.05 }]}>
        <CheckItem color={colors.accent} checked lineWidth={28} />
      </View>

      <View style={[styles.el, { top: '52%', left: 8, opacity: 0.07, transform: [{ rotate: '5deg' }] }]}>
        <NoteCard color={colors.accent} lines={4} />
      </View>

      <View style={[styles.el, { top: '65%', left: 5, opacity: 0.06 }]}>
        <Bookmark color={colors.primary} />
      </View>

      {/* ── MID-RIGHT EDGE ─────────────────────────────────────────────────── */}
      <View style={[styles.el, { top: '20%', right: 8, opacity: 0.08 }]}>
        <Target color={colors.primary} size={48} />
      </View>

      <View style={[styles.el, { top: '38%', right: 6, opacity: 0.06, transform: [{ rotate: '-8deg' }] }]}>
        <Pencil color={colors.primary} size={0.75} />
      </View>

      <View style={[styles.el, { top: '55%', right: 10, opacity: 0.07 }]}>
        <Eraser color={colors.accent} />
      </View>

      <View style={[styles.el, { top: '68%', right: 8, opacity: 0.06 }]}>
        <Bookmark color={colors.accent} />
      </View>

      {/* ── BOTTOM-LEFT CORNER ─────────────────────────────────────────────── */}
      <View style={[styles.el, { bottom: 100, left: 8, opacity: 0.09, transform: [{ rotate: '15deg' }] }]}>
        <CalendarIcon color={colors.accent} size={50} />
      </View>

      <View style={[styles.el, { bottom: 50, left: 10, opacity: 0.08, transform: [{ rotate: '-5deg' }] }]}>
        <Ruler color={colors.primary} width={100} height={20} />
      </View>

      <View style={[styles.el, { bottom: 16, left: 14, opacity: 0.06 }]}>
        <Paperclip color={colors.primary} />
      </View>

      <View style={[styles.el, { bottom: 130, left: 80, opacity: 0.05 }]}>
        <Star color={colors.accent} size={16} />
      </View>

      {/* ── BOTTOM-RIGHT CORNER ────────────────────────────────────────────── */}
      <View style={[styles.el, { bottom: 90, right: 10, opacity: 0.12, transform: [{ rotate: '8deg' }] }]}>
        <Pencil color={colors.accent} size={1.1} />
      </View>

      <View style={[styles.el, { bottom: 20, right: 14, opacity: 0.09, transform: [{ rotate: '-10deg' }] }]}>
        <NoteCard color={colors.primary} lines={3} />
      </View>

      <View style={[styles.el, { bottom: 60, right: 80, opacity: 0.07 }]}>
        <Target color={colors.accent} size={40} />
      </View>

      <View style={[styles.el, { bottom: 140, right: 8, opacity: 0.07, transform: [{ rotate: '12deg' }] }]}>
        <FountainPen color={colors.accent} />
      </View>

      <View style={[styles.el, { bottom: 12, right: 90, opacity: 0.05 }]}>
        <Star color={colors.primary} size={18} />
      </View>

      {/* ── CENTER ZONE — very faint phrases only ──────────────────────────── */}
      <Text style={[styles.phrase, { top: '12%', left: '22%', color: colors.accent }]}>Organize</Text>
      <Text style={[styles.phrase, { top: '18%', right: '18%', color: colors.primary }]}>Planeje</Text>
      <Text style={[styles.phrase, { bottom: '18%', left: '18%', color: colors.accent }]}>Evolua</Text>
      <Text style={[styles.phrase, { bottom: '12%', right: '22%', color: colors.primary }]}>Realize</Text>

      {/* ── SCATTERED DOTS ─────────────────────────────────────────────────── */}
      <View style={[styles.dot, { width: 5, height: 5, top: '8%', left: '18%', backgroundColor: colors.accent, opacity: 0.10 }]} />
      <View style={[styles.dot, { width: 3, height: 3, top: '14%', left: '45%', backgroundColor: colors.primary, opacity: 0.07 }]} />
      <View style={[styles.dot, { width: 6, height: 6, top: '22%', right: '22%', backgroundColor: colors.accent, opacity: 0.08 }]} />
      <View style={[styles.dot, { width: 4, height: 4, top: '50%', left: '16%', backgroundColor: colors.primary, opacity: 0.06 }]} />
      <View style={[styles.dot, { width: 5, height: 5, top: '60%', right: '18%', backgroundColor: colors.accent, opacity: 0.07 }]} />
      <View style={[styles.dot, { width: 3, height: 3, bottom: '22%', left: '25%', backgroundColor: colors.primary, opacity: 0.06 }]} />
      <View style={[styles.dot, { width: 7, height: 7, bottom: '10%', right: '30%', backgroundColor: colors.accent, opacity: 0.08 }]} />
      <View style={[styles.dot, { width: 4, height: 4, bottom: '30%', right: '12%', backgroundColor: colors.primary, opacity: 0.06 }]} />
    </View>
  );
};

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    background: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    bgImage: {
      ...StyleSheet.absoluteFillObject,
    },
    fill: {
      ...StyleSheet.absoluteFillObject,
    },
    el: {
      position: 'absolute',
    },
    phrase: {
      position: 'absolute',
      fontWeight: '200',
      fontSize: 15,
      letterSpacing: 2,
      opacity: 0.06,
    },
    dot: {
      position: 'absolute',
      borderRadius: 50,
    },
  });
