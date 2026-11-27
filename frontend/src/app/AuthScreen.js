import React, { useState } from 'react';
import { ActivityIndicator, View, Text, TextInput, TouchableOpacity, StyleSheet, Image as RNImage, ScrollView } from 'react-native';
import { supabase } from '../config/supabase';
import { useAppStyles, useAppTheme } from '../context/AppThemeContext';

export default function AuthScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useAppStyles(createStyles);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMessage('Ingresa email y contraseña');
      setShowError(true);
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setShowError(false);
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
          setErrorMessage('Ingresa un nombre de usuario');
          setShowError(true);
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
            }
          } catch (upsertError) {
            console.error('Error creando perfil:', upsertError.message);
          }
          setErrorMessage('Revisa tu correo para confirmar o inicia sesión');
          setShowError(false);
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
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.screenContainer}>
        <View style={styles.topBackground}>
          <RNImage
            source={require('../../assets/icon.png')}
            style={styles.appLogo}
          />
        </View>
        <View style={styles.cardContainer}>
          <Text style={styles.title}>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</Text>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Nombre de usuario"
              placeholderTextColor={colors.muted}
              value={username}
              onChangeText={setUsername}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'Entrar' : 'Registrarse'}</Text>
            )}
          </TouchableOpacity>
          {errorMessage ? (
            <Text style={showError ? styles.errorText : styles.infoText}>
              {errorMessage}
            </Text>
          ) : null}
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tiene cuenta? Iniciar sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.authBackground,
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: colors.authBackground,
  },
  screenContainer: {
    flexGrow: 1,
    backgroundColor: colors.authBackground,
    width: '100%',
    minHeight: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  topBackground: {
    width: '100%',
    backgroundColor: colors.authBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  appLogo: {
    width: 80,
    height: 80,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderRadius: 28,
    padding: 32,
    paddingTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'left',
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.inputSurface,
    color: colors.text,
    borderRadius: 15,
    padding: 14,
    marginBottom: 16,
    borderWidth: 0,
    width: '100%',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 30,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  switchText: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  errorText: {
    color: '#B42318',
    textAlign: 'center',
    marginTop: 12,
  },
  infoText: {
    color: colors.text,
    textAlign: 'center',
    marginTop: 12,
  },
});