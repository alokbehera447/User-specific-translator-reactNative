import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  PermissionsAndroid,
  Platform,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFetchBlob from 'rn-fetch-blob';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import api from '../services/api';
import Modal from 'react-native-modal';
import { getSavedAccents } from '../services/accentApi';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');
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

const getLanguageName = (code) => {
  const langMap = {
    'en': 'English', 'hi': 'Hindi', 'es': 'Spanish', 'fr': 'French',
    'de': 'German', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese',
    'ar': 'Arabic', 'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian',
    'hin_Deva': 'Hindi', 'eng_Latn': 'English', 'spa_Latn': 'Spanish'
  };
  return langMap[code] || code;
};

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
  const [accents, setAccents] = useState([]);
  const [selectedAccent, setSelectedAccent] = useState(null);
  const [accentModalVisible, setAccentModalVisible] = useState(false);

  // Animation values
  const pulseAnim = new Animated.Value(1);
  const waveAnim = new Animated.Value(0);
  const progressAnim = new Animated.Value(0);

  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 TranslatorScreen focused - refreshing accents');
      loadAccents();
    }, [])
  );

  useEffect(() => {
    if (isRecording) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      stopAnimations();
    }
  }, [isRecording]);

  useEffect(() => {
    if (translatedAudioUrl) {
      handlePlayback();
    }
  }, [translatedAudioUrl]);

  useEffect(() => {
    if (loading) {
      startProgressAnimation();
    } else {
      progressAnim.setValue(0);
    }
  }, [loading]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const startProgressAnimation = () => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    pulseAnim.setValue(1);
    waveAnim.setValue(0);
  };

  const loadAccents = async () => {
    try {
      const savedAccents = await getSavedAccents();
      console.log('📥 Loaded accents:', savedAccents?.length || 0);
      setAccents(Array.isArray(savedAccents) ? savedAccents : []);

      if (selectedAccent && !savedAccents.find(acc => acc.id === selectedAccent.id)) {
        console.log('🗑️ Selected accent was deleted, clearing selection');
        setSelectedAccent(null);
      }
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
      setLoading(false);
    }
  };

  const autoGenerateVoice = async (translatedText, transcriptionText) => {
    try {
      if (!translatedText) {
        console.warn('autoGenerateVoice: no translated text provided');
        return;
      }

      console.log('🔊 Starting voice generation...');
      console.log('📝 Text to synthesize:', translatedText);
      console.log('🎤 Original transcription:', transcriptionText);

      setVoiceLoading(true);
      setTranslatedAudioUrl('');

      const token = await AsyncStorage.getItem('access_token');
      const resUser = await api.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userEmail = resUser.data.email;

      const useSavedAccent = selectedAccent !== null;
      console.log('🎭 ACCENT SELECTION STATE:');
      console.log('   Selected Accent:', selectedAccent);
      console.log('   use_saved_accent:', useSavedAccent);
      console.log('   saved_accent_id:', selectedAccent?.id);

      const formData = [
        { name: 'user_email', data: userEmail },
        { name: 'translated_text', data: translatedText },
        { name: 'transcription', data: transcriptionText },
        { name: 'target_lang', data: targetLang.code },
        { name: 'use_saved_accent', data: useSavedAccent.toString() },
      ];

      if (useSavedAccent && selectedAccent) {
        formData.push({ name: 'saved_accent_id', data: selectedAccent.id.toString() });
      }

      console.log('📦 Final Form Data being sent:');
      console.log('   use_saved_accent:', useSavedAccent);
      console.log('   saved_accent_id:', selectedAccent?.id || 'none');
      console.log('🌐 Sending request to:', `${api.defaults.baseURL}/api/cloneaudio/`);

      const response = await RNFetchBlob.config({
        timeout: 300000,
        trusty: true,
      }).fetch(
        'POST',
        `${api.defaults.baseURL}/api/cloneaudio/`,
        {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        formData
      );

      console.log('📨 Backend Response Status:', response.respInfo.status);

      const text = response.data;
      console.log('📨 Backend Response Data:', text);

      let result = null;
      try {
        result = JSON.parse(text);
        console.log('✅ Parsed response:', result);
      } catch (err) {
        console.error('❌ Failed to parse cloneaudio response:', err);
        console.error('📄 Raw response text:', text && text.slice(0, 500));
        throw new Error('Invalid response from server');
      }

      if (result && result.translated_audio) {
        const audioUrl = `${api.defaults.baseURL}/${result.translated_audio}`;
        console.log('🎵 Generated audio URL:', audioUrl);
        console.log('🔊 Voice used:', result.voice_used || 'unknown');
        setTranslatedAudioUrl(audioUrl);
        console.log('✅ Voice generation completed successfully');
      } else {
        console.error('❌ Unexpected cloneaudio response structure:', result);
        Alert.alert('Error', 'Voice generation failed - invalid response');
      }
    } catch (err) {
      console.error('❌ Voice generation error:', err);
      Alert.alert(
        'Voice Generation Failed',
        err.message || 'Could not generate voice audio'
      );
    } finally {
      setVoiceLoading(false);
    }
  };

  const handlePlayback = async () => {
    if (!translatedAudioUrl) {
      console.warn('No audio URL to play yet.');
      return;
    }

    console.log('🎵 Attempting to play audio from:', translatedAudioUrl);

    try {
      const audioUrlWithCacheBust = `${translatedAudioUrl}?t=${Date.now()}`;
      console.log('🕒 Cache-busted URL:', audioUrlWithCacheBust);

      const sound = new Sound(audioUrlWithCacheBust, null, (error) => {
        if (error) {
          console.error('❌ Error loading audio with react-native-sound:', error);
          handlePlayWithAudioRecorder();
          return;
        }

        console.log('✅ Audio loaded successfully with react-native-sound');
        console.log('📊 Audio duration:', sound.getDuration(), 'seconds');

        sound.play((success) => {
          if (success) {
            console.log('✅ Audio playback finished successfully');
          } else {
            console.error('❌ Audio playback failed');
            handlePlayWithAudioRecorder();
          }
          sound.release();
        });
      });
    } catch (error) {
      console.error('❌ Playback error:', error);
    }
  };

  const handlePlayWithAudioRecorder = async () => {
    if (!translatedAudioUrl) return;

    try {
      console.log('🎵 Trying playback with audioRecorderPlayer...');

      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();

      const msg = await audioRecorderPlayer.startPlayer(translatedAudioUrl);
      console.log('✅ AudioRecorderPlayer started:', msg);

      audioRecorderPlayer.addPlayBackListener((e) => {
        console.log('📊 Playback progress:', e.currentPosition, '/', e.duration);

        if (e.currentPosition === e.duration) {
          console.log('✅ Playback completed with audioRecorderPlayer');
          audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
        }
      });

    } catch (error) {
      console.error('❌ AudioRecorderPlayer error:', error);
    }
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

  const renderWave = () => {
    const waves = [];
    for (let i = 0; i < 4; i++) {
      const scale = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.3 + i * 0.2],
      });

      waves.push(
        <Animated.View
          key={i}
          style={[
            styles.wave,
            {
              transform: [{ scale }],
              opacity: waveAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0.1],
              }),
            },
          ]}
        />
      );
    }
    return waves;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Compact Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Translator</Text>
      </View>

      {/* Main Content Area */}
          <ScrollView 
      style={styles.content}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
        {/* Language Selection */}
        <View style={styles.languageSection}>
          <View style={styles.languageRow}>
            <View style={styles.languageItem}>
              <Text style={styles.languageLabel}>FROM</Text>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => openLanguageSelector('source')}>
                <Text style={styles.languageText}>{sourceLang.label}</Text>
                <Icon name="chevron-down" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.swapButton}
              onPress={() => {
                const temp = sourceLang;
                setSourceLang(targetLang);
                setTargetLang(temp);
              }}>
              <Icon name="swap-horizontal" size={18} color="#fff" />
            </TouchableOpacity>

            <View style={styles.languageItem}>
              <Text style={styles.languageLabel}>TO</Text>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => openLanguageSelector('target')}>
                <Text style={styles.languageText}>{targetLang.label}</Text>
                <Icon name="chevron-down" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Compact Accent Selection */}
          <View style={styles.accentSection}>
            <Text style={styles.accentLabel}>VOICE STYLE</Text>
            <TouchableOpacity
              style={styles.accentButton}
              onPress={() => setAccentModalVisible(true)}
            >
              <Icon name="account-voice" size={14} color="#6366f1" />
              <Text style={styles.accentButtonText}>
                {selectedAccent ? selectedAccent.name : 'Default Voice'}
              </Text>
              <Icon name="chevron-down" size={14} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Processing Indicator */}
        {loading && (
          <View style={styles.processingContainer}>
            <View style={styles.processingContent}>
              <ActivityIndicator size={32} color="#6366f1" />
              <View style={styles.processingTextContainer}>
                <Text style={styles.processingText}>Processing Translation</Text>
                <Text style={styles.processingSubtext}>Analyzing your voice...</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>
          </View>
        )}

        {/* Voice Generating Indicator */}
        {voiceLoading && (
          <View style={styles.voiceGeneratingContainer}>
            <View style={styles.voiceGeneratingContent}>
              <ActivityIndicator size={20} color="#10b981" />
              <Text style={styles.voiceGeneratingText}>Generating Audio</Text>
            </View>
          </View>
        )}

        {/* Results Display */}
        <View style={styles.resultsSection}>
          {transcription ? (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Icon name="format-text" size={14} color="#6366f1" />
                <Text style={styles.resultTitle}>Transcription</Text>
                <Text style={styles.resultLanguage}>({sourceLang.label})</Text>
              </View>
              <Text style={styles.resultText}>{transcription}</Text>
            </View>
          ) : (
            <View style={styles.placeholderCard}>
              <Icon name="format-text" size={28} color="#d1d5db" />
              <Text style={styles.placeholderText}>Your speech will appear here</Text>
            </View>
          )}

          {translation ? (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.resultHeaderLeft}>
                  <Icon name="translate" size={14} color="#10b981" />
                  <Text style={styles.resultTitle}>Translation</Text>
                  <Text style={styles.resultLanguage}>({targetLang.label})</Text>
                </View>

                {/* Play Button - Only show if audio is available */}
                {translatedAudioUrl && (
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={handlePlayback}
                    disabled={voiceLoading}
                  >
                    {voiceLoading ? (
                      <ActivityIndicator size={16} color="#10b981" />
                    ) : (
                      <Icon name="play-circle-outline" size={22} color="#10b981" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.resultText}>{translation}</Text>
              
            </View>
          ) : (
            <View style={styles.placeholderCard}>
              <Icon name="translate" size={28} color="#d1d5db" />
              <Text style={styles.placeholderText}>Translation will appear here</Text>
            </View>
          )}
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Recording Section - Fixed with proper bottom margin */}
      <View style={styles.recordingSection}>
        <View style={styles.recordingContainer}>
          {isRecording && renderWave()}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
              ]}
              onPress={handleRecordPress}>
              <Icon
                name={isRecording ? "stop" : "microphone"}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
        <Text style={styles.recordingText}>
          {isRecording ? 'Recording... Tap to stop' : 'Tap to speak'}
        </Text>
      </View>

      {/* Language Modal */}
      <Modal isVisible={modalVisible} onBackdropPress={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Language</Text>
          <FlatList
            data={LANGUAGES}
            keyExtractor={item => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => selectLanguage(item)}
              >
                <Text style={styles.modalOptionText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Accent Selection Modal - UPDATED WITH DEFAULT OPTION */}
      <Modal isVisible={accentModalVisible} onBackdropPress={() => setAccentModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Voice Style</Text>
          <FlatList
            data={[
              { id: null, name: 'Default Voice', language: 'System Default' },
              ...accents
            ]}
            keyExtractor={item => item.id ? item.id.toString() : 'default'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.accentOption,
                  item.id === null && styles.accentOptionDefault,
                  selectedAccent?.id === item.id && styles.accentOptionSelected
                ]}
                onPress={() => {
                  setSelectedAccent(item.id === null ? null : item);
                  setAccentModalVisible(false);
                }}
              >
                <View style={styles.accentInfo}>
                  <Text style={styles.accentName}>{item.name}</Text>
                  <Text style={styles.accentLanguage}>{item.language}</Text>
                </View>
                {selectedAccent?.id === item.id && (
                  <Icon name="check" size={18} color="#10b981" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="account-voice" size={40} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No saved accents</Text>
                <Text style={styles.emptyStateSubtext}>
                  Visit the Accent Library to save voice styles
                </Text>
              </View>
            }
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setAccentModalVisible(false)}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    // padding: 16,
  },
    contentContainer: {
    padding: 16,
    paddingBottom: 120, // Add extra padding at bottom
  },
  languageSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    marginBottom: 16,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  languageItem: {
    flex: 1,
  },
  languageLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  languageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  swapButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  accentSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  accentLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  accentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  accentButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366f1',
  },
  processingContainer: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    marginBottom: 12,
  },
  processingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  processingTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  processingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  processingSubtext: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  voiceGeneratingContainer: {
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
    marginBottom: 12,
  },
  voiceGeneratingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceGeneratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
    marginLeft: 8,
  },
  resultsSection: {
    flex: 1,
    gap: 12,
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    // justifyContent: 'center', 
    gap: 6,
  },
  playButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#f0fdf4',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#d1fae5',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},

  resultHeaderLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
  flex: 1,
  marginRight: 10, // Add spacing between text and play button
},
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  resultLanguage: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  placeholderCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  placeholderText: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  recordingSection: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 90,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  recordingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordButtonActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  wave: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
  },
  recordingText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'center',
  },
  accentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  accentOptionDefault: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 3,
    borderLeftColor: '#94a3b8',
  },
  accentOptionSelected: {
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
  },
  accentInfo: {
    flex: 1,
  },
  accentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  accentLanguage: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  modalCloseButton: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});
export default TranslatorScreen;