// A visitor's picture, or its emoji until the painted art exists. `silhouette` shows the shape only.
import { Image, View } from 'react-native';

import { VISITOR_ART } from '../art';
import { colors } from '../theme';
import type { Visitor } from '../visitors';
import { Text } from './ui';

type Props = { visitor: Visitor; size: number; silhouette?: boolean };

export function VisitorArt({ visitor, size, silhouette }: Props) {
  const art = VISITOR_ART[visitor.id];
  if (art) {
    return (
      <Image
        source={art}
        style={[{ width: size, height: size }, silhouette && { tintColor: colors.line }]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Text style={{ fontSize: size * 0.72, lineHeight: size * 0.9, opacity: silhouette ? 0 : 1 }} maxFontSizeMultiplier={1}>
        {visitor.emoji}
      </Text>
    </View>
  );
}
