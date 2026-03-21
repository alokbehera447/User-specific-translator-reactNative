import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AuthService from '../services/authService';

const LoginScreen = ({ navigation }: any) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
        }).start();
    }, [isLogin]);

    // -----------------------------
    // 🧩 Login Handler
    // -----------------------------
    const handleLogin = async () => {
        try {
            setLoading(true);
            const response = await AuthService.login({
                username: email,
                password,
            });
            if (response.access_token) {
                // Alert.alert('Success', 'Login successful!');
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Splash' }],
                });

            }
        } catch (err: any) {
            Alert.alert('Login Failed', err.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // 🧩 Register Handler
    // -----------------------------
    const handleRegister = async () => {
        if (password !== confirmPassword) {
            return Alert.alert('Error', 'Passwords do not match!');
        }

        try {
            setLoading(true);
            await AuthService.register({ email, username: email, password });
            Alert.alert('Success', 'Account created! Please log in.');
            setIsLogin(true);
        } catch (err: any) {
            Alert.alert('Registration Failed', err.response?.data?.detail || 'Error creating account');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        if (!email || !password) {
            return Alert.alert('Error', 'Please fill all fields');
        }
        isLogin ? handleLogin() : handleRegister();
    };

    return (
        <LinearGradient colors={['#4C6EF5', '#6B4CF5', '#8E44F5']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" />
                <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                    <Text style={styles.appTitle}>Assertive US Auth</Text>
                    <Text style={styles.subtitle}>
                        {isLogin ? 'Welcome Back 👋' : 'Create Your Account 🚀'}
                    </Text>

                    <View style={styles.card}>
                        <Input
                            placeholder="Email"
                            icon="📧"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <Input
                            placeholder="Password"
                            icon="🔒"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                        {!isLogin && (
                            <Input
                                placeholder="Confirm Password"
                                icon="✅"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                        )}

                        <TouchableOpacity
                            style={[styles.button, loading && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.switchRow}>
                            <Text style={styles.switchText}>
                                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                                <Text style={styles.switchLink}>
                                    {isLogin ? ' Sign Up' : ' Login'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </SafeAreaView>
        </LinearGradient>
    );
};

// -----------------------------
// Input Component
// -----------------------------
const Input = ({
    placeholder,
    icon,
    secureTextEntry,
    value,
    onChangeText,
    keyboardType,
}: any) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#9A9A9A"
            secureTextEntry={secureTextEntry}
            value={value}
            keyboardType={keyboardType}
            onChangeText={onChangeText}
        />
    </View>
);

// -----------------------------
// Styles
// -----------------------------
const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'center',
    },
    container: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    appTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: 'white',
        marginBottom: 10,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 18,
        color: '#E0E0E0',
        marginBottom: 25,
    },
    card: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 30,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F8FA',
        borderRadius: 12,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    inputIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 10,
    },
    button: {
        backgroundColor: '#4C6EF5',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    switchText: {
        color: '#555',
    },
    switchLink: {
        color: '#4C6EF5',
        fontWeight: '700',
    },
});

export default LoginScreen;
