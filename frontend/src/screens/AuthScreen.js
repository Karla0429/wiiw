import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../config/supabase';

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
    <View style={styles.screenContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.appTitle}>wiiw</Text>
      </View>
      <View style={styles.cardContainer}>
        <Text style={styles.title}>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</Text>
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Nombre de usuario"
            placeholderTextColor="#A8927C"
            value={username}
            onChangeText={setUsername}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#A8927C"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#A8927C"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{isLogin ? 'Entrar' : 'Registrarse'}</Text>}
        </TouchableOpacity>
        {errorMessage ? (
          <Text style={showError ? styles.errorText : styles.infoText}>
            {errorMessage}
          </Text>
        ) : null}
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tiene cuenta? Inicia sesión'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    paddingTop: 40,
    paddingBottom: 30,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#372410',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardContainer: {
    backgroundColor: '#E8D8C8',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#372410',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#292521',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A8927C',
    width: '100%',
  },
  button: {
    backgroundColor: '#54391C',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  switchText: {
    color: '#A8927C',
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
    color: '#372410',
    textAlign: 'center',
    marginTop: 12,
  },
});