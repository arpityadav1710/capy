// Small shared pieces: text in Capy's font, round icon buttons, pill buttons, a slide-up screen and a confirm dialog.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  Text as RNText,
  StyleSheet,
  type TextProps,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '../theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

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

export function RoundButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={8} style={({ pressed }) => [styles.round, pressed && { opacity: 0.7 }]}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.text} />
    </Pressable>
  );
}

export function Pill({
  label,
  onPress,
  icon,
  variant = 'dark',
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'dark' | 'light';
  style?: ViewStyle;
}) {
  const dark = variant === 'dark';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, dark ? styles.pillDark : styles.pillLight, pressed && { opacity: 0.85 }, style]}
    >
      {icon && <MaterialCommunityIcons name={icon} size={20} color={dark ? '#fff' : colors.text} />}
      <Text style={[styles.pillText, { color: dark ? '#fff' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/** A full-screen page that slides up over home. */
export function Screen({ children, onClose, background = colors.page }: { children: ReactNode; onClose: () => void; background?: string }) {
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(y, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  const close = () =>
    Animated.timing(y, { toValue: 1, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(onClose);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: background, paddingTop: insets.top, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, 900] }) }] },
      ]}
    >
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
        <Pressable style={styles.dialog}>
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
  pill: { height: 54, borderRadius: 27, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pillDark: { backgroundColor: colors.ink },
  pillLight: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  pillText: { fontSize: 16, fontWeight: '800' },
  screenTop: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 18, paddingTop: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(40,25,15,0.4)', justifyContent: 'center', padding: 28 },
  dialog: { backgroundColor: colors.cream, borderRadius: 24, padding: 22 },
  dialogTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginBottom: 6 },
  dialogBody: { fontSize: 15, color: colors.muted, marginBottom: 20, lineHeight: 21 },
});
