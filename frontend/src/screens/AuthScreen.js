import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions, Button } from 'react-native';
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
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Ingresa email y contraseña');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMessage(error.message);
          setShowError(true);
          throw error;
        }
        if (data.user) {
          navigation.replace('Main');
        }
      } else {
        if (!username) {
          Alert.alert('Error', 'Ingresa un nombre de usuario');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setErrorMessage(error.message);
          setShowError(true);
          throw error;
        }
        if (data.user) {
          try {
            const { error: profileError } = await supabase.from('profiles').upsert({
              id: data.user.id,
              username,
              updated_at: new Date().toISOString(),
            });
            if (profileError) {
              console.warn('Perfil no creado (aunque el usuario sí):', profileError.message);
              // Continuamos aunque el perfil falle - el usuario ya puede usar la app
            }
          } catch (upsertError) {
            console.error('Error creando perfil:', upsertError.message);
          }
          Alert.alert('Registro', 'Revisa tu correo para confirmar o inicia sesión');
          setIsLogin(true);
        }
      }
    } catch (err) {
      console.error('Error en auth:', err);
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
      {showError && (
        <Alert title="Error de Autenticación" message={errorMessage} />
      )}
      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</Text>
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