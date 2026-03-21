// AccentLibraryScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  TextInput,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';

import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import RNFetchBlob from 'rn-fetch-blob';
import Modal from 'react-native-modal';

import { getSavedAccents, deleteAccent, saveAccent } from '../services/accentApi';
import api from '../services/api';

const audioRecorderPlayer = new AudioRecorderPlayer();

/* Languages (Option B) */
const LANGUAGES = [
  { label: 'English', code: 'eng_Latn', emoji: '🇬🇧' },
  { label: 'Hindi', code: 'hin_Deva', emoji: '🇮🇳' },
  { label: 'Bengali', code: 'ben_Beng', emoji: '🇧🇩' },
  { label: 'Tamil', code: 'tam_Taml', emoji: '🇮🇳' },
  { label: 'Telugu', code: 'tel_Telu', emoji: '🇮🇳' },
  { label: 'Kannada', code: 'kan_Knda', emoji: '🇮🇳' },
  { label: 'Malayalam', code: 'mal_Mlym', emoji: '🇮🇳' },
  { label: 'Punjabi', code: 'pan_Guru', emoji: '🇮🇳' },
  { label: 'Urdu', code: 'urd_Arab', emoji: '🇵🇰' },
  { label: 'Marathi', code: 'mar_Deva', emoji: '🇮🇳' },
  { label: 'Gujarati', code: 'guj_Gujr', emoji: '🇮🇳' },
  { label: 'French', code: 'fra_Latn', emoji: '🇫🇷' },
  { label: 'Spanish', code: 'spa_Latn', emoji: '🇪🇸' },
  { label: 'German', code: 'deu_Latn', emoji: '🇩🇪' },
  { label: 'Portuguese', code: 'por_Latn', emoji: '🇵🇹' },
  { label: 'Italian', code: 'ita_Latn', emoji: '🇮🇹' },
  { label: 'Chinese (Simplified)', code: 'zho_Hans', emoji: '🇨🇳' },
  { label: 'Japanese', code: 'jpn_Jpan', emoji: '🇯🇵' },
  { label: 'Korean', code: 'kor_Hang', emoji: '🇰🇷' },
  { label: 'Arabic', code: 'arb_Arab', emoji: '🇸🇦' },
  { label: 'Russian', code: 'rus_Cyrl', emoji: '🇷🇺' },
  { label: 'Dutch', code: 'nld_Latn', emoji: '🇳🇱' },
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

const AccentLibraryScreen: React.FC = () => {
  const [accents, setAccents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);

  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const [recordedFile, setRecordedFile] = useState<string>('');
  const [accentName, setAccentName] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);

  const isMounted = useRef(true);

  /* Load accents on mount */
  useEffect(() => {
    isMounted.current = true;
    loadAccents();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadAccents = async () => {
    try {
      setLoading(true);
      const res = await getSavedAccents();
      if (isMounted.current) setAccents(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Load accents error', err);
      Alert.alert('Error', 'Could not load accents');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  /* Request microphone permission (Android) */
  const requestMic = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Microphone Permission',
        message: 'We need access to your microphone to record accents.',
        buttonPositive: 'Allow',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('requestMic error', err);
      return false;
    }
  };

  /* Start / Stop Recording */
  const handleRecord = async () => {
    if (!recording) {
      const ok = await requestMic();
      if (!ok) return Alert.alert('Permission Required');

      const path = `${RNFetchBlob.fs.dirs.CacheDir}/accent.wav`;
      console.log('🎤 Start Recording:', path);

      try {
        await audioRecorderPlayer.startRecorder(path);
        setRecordedFile(path); // store right away (Android needs this)
        setRecording(true);
      } catch (err) {
        console.error('startRecorder error', err);
        Alert.alert('Error', 'Cannot start recorder');
      }
    } else {
      try {
        await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
        console.log('🎤 Recording Stopped');
        console.log('🎤 Final File:', recordedFile);
        setRecording(false);

        if (recordedFile) setSaveModalVisible(true);
        else Alert.alert('Error', 'Recording failed');
      } catch (err) {
        console.error('stopRecorder error', err);
        Alert.alert('Error', 'Failed to stop recording');
      }
    }
  };

  /* Save Accent */
  const handleSaveAccent = async () => {
    if (!accentName.trim()) {
      return Alert.alert('Error', 'Enter an accent name');
    }

    try {
      setLoading(true);
      console.log('Uploading Accent:', { recordedFile, accentName, lang: selectedLang.code });

      const result = await saveAccent(recordedFile, accentName, selectedLang.code);
      console.log('SAVE RESULT:', result);

      setSaveModalVisible(false);
      setAccentName('');
      setRecordedFile('');

      await loadAccents();

      // Alert.alert('Success', 'Accent saved');
    } catch (err: any) {
      console.error('SAVE ACCENT ERROR:', err);
      Alert.alert('Error', err.message || 'Failed to save accent');
    } finally {
      setLoading(false);
    }
  };

  /* Play Accent Audio */
  const handlePlay = (accent: any) => {
    const audioUrl = `${api.defaults.baseURL}/${accent.file_path}`;
    const s = new Sound(audioUrl, null, (err) => {
      if (err) {
        console.error('Sound load error', err);
        return Alert.alert('Playback Error', 'Unable to load audio');
      }
      s.play(() => s.release());
    });
  };

  /* Delete Accent */
  const handleDelete = (id: number) => {
    Alert.alert('Delete?', 'This cannot be undone.', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await deleteAccent(id);
            await loadAccents();
          } catch (err) {
            console.error('deleteAccent error', err);
            Alert.alert('Error', 'Failed to delete accent');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  /* Render accent card */
  const renderAccentItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>
          {getLanguageName(item.language ?? item.language_code ?? 'Unknown')}
        </Text>
      </View>

      <TouchableOpacity style={styles.iconButton} onPress={() => handlePlay(item)}>
        <Text style={styles.iconText}>▶️</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.iconButton, { marginLeft: 8 }]} onPress={() => handleDelete(item.id)}>
        <Text style={styles.iconText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  /* HEADER + RECORD CONTROLS inside FlatList */
  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Voice Library</Text>
          <Text style={styles.subtitle}>Save and reuse voice samples</Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{accents.length}</Text>
          <Text style={styles.countLabel}>Voices</Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={[styles.recordBtn, recording ? styles.recordBtnActive : null]} onPress={handleRecord}>
          <Text style={styles.recordBtnIcon}>{recording ? '⏸' : '🎙️'}</Text>
          <Text style={styles.recordBtnText}>{recording ? 'Stop' : 'Record Voice'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tipsBtn} onPress={() => Alert.alert('Tips', 'Record clear voice (5–12s)')}>
          <Text style={styles.tipsText}>💡 Tips</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#0ea5e9" style={{ marginVertical: 10 }} />}

      <Text style={styles.sectionTitle}>Saved Voices</Text>

      {accents.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎭</Text>
          <Text style={styles.emptyTitle}>No accents yet</Text>
          <Text style={styles.emptyText}>Record your first voice sample</Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={accents}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderAccentItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 80 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {/* SAVE MODAL */}
      <Modal isVisible={saveModalVisible} onBackdropPress={() => setSaveModalVisible(false)} avoidKeyboard>
        <View style={styles.modalBox}>
          <Text style={styles.modalHeading}>Save Voice</Text>

          <TextInput placeholder="Voice name" value={accentName} onChangeText={setAccentName} style={styles.input} placeholderTextColor="#6b7280" />

          <TouchableOpacity style={styles.langPicker} onPress={() => setLangModalVisible(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.langEmoji}>{selectedLang.emoji}</Text>
              <Text style={styles.langLabel}>{selectedLang.label}</Text>
            </View>
            <Text style={styles.langChevron}>⌄</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAccent}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtnModal} onPress={() => setSaveModalVisible(false)}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LANGUAGE MODAL */}
      <Modal isVisible={langModalVisible} onBackdropPress={() => setLangModalVisible(false)}>
        <View style={styles.langModal}>
          <Text style={styles.modalHeadingSmall}>Choose Language</Text>

          <FlatList
            data={LANGUAGES}
            keyExtractor={(l) => l.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.langOptionRow}
                onPress={() => {
                  setSelectedLang(item);
                  setLangModalVisible(false);
                }}>
                <Text style={styles.langEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.langName}>{item.label}</Text>
                  <Text style={styles.langCode}>{item.code}</Text>
                </View>
                <Text style={styles.selectArrow}>›</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eef2f6' }} />}
            style={{ maxHeight: 420 }}
          />

          <TouchableOpacity style={[styles.cancelBtnModal, { alignSelf: 'center', marginTop: 8 }]} onPress={() => setLangModalVisible(false)}>
            <Text style={styles.cancelModalText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    padding: 16,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  countBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  countText: { fontSize: 18, fontWeight: '800', color: '#0ea5e9' },
  countLabel: { fontSize: 11, color: '#6b7280' },

  controlsRow: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordBtn: {
    flex: 1,
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 12,
    marginVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
  },
  recordBtnActive: { backgroundColor: '#ef4444' },
  recordBtnIcon: { fontSize: 20, marginRight: 8 },
  recordBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  tipsBtn: {
    marginLeft: 12,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    elevation: 2,
  },
  tipsText: { color: '#0ea5e9', fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginTop: 8, color: '#0f172a' },

  empty: { alignItems: 'center', padding: 24 },
  emptyEmoji: { fontSize: 46, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  emptyText: { fontSize: 13, color: '#6b7280', marginTop: 6, textAlign: 'center' },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  cardSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 4 },

  cardActions: { flexDirection: 'row', alignItems: 'center' },

  iconButton: {
    backgroundColor: '#f3f4f6',
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  iconText: { fontSize: 18 },

  infoCard: {
    margin: 16,
    backgroundColor: '#eef8ff',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: '#0c4a6e' },
  infoText: { fontSize: 13, color: '#075985', marginTop: 6 },

  /* Modal styles */
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  modalHeading: { fontSize: 18, fontWeight: '900', marginBottom: 12, color: '#0f172a' },
  input: {
    borderWidth: 1,
    borderColor: '#e6eef6',
    backgroundColor: '#fbfeff',
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  langPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eef2f6',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  langEmoji: { fontSize: 22, marginRight: 10 },
  langLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  langChevron: { fontSize: 20, color: '#6b7280' },

  saveBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '800' },

  cancelBtnModal: { paddingVertical: 12, paddingHorizontal: 12, marginLeft: 12 },
  cancelModalText: { color: '#374151', fontWeight: '700' },

  /* language modal */
  langModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  modalHeadingSmall: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  langOptionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
  langName: { fontSize: 16, fontWeight: '700' },
  langCode: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  selectArrow: { fontSize: 18, color: '#cbd5e1' },
});
export default AccentLibraryScreen;
