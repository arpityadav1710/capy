// Friends of Capy: every visitor you've met, and silhouettes of those still to come.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VISITOR_ART } from '../art';
import { colors } from '../theme';
import { VISITORS, type Visitor } from '../visitors';
import { Screen, Text } from './ui';
import { VisitorArt } from './VisitorArt';

type Props = { found: Set<string>; onClose: () => void };

export function FriendsAlbum({ found, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const met = VISITORS.filter((v) => found.has(v.id));
  const [picked, setPicked] = useState<Visitor | null>(met[met.length - 1] ?? null);

  return (
    <Screen onClose={onClose}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 30 }}>
        <Text style={styles.title} accessibilityRole="header">
          Friends of Capy
        </Text>
        <Text style={styles.sub}>
          {met.length} of {VISITORS.length} found · a new friend visits each night you tuck Capy in
        </Text>

        <View style={styles.featured} accessible accessibilityLabel={picked ? `${picked.name}. ${picked.story}` : 'No friends yet'}>
          {picked ? (
            <>
              <VisitorArt visitor={picked} size={72} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featuredName}>{picked.name}</Text>
                <Text style={styles.featuredStory}>{picked.story}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.featuredStory}>Tuck Capy in tonight to meet your first friend.</Text>
          )}
        </View>

        <View style={styles.grid}>
          {VISITORS.map((v) => {
            const isFound = found.has(v.id);
            return (
              <Pressable
                key={v.id}
                disabled={!isFound}
                onPress={() => setPicked(v)}
                style={[styles.tile, isFound ? styles.tileFound : styles.tileLocked, picked?.id === v.id && styles.tilePicked]}
                accessibilityRole="button"
                accessibilityLabel={isFound ? v.name : v.rareAt ? `Rare friend, visits on a ${v.rareAt}-day streak` : 'Not met yet'}
              >
                {isFound || VISITOR_ART[v.id] ? (
                  <VisitorArt visitor={v} size={48} silhouette={!isFound} />
                ) : (
                  <Text style={styles.hidden}>?</Text>
                )}
                <Text style={styles.tileLabel} numberOfLines={1}>
                  {isFound ? v.name.split(' ')[0] : v.rareAt ? `${v.rareAt} days` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.brown, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4, marginBottom: 18, paddingHorizontal: 20, lineHeight: 20 },
  featured: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.cream, borderRadius: 24, padding: 18, marginBottom: 18, minHeight: 92 },
  featuredName: { fontSize: 18, fontWeight: '800', color: colors.text },
  featuredStory: { fontSize: 15, color: colors.muted, marginTop: 2, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  tile: { width: '22.5%', aspectRatio: 0.85, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tileFound: { backgroundColor: colors.cream },
  tileLocked: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.line, borderStyle: 'dashed' },
  tilePicked: { borderWidth: 2, borderColor: colors.brown, borderStyle: 'solid' },
  hidden: { fontSize: 24, fontWeight: '800', color: colors.line },
  tileLabel: { fontSize: 12, fontWeight: '700', color: colors.muted },
});
