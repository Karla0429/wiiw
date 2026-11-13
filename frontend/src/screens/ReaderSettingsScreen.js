import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { READER_THEMES } from '../config/theme';
import { useReaderPreferences } from '../context/ReaderPreferencesContext';

const FONTS = [
  { value: 'Georgia', label: 'Serif' },
  { value: 'Arial', label: 'Sans serif' },
  { value: 'Courier New', label: 'Monoespaciada' },
];
const FONT_SIZES = [16, 18, 20, 22, 24];

export default function ReaderSettingsScreen({ navigation }) {
  const { preferences, updatePreferences, loadError } = useReaderPreferences();
  const theme = READER_THEMES[preferences.theme] || READER_THEMES.paper;

  useEffect(() => {
    if (loadError) Alert.alert('Error', `No se pudieron cargar los ajustes de lectura: ${loadError.message}`);
  }, [loadError]);

  const update = async (value) => {
    try {
      await updatePreferences(value);
    } catch (error) {
      Alert.alert('Error', `No se pudieron guardar los ajustes: ${error.message}`);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ArrowLeft color={theme.accent} size={20} />
        <Text style={{ color: theme.accent, fontWeight: '600' }}>Volver</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]}>Ajustes de lectura</Text>
      <Text style={[styles.description, { color: theme.muted }]}>Personaliza la lectura. Los cambios se guardan automáticamente.</Text>

      <Text style={[styles.label, { color: theme.text }]}>Fuente</Text>
      <View style={styles.options}>
        {FONTS.map((font) => (
          <TouchableOpacity
            key={font.value}
            style={[styles.option, { backgroundColor: theme.surface, borderColor: theme.border }, preferences.fontFamily === font.value && { borderColor: theme.accent }]}
            onPress={() => update({ fontFamily: font.value })}
          >
            <Text style={[styles.optionText, { color: theme.text, fontFamily: font.value }]}>{font.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: theme.text }]}>Tamaño del texto</Text>
      <View style={styles.options}>
        {FONT_SIZES.map((fontSize) => (
          <TouchableOpacity
            key={fontSize}
            style={[styles.sizeOption, { backgroundColor: theme.surface, borderColor: theme.border }, preferences.fontSize === fontSize && { borderColor: theme.accent }]}
            onPress={() => update({ fontSize })}
          >
            <Text style={[styles.optionText, { color: theme.text, fontSize }]}>{fontSize}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: theme.text }]}>Tema</Text>
      <View style={styles.options}>
        {Object.entries(READER_THEMES).map(([key, option]) => (
          <TouchableOpacity
            key={key}
            style={[styles.themeOption, { backgroundColor: option.background, borderColor: preferences.theme === key ? option.accent : option.border }]}
            onPress={() => update({ theme: key })}
          >
            <Text style={{ color: option.text, fontWeight: '600' }}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.preview, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.previewTitle, { color: theme.text, fontFamily: preferences.fontFamily }]}>Una página para ti</Text>
        <Text style={{ color: theme.text, fontFamily: preferences.fontFamily, fontSize: preferences.fontSize, lineHeight: preferences.fontSize * 1.6 }}>
          Ajusta el texto y el contraste para disfrutar más cada historia.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  title: { fontSize: 24, fontWeight: 'bold' },
  description: { marginTop: 8, lineHeight: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 10 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderRadius: 8 },
  sizeOption: { width: 52, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 8 },
  optionText: { fontWeight: '600' },
  themeOption: { minWidth: 88, alignItems: 'center', padding: 12, borderWidth: 2, borderRadius: 8 },
  preview: { marginTop: 28, padding: 16, borderWidth: 1, borderRadius: 10 },
  previewTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
});
