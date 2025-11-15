import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AuthService from '../services/authService';

const SettingsScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [audioEnhancement, setAudioEnhancement] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [saveHistory, setSaveHistory] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // -----------------------------
  // Fetch Current User
  // -----------------------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.log('Error fetching user:', err);
        Alert.alert('Session Expired', 'Please login again.', [
          {
            text: 'OK',
            onPress: async () => {
              await AuthService.logout();
              navigation.replace('Login');
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // -----------------------------
  // Handle Logout
  // -----------------------------
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AuthService.logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });

        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>👤</Text>
        </View>
        <Text style={styles.profileName}>{user?.email?.split('@')[0] || 'User'}</Text>
        <Text style={styles.profileEmail}>{user?.email || 'unknown@example.com'}</Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => Alert.alert('Edit Profile', 'Feature coming soon!')}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Translation Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Translation Settings</Text>

        <SettingSwitch
          label="Audio Enhancement"
          description="Improve audio quality before processing"
          value={audioEnhancement}
          onValueChange={setAudioEnhancement}
        />

        <SettingSwitch
          label="Auto-Translate"
          description="Automatically translate after recording"
          value={autoTranslate}
          onValueChange={setAutoTranslate}
        />

        <SettingSwitch
          label="Save History"
          description="Keep translation history on device"
          value={saveHistory}
          onValueChange={setSaveHistory}
        />
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>

        <MenuItem
          icon="🌍"
          label="App Language"
          value="English"
          onPress={() => Alert.alert('Language', 'Select app language (coming soon)')}
        />

        <MenuItem
          icon="🎨"
          label="Theme"
          value="Light"
          onPress={() => Alert.alert('Theme', 'Select theme (coming soon)')}
        />

        <View style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔔</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#d1d5db', true: '#7dd3fc' }}
            thumbColor={notifications ? '#0ea5e9' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>

        <View style={styles.storageCard}>
          <View style={styles.storageInfo}>
            <Text style={styles.storageLabel}>Audio Files</Text>
            <Text style={styles.storageValue}>125 MB</Text>
          </View>
          <View style={styles.storageBar}>
            <View style={[styles.storageProgress, { width: '35%' }]} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={() =>
            Alert.alert(
              'Clear Cache',
              'Are you sure you want to clear all cached data?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () =>
                    Alert.alert('Cleared', 'Cache cleared successfully!'),
                },
              ],
            )
          }>
          <Text style={styles.dangerButtonText}>🗑️ Clear Cache</Text>
        </TouchableOpacity>
      </View>

      {/* Support & Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Info</Text>

        <MenuItem icon="❓" label="Help Center" onPress={() => Alert.alert('Help', 'Coming soon')} />
        <MenuItem icon="🔒" label="Privacy Policy" onPress={() => Alert.alert('Privacy Policy')} />
        <MenuItem icon="📄" label="Terms of Service" onPress={() => Alert.alert('Terms of Service')} />
        <MenuItem icon="ℹ️" label="About" onPress={() => Alert.alert('User Translator v1.0.0')} />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>🚪 Logout</Text>
      </TouchableOpacity>

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.versionText}>© 2024 User Translator</Text>
      </View>
    </ScrollView>
  );
};

// -----------------------------
// Reusable Setting Switch
// -----------------------------
const SettingSwitch = ({ label, description, value, onValueChange }: any) => (
  <View style={styles.settingItem}>
    <View style={styles.settingInfo}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#d1d5db', true: '#7dd3fc' }}
      thumbColor={value ? '#0ea5e9' : '#f3f4f6'}
    />
  </View>
);

// -----------------------------
// Reusable Menu Item
// -----------------------------
const MenuItem = ({ icon, label, value, onPress }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <View style={styles.menuInfo}>
      <Text style={styles.menuLabel}>{label}</Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
    </View>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  profileSection: {
    backgroundColor: '#0ea5e9',
    padding: 32,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuInfo: { flex: 1 },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  menuValue: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  menuArrow: { fontSize: 24, color: '#9ca3af' },
  storageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  storageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storageLabel: { fontSize: 14, color: '#6b7280' },
  storageValue: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  storageBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  storageProgress: { height: '100%', backgroundColor: '#0ea5e9' },
  dangerButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  versionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
});

export default SettingsScreen;
