import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { supabase } from '../config/supabase';
import { COLORS } from '../config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH < 768 ? false : SCREEN_WIDTH < 1400 ? true : false;

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Ingresa email y contraseña');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigation.replace('Main');
      } else {
        if (!username) {
          Alert.alert('Error', 'Ingresa un nombre de usuario');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          try {
            await supabase.from('profiles').upsert({ id: data.user.id, username, updated_at: new Date() });
          } catch (upsertError) {
            console.error('Error uploading profile, but auth succeeded:', upsertError.message);
          }
        }
        Alert.alert('Registro', 'Revisa tu correo para confirmar o inicia sesión');
        setIsLogin(true);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>wiiw</Text>
      <Text style={styles.subtitle}>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</Text>
      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Nombre de usuario"
          placeholderTextColor={COLORS.muted}
          value={username}
          onChangeText={setUsername}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.muted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={COLORS.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>{isLogin ? 'Entrar' : 'Registrarse'}</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tiene cuenta? Inicia sesión'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: IS_TABLET ? 32 : 24 },
  title: { fontSize: IS_TABLET ? 50 : 42, color: COLORS.text, textAlign: 'center', fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: IS_TABLET ? 24 : 18, color: COLORS.muted, textAlign: 'center', marginBottom: IS_TABLET ? 32 : 32 },
  input: { backgroundColor: COLORS.surface, color: COLORS.text, borderRadius: 8, padding: 12, marginBottom: 16 },
  button: { backgroundColor: COLORS.accent, padding: IS_TABLET ? 18 : 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: COLORS.white, fontWeight: 'bold' },
  switchText: { color: COLORS.accent, textAlign: 'center', marginTop: IS_TABLET ? 24 : 16 },
});