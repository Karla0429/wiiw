import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../config/theme';

export default function BackButton({ onPress }) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Volver"
    >
      <ArrowLeft color={COLORS.accent} size={20} />
      <Text style={styles.label}>Volver</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 44, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, marginBottom: 8 },
  label: { color: COLORS.accent, fontWeight: '600' },
});
