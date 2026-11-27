import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useAppTheme } from '../context/AppThemeContext';

export default function BackButton({ onPress }) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Volver"
    >
      <ArrowLeft color={colors.accent} size={20} />
      <Text style={[styles.label, { color: colors.accent }]}>Volver</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 44, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, marginBottom: 8 },
  label: { fontWeight: '600' },
});
