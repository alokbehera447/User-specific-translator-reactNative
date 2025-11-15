import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFetchBlob from 'rn-fetch-blob';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import api from '../services/api';
import Modal from 'react-native-modal';
import { getSavedAccents } from '../services/accentApi';

const audioRecorderPlayer = new AudioRecorderPlayer();

const LANGUAGES = [
  { label: 'English', code: 'eng_Latn' },
  { label: 'Hindi', code: 'hin_Deva' },
  { label: 'Spanish', code: 'spa_Latn' },
  { label: 'French', code: 'fra_Latn' },
  { label: 'German', code: 'deu_Latn' },
  { label: 'Japanese', code: 'jpn_Jpan' },
  { label: 'Korean', code: 'kor_Hang' },
  { label: 'Chinese', code: 'zho_Hans' },
  { label: 'Arabic', code: 'arb_Arab' },
  { label: 'Italian', code: 'ita_Latn' },
  { label: 'Portuguese', code: 'por_Latn' },
  { label: 'Russian', code: 'rus_Cyrl' },
];

const TranslatorScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [sourceLang, setSourceLang] = useState({ label: 'English', code: 'eng_Latn' });
  const [targetLang, setTargetLang] = useState({ label: 'Hindi', code: 'hin_Deva' });
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [translatedAudioUrl, setTranslatedAudioUrl] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selecting, setSelecting] = useState('source');

  // New states for accent selection
  const [accents, setAccents] = useState<any[]>([]);
  const [selectedAccent, setSelectedAccent] = useState<any>(null);
  const [accentModalVisible, setAccentModalVisible] = useState(false);

  // Load accents when component mounts
  useEffect(() => {
    loadAccents();
  }, []);

  const loadAccents = async () => {
    try {
      const savedAccents = await getSavedAccents();
      setAccents(Array.isArray(savedAccents) ? savedAccents : []);
    } catch (err) {
      console.error('Error loading accents:', err);
    }
  };

  const requestAudioPermissions = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const micGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      if (micGranted) return true;

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs microphone access to record your voice.',
          buttonPositive: 'Allow',
        }
      );

      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Microphone permission granted');
        return true;
      } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Permission Permanently Denied',
          'Please enable microphone access manually from app settings.'
        );
        return false;
      } else {
        Alert.alert('Permission Required', 'Please allow microphone access.');
        return false;
      }
    } catch (err) {
      console.error('⚠️ Permission error:', err);
      return false;
    }
  };

  const handleRecordPress = async () => {
    try {
      if (!isRecording) {
        const ok = await requestAudioPermissions();
        if (!ok) return;

        const path = Platform.select({
          ios: 'recording.m4a',
          android: `${RNFetchBlob.fs.dirs.CacheDir}/recording.m4a`,
        });

        console.log('🎙️ Starting recording at:', path);
        const uri = await audioRecorderPlayer.startRecorder(path);
        console.log('✅ Recorder started at:', uri);
        setIsRecording(true);
      } else {
        console.log('🛑 Stopping recorder...');
        const stoppedPath = await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
        setIsRecording(false);

        const finalPath =
          stoppedPath && stoppedPath !== 'recorder stopped.'
            ? stoppedPath
            : `${RNFetchBlob.fs.dirs.CacheDir}/recording.m4a`;

        console.log('🎙️ Recorded file path:', finalPath);
        const exists = await RNFetchBlob.fs.exists(finalPath);

        if (!exists) {
          console.log('❌ File does not exist:', finalPath);
          Alert.alert('Error', 'Recording file not found!');
          return;
        }

        const stat = await RNFetchBlob.fs.stat(finalPath);
        console.log(`✅ File exists (${stat.size} bytes)`);

        await uploadToBackend(finalPath);
      }
    } catch (error) {
      console.error('🎙️ Recording error:', error);
      Alert.alert('Error', 'Recording failed.');
      setIsRecording(false);
    }
  };

  const uploadToBackend = async (audioPath) => {
    try {
      setLoading(true);
      setTranslatedAudioUrl('');
      setVoiceLoading(false);

      const token = await AsyncStorage.getItem('access_token');
      const resUser = await api.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userEmail = resUser.data.email;

      const response = await RNFetchBlob.fetch(
        'POST',
        `${api.defaults.baseURL}/api/translate/`,
        {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        [
          { name: 'user_email', data: userEmail },
          { name: 'source_lang', data: sourceLang.code },
          { name: 'target_lang', data: targetLang.code },
          {
            name: 'file',
            filename: 'recording.m4a',
            type: 'audio/m4a',
            data: RNFetchBlob.wrap(audioPath),
          },
        ]
      );

      let result = null;
      try {
        if (typeof response.json === 'function') {
          result = await response.json();
        } else if (response.data) {
          result = JSON.parse(response.data);
        } else {
          console.error('Unexpected translate response shape:', response);
        }
      } catch (err) {
        console.error('Error parsing translate response:', err, response && response.data);
        throw err;
      }

      if (!result) {
        throw new Error('No response from translate API');
      }

      setTranscription(result.transcription || '');
      setTranslation(result.translation || '');
      setLoading(false);
      if (result.translation) {
        await autoGenerateVoice(result.translation, result.transcription || '');
      }
    } catch (err) {
      console.error('❌ Translation error:', err);
      Alert.alert('Error', 'Failed to translate voice.');
    }
  };

  const autoGenerateVoice = async (translatedText, transcriptionText) => {
    try {
      if (!translatedText) {
        console.warn('autoGenerateVoice: no translated text provided');
        return;
      }

      setVoiceLoading(true);
      setTranslatedAudioUrl('');

      const token = await AsyncStorage.getItem('access_token');
      const resUser = await api.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userEmail = resUser.data.email;

      // DEBUG: Log what we're sending
      console.log('🎭 SAVED ACCENT DEBUG:');
      console.log('Selected Accent:', selectedAccent);
      console.log('Use Saved Accent:', selectedAccent !== null);
      console.log('Saved Accent ID:', selectedAccent?.id);

      // Prepare form data with accent information
      const formData = [
        { name: 'user_email', data: userEmail },
        { name: 'translated_text', data: translatedText },
        { name: 'transcription', data: transcriptionText },
        { name: 'target_lang', data: targetLang.code },
        { name: 'use_saved_accent', data: (selectedAccent !== null).toString() },
      ];

      // Add saved accent ID if selected
      if (selectedAccent) {
        formData.push({ name: 'saved_accent_id', data: selectedAccent.id.toString() });
      }

      console.log('📦 Final Form Data:', formData);

      const response = await RNFetchBlob.config({
        timeout: 300000,
        trusty: true,
        appendExt: 'wav',
      }).fetch(
        'POST',
        `${api.defaults.baseURL}/api/cloneaudio/`,
        {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart-form-data; boundary=RNFetchBlobBoundary',
          Connection: 'close',
        },
        formData
      );

      const text = response && response.data ? response.data : '';
      console.log('📨 Backend Response:', text);

      let result = null;
      try {
        result = JSON.parse(text);
      } catch (err) {
        console.error('Failed to parse cloneaudio response:', err, text && text.slice(0, 300));
        throw err;
      }

      if (result && result.translated_audio) {
        const audioUrl = `${api.defaults.baseURL}/${result.translated_audio}`;
        setTranslatedAudioUrl(audioUrl);
        console.log('✅ Voice generated, audio URL set:', audioUrl);
      } else {
        console.error('Unexpected cloneaudio response:', result);
      }
    } catch (err) {
      console.error('❌ Voice generation error:', err);
    } finally {
      setVoiceLoading(false);
    }
  };

  const handlePlayback = () => {
    if (!translatedAudioUrl) {
      console.warn('No audio URL to play yet.');
      return;
    }
    const sound = new Sound(translatedAudioUrl, null, (error) => {
      if (error) {
        console.error('Error playing audio:', error);
        return;
      }
      sound.play(() => {
        sound.release();
      });
    });
  };

  const openLanguageSelector = (type) => {
    setSelecting(type);
    setModalVisible(true);
  };

  const selectLanguage = (lang) => {
    if (selecting === 'source') setSourceLang(lang);
    else setTargetLang(lang);
    setModalVisible(false);
  };

  return (
    <ScrollView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={{ color: '#0ea5e9', marginTop: 10 }}>Processing...</Text>
        </View>
      )}

      {/* Language Selection */}
      <View style={styles.languageContainer}>
        <View style={styles.languageCard}>
          <Text style={styles.languageLabel}>Source Language</Text>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => openLanguageSelector('source')}>
            <Text style={styles.languageText}>{sourceLang.label}</Text>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.swapContainer}>
          <TouchableOpacity
            style={styles.swapButton}
            onPress={() => {
              const temp = sourceLang;
              setSourceLang(targetLang);
              setTargetLang(temp);
            }}>
            <Text style={styles.swapIcon}>⇄</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.languageCard}>
          <Text style={styles.languageLabel}>Target Language</Text>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => openLanguageSelector('target')}>
            <Text style={styles.languageText}>{targetLang.label}</Text>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Accent Selection - Added before recording */}
      <View style={styles.accentContainer}>
        <Text style={styles.sectionTitle}>Voice Accent (Optional)</Text>
        <View style={styles.accentCard}>
          <TouchableOpacity
            style={styles.accentSelector}
            onPress={() => setAccentModalVisible(true)}
          >
            <Text style={[
              styles.accentSelectorText,
              !selectedAccent && styles.accentPlaceholder
            ]}>
              {selectedAccent ? selectedAccent.name : 'Select a saved accent...'}
            </Text>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>

          {selectedAccent && (
            <View style={styles.selectedAccentInfo}>
              <Text style={styles.selectedAccentName}>{selectedAccent.name}</Text>
              <Text style={styles.selectedAccentLanguage}>{selectedAccent.language}</Text>
              <TouchableOpacity
                style={styles.clearAccentButton}
                onPress={() => setSelectedAccent(null)}
              >
                <Text style={styles.clearAccentText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={styles.accentHint}>
          Choose a saved accent to use for the generated voice. If none selected, your input voice will be used.
        </Text>
      </View>

      {/* Recording */}
      <View style={styles.recordingContainer}>
        <Text style={styles.sectionTitle}>Record Audio</Text>
        <View style={styles.recordingCard}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={handleRecordPress}>
            <Text style={styles.recordButtonIcon}>
              {isRecording ? '⏸️' : '🎤'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.recordingText}>
            {isRecording ? 'Recording... Tap to stop' : 'Tap microphone to start recording'}
          </Text>
        </View>
      </View>

      {/* Results */}
      {transcription && (
        <View style={styles.resultContainer}>
          <Text style={styles.sectionTitle}>Transcription</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Original ({sourceLang.label})</Text>
            <Text style={styles.resultText}>{transcription}</Text>
          </View>
        </View>
      )}

      {translation && (
        <View style={[styles.resultContainer, { marginBottom: 80 }]}>
          <Text style={styles.sectionTitle}>Translation</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Translated ({targetLang.label})</Text>
            <Text style={styles.resultText}>{translation}</Text>

            <View>
              {voiceLoading ? (
                <View style={[styles.playButton, { backgroundColor: '#9ca3af', justifyContent: 'center' }]}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : translatedAudioUrl ? (
                <TouchableOpacity style={styles.playButton} onPress={handlePlayback}>
                  <Text style={styles.playText}>▶️ Play</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      )}

      {/* Language Modal */}
      <Modal isVisible={modalVisible} onBackdropPress={() => setModalVisible(false)}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Select Language</Text>
          <FlatList
            data={LANGUAGES}
            keyExtractor={item => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.langOption} onPress={() => selectLanguage(item)}>
                <Text style={styles.langText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Accent Selection Modal */}
      <Modal isVisible={accentModalVisible} onBackdropPress={() => setAccentModalVisible(false)}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Select Accent</Text>
          {accents.length === 0 ? (
            <View style={styles.noAccentsContainer}>
              <Text style={styles.noAccentsEmoji}>🎭</Text>
              <Text style={styles.noAccentsText}>No saved accents found</Text>
              <Text style={styles.noAccentsSubtext}>
                Visit the Accent Library to save your first accent
              </Text>
            </View>
          ) : (
            <FlatList
              data={accents}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.accentOptionItem,
                    selectedAccent?.id === item.id && styles.selectedAccentItem
                  ]}
                  onPress={() => {
                    setSelectedAccent(item);
                    setAccentModalVisible(false);
                  }}
                >
                  <View style={styles.accentOptionContent}>
                    <Text style={styles.accentName}>{item.name}</Text>
                    <Text style={styles.accentLanguage}>{item.language}</Text>
                  </View>
                  {selectedAccent?.id === item.id && (
                    <Text style={styles.selectedCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.accentList}
            />
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setAccentModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  languageContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  languageCard: { flex: 1 },
  languageLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  languageButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  languageText: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  arrow: { fontSize: 12, color: '#6b7280' },
  swapContainer: { marginTop: 16 },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapIcon: { fontSize: 20, color: '#fff' },

  // New accent styles
  accentContainer: {
    padding: 16,
    paddingTop: 0,
  },
  accentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
  },
  accentSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  accentSelectorText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  accentPlaceholder: {
    color: '#9ca3af',
  },
  selectedAccentInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  selectedAccentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
  },
  selectedAccentLanguage: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  clearAccentButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  clearAccentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  accentHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  recordingContainer: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  recordingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: { backgroundColor: '#ef4444' },
  recordButtonIcon: { fontSize: 40 },
  recordingText: { marginTop: 16, color: '#6b7280', textAlign: 'center' },
  resultContainer: { padding: 16 },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
  },
  resultLabel: { fontSize: 12, fontWeight: '600', color: '#0ea5e9' },
  resultText: { fontSize: 16, color: '#1f2937', lineHeight: 24 },
  playButton: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  playText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ea5e9',
    marginBottom: 12,
    textAlign: 'center',
  },
  langOption: {
    paddingVertical: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  langText: { fontSize: 16, color: '#1f2937', textAlign: 'center' },

  // Accent modal styles
  noAccentsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noAccentsEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noAccentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  noAccentsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  accentList: {
    maxHeight: 300,
  },
  accentOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectedAccentItem: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  accentOptionContent: {
    flex: 1,
  },
  accentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  accentLanguage: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  selectedCheck: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
});

export default TranslatorScreen;