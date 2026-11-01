// Painted art for Capy and the visitors (made in Gemini, backgrounds removed, shrunk for the app).
// Visitors without a picture yet fall back to their emoji.
import type { ImageSourcePropType } from 'react-native';

export type CapyPose = 'sitting' | 'sleepy' | 'happy' | 'thoughtful' | 'face' | 'onsen';

export const CAPY_ART: Record<CapyPose, ImageSourcePropType> = {
  sitting: require('../assets/art/capy-sitting.png'),
  sleepy: require('../assets/art/capy-sleepy.png'),
  happy: require('../assets/art/capy-happy.png'),
  thoughtful: require('../assets/art/capy-thoughtful.png'),
  face: require('../assets/art/capy-face.png'),
  onsen: require('../assets/art/capy-onsen.png'),
};

export const VISITOR_ART: Partial<Record<string, ImageSourcePropType>> = {
  bunny: require('../assets/art/visitors/bunny.png'),
  duckling: require('../assets/art/visitors/duckling.png'),
  frog: require('../assets/art/visitors/frog.png'),
  kitten: require('../assets/art/visitors/kitten.png'),
  sparrow: require('../assets/art/visitors/sparrow.png'),
  turtle: require('../assets/art/visitors/turtle.png'),
  dragon: require('../assets/art/visitors/dragon.png'),
  fox: require('../assets/art/visitors/fox.png'),
  panda: require('../assets/art/visitors/panda.png'),
  peacock: require('../assets/art/visitors/peacock.png'),
};
