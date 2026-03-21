import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({ navigation }: any) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Start the animation immediately
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
        ]).start();

        // Check token and redirect
        const checkLoginStatus = async () => {
            const token = await AsyncStorage.getItem('access_token');

            setTimeout(() => {
                if (token) {
                    navigation.reset({
                        index: 0,
                        routes: [
                            { name: 'MainTabs', params: { screen: 'Translator' } },
                        ],
                    });
                } else {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }
            }, 1800); // match animation duration
        };

        checkLoginStatus();
    }, [fadeAnim, scaleAnim]);

    return (
        <LinearGradient colors={['#0ea5e9', '#38bdf8']} style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0ea5e9" />
            <Animated.View
                style={[
                    styles.logoContainer,
                    { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                ]}>
                <Text style={styles.logoIcon}>🌐</Text>
                <Text style={styles.appName}>Voice Translator</Text>
            </Animated.View>
        </LinearGradient>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoIcon: {
        fontSize: 60,
        color: '#fff',
        marginBottom: 10,
    },
    appName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1,
    },
});

export default SplashScreen;
