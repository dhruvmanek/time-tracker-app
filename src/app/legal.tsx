// Privacy policy / terms, shown inside the app. Opened as /legal?doc=privacy or /legal?doc=terms.

import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRIVACY, TERMS } from '@/constants/legal';
import { TERMS_URL } from '@/constants/links';
import { C, F, S } from '@/constants/theme';

export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const insets = useSafeAreaInsets();
  const content = doc === 'terms' ? TERMS : PRIVACY;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[styles.header, { paddingTop: S.md }]}>
        <Text style={styles.title}>{content.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close} accessibilityLabel="Close">
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + S.xl }]}>
        <Text style={styles.updated}>Last updated: {content.updated}</Text>
        {content.sections.map((s, i) => (
          <View key={i} style={{ gap: 6 }}>
            {s.heading ? <Text style={styles.heading}>{s.heading}</Text> : null}
            {s.body.map((p, j) => (
              <Text key={j} style={styles.body}>
                {p}
              </Text>
            ))}
          </View>
        ))}
        {doc === 'terms' && (
          <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}>
            Read Apple’s full Standard EULA
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.md + 4,
    paddingBottom: S.sm,
  },
  title: { fontFamily: F.display, fontSize: 26, color: C.ink },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontFamily: F.semibold, fontSize: 15, color: C.sub },
  content: { paddingHorizontal: S.md + 4, gap: S.md },
  updated: { fontFamily: F.medium, fontSize: 13, color: C.sub },
  heading: { fontFamily: F.semibold, fontSize: 16.5, color: C.ink },
  body: { fontFamily: F.regular, fontSize: 15, color: '#3D414A', lineHeight: 22 },
  link: { fontFamily: F.semibold, fontSize: 15, color: C.accent, marginTop: S.sm },
});
