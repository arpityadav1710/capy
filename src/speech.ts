// Speech recognition, when the app includes it. Expo Go (the QR-code preview app) doesn't,
// so there `speech` is undefined and Capy falls back to typing.
import type * as SpeechRecognition from 'expo-speech-recognition';

let module: typeof SpeechRecognition | null = null;
try {
  module = require('expo-speech-recognition');
} catch {
  module = null;
}

export const speech = module?.ExpoSpeechRecognitionModule;

export const useSpeechEvent: typeof SpeechRecognition.useSpeechRecognitionEvent =
  module?.useSpeechRecognitionEvent ?? (() => {});
