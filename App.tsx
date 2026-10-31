import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from './src/components/HomeScreen';
import { VoiceOverlay } from './src/components/VoiceOverlay';
import { listExpenses } from './src/db';

// Opening capy://listen (from a Shortcut, Back Tap or Siri) jumps straight to the voice overlay.
const wantsListen = (url: string | null) => !!url && Linking.parse(url).hostname === 'listen';

export default function App() {
  const [expenses, setExpenses] = useState(listExpenses);
  const [listening, setListening] = useState(false);

  const refresh = useCallback(() => setExpenses(listExpenses()), []);

  useEffect(() => {
    Linking.getInitialURL().then((url) => wantsListen(url) && setListening(true));
    const sub = Linking.addEventListener('url', ({ url }) => wantsListen(url) && setListening(true));
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <HomeScreen expenses={expenses} onTalk={() => setListening(true)} onChanged={refresh} />
      {listening && <VoiceOverlay onClose={() => setListening(false)} onSaved={refresh} />}
    </SafeAreaProvider>
  );
}
