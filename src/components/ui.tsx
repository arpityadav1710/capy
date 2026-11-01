// Small shared pieces: text in Capy's font, press-to-scale buttons, a swipe-to-dismiss bottom sheet,
// a slide-up screen and a confirm dialog.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  type PressableProps,
  Text as RNText,
  StyleSheet,
  type StyleProp,
  type TextProps,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, curves, fonts } from '../theme';
import { useReducedMotion } from '../useReducedMotion';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const easeOut = Easing.bezier(...curves.out);
const drawer = Easing.bezier(...curves.drawer);

const FAMILY: Record<string, string> = {
  normal: fonts.regular,
  '400': fonts.regular,
  '500': fonts.semibold,
  '600': fonts.semibold,
  bold: fonts.bold,
  '700': fonts.bold,
  '800': fonts.heavy,
  '900': fonts.heavy,
};

/** Text in Nunito. Pick the weight with the usual `fontWeight` style. */
export function Text({ style, ...rest }: TextProps) {
  const weight = String(StyleSheet.flatten(style)?.fontWeight ?? '400');
  return <RNText {...rest} style={[{ color: colors.text }, style, { fontFamily: FAMILY[weight] ?? fonts.regular, fontWeight: 'normal' }]} />;
}

/** A Pressable that shrinks slightly while held, so every tap feels heard. */
export function PressableScale({
  style,
  children,
  scaleTo = 0.97,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & { style?: StyleProp<ViewStyle>; children?: ReactNode; scaleTo?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number, duration: number) => Animated.timing(scale, { toValue: v, duration, easing: easeOut, useNativeDriver: true }).start();
  // Sizing and placement stay on the touch target; looks go on the part that scales.
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(StyleSheet.flatten(style) ?? {})) {
    (LAYOUT_KEYS.has(k) ? outer : inner)[k] = v;
  }
  return (
    <Pressable {...rest} style={outer} onPressIn={(e) => (to(scaleTo, 120), rest.onPressIn?.(e))} onPressOut={(e) => (to(1, 200), rest.onPressOut?.(e))}>
      <Animated.View style={[inner, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

const LAYOUT_KEYS = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'zIndex',
]);

export function RoundButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} scaleTo={0.92} style={styles.round}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.text} />
    </PressableScale>
  );
}

export function Pill({
  label,
  onPress,
  icon,
  variant = 'dark',
  style,
  textColor,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'dark' | 'light';
  style?: ViewStyle;
  textColor?: string;
}) {
  const dark = variant === 'dark';
  const ink = textColor ?? (dark ? '#fff' : colors.text);
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" style={[styles.pill, dark ? styles.pillDark : styles.pillLight, style]}>
      {icon && <MaterialCommunityIcons name={icon} size={20} color={ink} />}
      <Text style={[styles.pillText, { color: ink }]} maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
    </PressableScale>
  );
}

/**
 * A bottom sheet: the backdrop fades, the sheet slides on an iOS drawer curve, and a downward
 * swipe or flick dismisses it. Children get `close(after)` to animate out before acting.
 */
export function BottomSheet({ children, onClose }: { children: (close: (after?: () => void) => void) => ReactNode; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const { height } = useWindowDimensions();
  const y = useRef(new Animated.Value(height)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  useEffect(() => {
    if (reduce) y.setValue(0);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 250, easing: easeOut, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: reduce ? 0 : 420, easing: drawer, useNativeDriver: true }),
    ]).start();
  }, []);

  const close = (after?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 200, easing: easeOut, useNativeDriver: true }),
      Animated.timing(y, { toValue: reduce ? 0 : height, duration: 240, easing: easeOut, useNativeDriver: true }),
    ]).start(() => {
      after?.();
      onClose();
    });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      // Dragging up meets friction instead of a hard stop.
      onPanResponderMove: (_, g) => y.setValue(g.dy > 0 ? g.dy : g.dy / 5),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 0.5) close();
        else Animated.spring(y, { toValue: 0, speed: 20, bounciness: 4, useNativeDriver: true }).start();
      },
    }),
  ).current;

  return (
    <Modal visible transparent animationType="none" onRequestClose={() => close()}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.dim, { opacity: fade }]}>
        <Pressable style={{ flex: 1 }} onPress={() => close()} accessibilityLabel="Close" />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap} pointerEvents="box-none">
        <Animated.View {...pan.panHandlers} style={[styles.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: y }] }]}>
          <View style={styles.grabber} />
          {children(close)}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** A full-screen page that slides up over home (fades instead when Reduce Motion is on). */
export function Screen({ children, onClose, background = colors.page }: { children: ReactNode; onClose: () => void; background?: string }) {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const { height } = useWindowDimensions();
  const t = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 0, duration: 420, easing: drawer, useNativeDriver: true }).start();
  }, []);
  const close = () => Animated.timing(t, { toValue: 1, duration: 240, easing: easeOut, useNativeDriver: true }).start(onClose);

  const motion = reduce
    ? { opacity: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }
    : { transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }] };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: background, paddingTop: insets.top }, motion]}>
      <View style={styles.screenTop}>
        <RoundButton icon="close" onPress={close} label="Close" />
      </View>
      {children}
    </Animated.View>
  );
}

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.dialog} accessibilityRole="alert">
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogBody}>{body}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pill label="Cancel" variant="light" onPress={onCancel} style={{ flex: 1 }} />
            <Pill label={confirmLabel} onPress={onConfirm} style={{ flex: 1, backgroundColor: '#B3473E' }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5c3a27',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  pill: { minHeight: 54, borderRadius: 27, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pillDark: { backgroundColor: colors.ink },
  pillLight: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  pillText: { fontSize: 17, fontWeight: '800' },
  dim: { backgroundColor: 'rgba(40,25,15,0.35)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: 12 },
  screenTop: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 18, paddingTop: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(40,25,15,0.4)', justifyContent: 'center', padding: 28 },
  dialog: { backgroundColor: colors.cream, borderRadius: 24, padding: 22 },
  dialogTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginBottom: 6 },
  dialogBody: { fontSize: 15, color: colors.muted, marginBottom: 20, lineHeight: 21 },
});
