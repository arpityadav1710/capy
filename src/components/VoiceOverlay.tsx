// The full-screen "tell Capy" overlay: listen, show live words, summarise, then save or discard.
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { addExpense } from '../storage';
import { CATEGORIES, type Category, formatINR, parseExpense } from '../parser';
import { colors, curves } from '../theme';
import { CapyFace, type CapyMood } from './CapyFace';
import { PressableScale, Text } from './ui';

type Phase = 'listening' | 'thinking' | 'review' | 'saved' | 'problem';
type Draft = { amount: number; category: Category; note: string; spoken: string };

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);
const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
// How long a pause ends listening: longer while no amount has been heard yet, so
// "chai with Rohit... uh... two fifty" isn't cut off before the number.
const PAUSE_WITH_AMOUNT_MS = 1800;
const PAUSE_WITHOUT_AMOUNT_MS = 3500;
// Give up if nothing at all is said for this long.
const NOTHING_SAID_MS = 9000;
// Loudness (0-10) above which we treat the mic as hearing speech, even before words arrive.
const SPEAKING_VOLUME = 2;
const DOTS = 13;

// Helps the recogniser with words it might otherwise mishear.
const HINTS = ['rupees', 'Swiggy', 'Zomato', 'Rapido', 'Uber', 'Ola', 'Blinkit', 'Zepto', 'chai', 'samosa', 'auto', 'metro'];

type Props = { onClose: () => void; onSaved: () => void; onTypeInstead: () => void };

export function VoiceOverlay({ onClose, onSaved, onTypeInstead }: Props) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('listening');
  const [transcript, setTranscript] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [problem, setProblem] = useState({ title: '', body: '', settings: false, keepText: false });
  const [mood, setMood] = useState<CapyMood>('calm');

  const active = useRef(true);
  const latest = useRef('');
  // Finished segments of speech; the recogniser may restart its transcript after each one.
  const committed = useRef('');
  const lastSegment = useRef('');
  const finished = useRef(false);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const level = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const cardIn = useRef(new Animated.Value(0)).current;
  const dots = useRef([...Array(DOTS)].map(() => new Animated.Value(0))).current;

  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 420, easing: Easing.bezier(...curves.drawer), useNativeDriver: false }).start();
    startListening();
    return () => {
      active.current = false;
      timers.current.forEach(clearTimeout);
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  useEffect(() => {
    Animated.spring(cardIn, {
      toValue: phase === 'review' || phase === 'saved' || phase === 'problem' ? 1 : 0,
      speed: 16,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }, [phase]);

  async function startListening(keepText = false) {
    finished.current = false;
    const kept = keepText ? latest.current : '';
    latest.current = kept;
    committed.current = kept;
    lastSegment.current = '';
    setTranscript(kept);
    setDraft(null);
    setMood('calm');
    setPhase('listening');

    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!active.current) return;
    if (!perm.granted) {
      showProblem('Capy needs your microphone', 'Allow microphone and speech recognition for Capy in Settings.', true);
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: 'en-IN',
      interimResults: true,
      // Keep listening through pauses; Capy decides when you're done (see waitForPause).
      continuous: true,
      addsPunctuation: false,
      iosTaskHint: 'dictation',
      contextualStrings: HINTS,
      volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
    });
    waitForPause(NOTHING_SAID_MS);
  }

  /** (Re)starts the countdown that ends listening after a pause. */
  function waitForPause(ms?: number) {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    const text = latest.current;
    const wait = ms ?? (parseExpense(text).amount != null ? PAUSE_WITH_AMOUNT_MS : PAUSE_WITHOUT_AMOUNT_MS);
    silenceTimer.current = setTimeout(() => finish(latest.current), wait);
  }

  // iOS sends the whole sentence so far each time; other recognisers restart after each segment.
  const join = (done: string, now: string) => (!done ? now : !now || now.startsWith(done) ? now || done : `${done} ${now}`);

  function showProblem(title: string, body: string, settings = false, keepText = false) {
    setProblem({ title, body, settings, keepText });
    setMood('meh');
    setPhase('problem');
  }

  function finish(text: string) {
    if (finished.current) return;
    finished.current = true;
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    ExpoSpeechRecognitionModule.stop();
    setLevel(0);

    if (!text.trim()) {
      showProblem("Capy didn't hear anything", 'Try again and say something like "chai 40".');
      return;
    }
    setPhase('thinking');
    setMood('thinking');
    later(700, () => {
      const parsed = parseExpense(text);
      if (parsed.amount == null) {
        showProblem("Capy didn't catch an amount", `You said "${text}". Tap below and just say the amount, like "250".`, false, true);
        return;
      }
      setDraft({ amount: parsed.amount, category: parsed.category, note: parsed.note, spoken: text });
      setMood('calm');
      setPhase('review');
    });
  }

  function setLevel(v: number) {
    Animated.timing(level, { toValue: v, duration: 110, useNativeDriver: true }).start();
    dots.forEach((d, i) => {
      const wobble = v === 0 ? 0 : v * (0.35 + 0.65 * Math.abs(Math.sin(Date.now() / 140 + i * 0.9)));
      Animated.timing(d, { toValue: wobble, duration: 110, useNativeDriver: false }).start();
    });
  }

  useSpeechRecognitionEvent('result', (e) => {
    if (!active.current || finished.current) return;
    const segment = (e.results[0]?.transcript ?? '').trim();
    // If the recogniser quietly started a new segment after a pause, keep what came before.
    const prev = lastSegment.current;
    if (prev && segment.length < prev.length / 2 && !prev.startsWith(segment)) committed.current = join(committed.current, prev);
    lastSegment.current = e.isFinal ? '' : segment;
    const text = join(committed.current, segment);
    if (e.isFinal) committed.current = text;
    latest.current = text;
    setTranscript(text);
    // A final segment is only a pause, not the end: keep waiting for more.
    waitForPause();
  });

  useSpeechRecognitionEvent('volumechange', (e) => {
    if (!active.current || finished.current) return;
    setLevel(Math.max(0, Math.min(1, e.value / 8)));
    // Still talking (words can lag behind the voice), so don't end on a pause yet.
    if (e.value > SPEAKING_VOLUME && latest.current) waitForPause();
  });

  useSpeechRecognitionEvent('error', (e) => {
    if (!active.current || finished.current || e.error === 'aborted') return;
    if (e.error === 'no-speech') return finish(latest.current);
    finished.current = true;
    if (Platform.OS === 'web' && (e.error === 'network' || e.error === 'not-allowed' || e.error === 'service-not-allowed')) {
      // The browser preview can't reach a speech service or the microphone; the iPhone app uses Apple's recogniser.
      showProblem('Voice works on your iPhone', "This browser preview can't listen. Type the expense instead, or open Capy in Chrome.");
    } else if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      showProblem('Capy needs your microphone', 'Allow microphone and speech recognition for Capy in Settings.', true);
    } else if (e.error === 'network') {
      showProblem('No internet for listening', 'Speech recognition needs a connection right now. Try again in a moment.');
    } else {
      showProblem('Something went wrong', e.message || 'Try again.');
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (!active.current || finished.current) return;
    finish(latest.current);
  });

  function close(delay = 0, after?: () => void) {
    active.current = false;
    ExpoSpeechRecognitionModule.abort();
    later(delay, () => {
      Animated.timing(enter, { toValue: 0, duration: 240, easing: Easing.bezier(...curves.out), useNativeDriver: false }).start(() => {
        onClose();
        after?.();
      });
    });
  }

  function save() {
    if (!draft) return;
    addExpense(draft);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMood('happy');
    setPhase('saved');
    onSaved();
    close(1400);
  }

  function discard() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMood('meh');
    close(500);
  }

  function nextCategory() {
    if (!draft) return;
    Haptics.selectionAsync();
    const i = CATEGORIES.indexOf(draft.category);
    setDraft({ ...draft, category: CATEGORIES[(i + 1) % CATEGORIES.length] });
  }

  const glowY = enter.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_H * 0.8, 0] });
  const blur = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const showCard = phase === 'review' || phase === 'saved' || phase === 'problem';

  return (
    <View style={StyleSheet.absoluteFill}>
      <AnimatedBlur intensity={blur} tint="light" style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(45,28,18,0.28)', opacity: enter }]} />

      <Animated.View style={[styles.glow, { transform: [{ translateY: glowY }] }]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="fur" cx="50%" cy="72%" rx="60%" ry="62%" fx="50%" fy="72%">
              <Stop offset="0" stopColor={colors.furDeep} stopOpacity={1} />
              <Stop offset="0.38" stopColor={colors.fur} stopOpacity={1} />
              <Stop offset="0.66" stopColor="#eed4b6" stopOpacity={0.95} />
              <Stop offset="1" stopColor="#f3e2cc" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#fur)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.stage, { paddingBottom: insets.bottom + 28, opacity: enter }]}>
        <View style={{ marginBottom: 28 }}>
          <CapyFace mood={mood} level={level} width={Math.min(SCREEN_W * 0.8, 340)} />
        </View>

        {!showCard && (
          <>
            <View style={styles.transcript}>
              <Text style={styles.transcriptText}>
                {transcript || (phase === 'thinking' ? 'Thinking…' : 'Tell Capy what you spent')}
              </Text>
            </View>
            <View style={styles.wave}>
              {dots.map((d, i) => (
                <Animated.View
                  key={i}
                  style={[styles.dot, { height: d.interpolate({ inputRange: [0, 1], outputRange: [5, 28] }) }]}
                />
              ))}
            </View>
            {phase === 'listening' && !!transcript && (
              <PressableScale onPress={() => finish(latest.current)} style={styles.done} accessibilityRole="button" accessibilityHint="Stop listening and show the summary">
                <Text style={styles.doneText}>Done</Text>
              </PressableScale>
            )}
          </>
        )}

        {showCard && (
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardIn,
                transform: [{ translateY: cardIn.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
              },
            ]}
          >
            {phase === 'review' && draft && (
              <>
                <Text style={styles.cardLabel}>Capy heard</Text>
                <View style={styles.row}>
                  <Text style={styles.amount}>{formatINR(draft.amount)}</Text>
                  <Pressable onPress={nextCategory} style={styles.chip} hitSlop={8}>
                    <Text style={styles.chipText}>{draft.category} ▾</Text>
                  </Pressable>
                </View>
                <Text style={styles.note}>{draft.note || 'No note'}</Text>
                <View style={styles.buttons}>
                  <Pressable onPress={discard} style={[styles.btn, styles.btnGhost]}>
                    <Text style={styles.btnGhostText}>Discard</Text>
                  </Pressable>
                  <Pressable onPress={save} style={[styles.btn, styles.btnSolid]}>
                    <Text style={styles.btnSolidText}>Save</Text>
                  </Pressable>
                </View>
              </>
            )}

            {phase === 'saved' && draft && (
              <View style={styles.savedRow}>
                <View style={styles.check}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
                <View>
                  <Text style={styles.savedTitle}>Saved {formatINR(draft.amount)}</Text>
                  <Text style={styles.cardLabel}>Added to {draft.category}</Text>
                </View>
              </View>
            )}

            {phase === 'problem' && (
              <>
                <Text style={styles.problemTitle}>{problem.title}</Text>
                <Text style={styles.note}>{problem.body}</Text>
                <View style={styles.buttons}>
                  <Pressable onPress={() => close(0, onTypeInstead)} style={[styles.btn, styles.btnGhost]} accessibilityRole="button">
                    <Text style={styles.btnGhostText}>Type instead</Text>
                  </Pressable>
                  {problem.settings ? (
                    <Pressable onPress={() => Linking.openSettings()} style={[styles.btn, styles.btnSolid]}>
                      <Text style={styles.btnSolidText}>Open Settings</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => startListening(problem.keepText)} style={[styles.btn, styles.btnSolid]} accessibilityRole="button">
                      <Text style={styles.btnSolidText}>{problem.keepText ? 'Say the amount' : 'Try again'}</Text>
                    </Pressable>
                  )}
                </View>
              </>
            )}
          </Animated.View>
        )}
      </Animated.View>

      {phase !== 'saved' && (
        <Pressable
          onPress={() => close()}
          style={[styles.closeBtn, { top: insets.top + 8 }]}
          hitSlop={12}
          accessibilityLabel="Close"
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', left: '-25%', right: '-25%', bottom: 0, height: '80%' },
  stage: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 16 },
  transcript: {
    maxWidth: '85%',
    minHeight: 52,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,246,236,0.55)',
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 22,
    marginBottom: 16,
  },
  transcriptText: { fontSize: 22, lineHeight: 28, color: colors.text, textAlign: 'center', fontWeight: '500' },
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 26,
    borderRadius: 26,
    backgroundColor: 'rgba(255,246,236,0.45)',
  },
  done: { marginTop: 14, height: 44, paddingHorizontal: 28, borderRadius: 22, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  dot: { width: 6, borderRadius: 3, backgroundColor: '#7a4e36' },
  card: { alignSelf: 'stretch', backgroundColor: 'rgba(255,250,244,0.97)', borderRadius: 26, padding: 20 },
  cardLabel: { fontSize: 13, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 4 },
  amount: { fontSize: 40, fontWeight: '600', color: colors.text },
  chip: { backgroundColor: colors.chip, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontSize: 15, color: colors.chipText, fontWeight: '500' },
  note: { fontSize: 16, color: '#6b4f3f', marginBottom: 18, marginTop: 2 },
  buttons: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: '#c9b29d' },
  btnGhostText: { fontSize: 17, color: colors.text, fontWeight: '500' },
  btnSolid: { backgroundColor: colors.brown },
  btnSolidText: { fontSize: 17, color: '#fff', fontWeight: '600' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  check: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brown, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontSize: 22, fontWeight: '700' },
  savedTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  problemTitle: { fontSize: 19, fontWeight: '600', color: colors.text, marginBottom: 4 },
  closeBtn: {
    position: 'absolute',
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,246,236,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 16, color: colors.text },
});
