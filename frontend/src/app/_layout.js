import React from 'react';
import { Text, View } from 'react-native';

export default function RootLayout({ children }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Text style={{ padding: 20, textAlign: 'center', color: '#372410' }}>wiiw</Text>
      {children}
    </View>
  );
}