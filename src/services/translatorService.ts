import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFetchBlob from 'rn-fetch-blob';
import api from './api';

export interface TranslationResponse {
  transcription: string;
  translation: string;
  original_audio?: string;
  enhanced_audio?: string;
}

export interface CloneResponse {
  translated_audio: string;
  synthesis_status?: any;
  model_used?: string;
}

class TranslatorService {
  private async getToken() {
    return await AsyncStorage.getItem('access_token');
  }

  // 🎙️ Upload voice for transcription + translation
  async uploadAndTranslate(
    audioPath: string,
    userEmail: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<TranslationResponse> {
    const token = await this.getToken();

    const response = await RNFetchBlob.fetch(
      'POST',
      `${api.defaults.baseURL}/api/translate/`,
      {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      [
        { name: 'user_email', data: userEmail },
        { name: 'source_lang', data: sourceLang },
        { name: 'target_lang', data: targetLang },
        {
          name: 'file',
          filename: 'recording.wav',
          type: 'audio/wav',
          data: RNFetchBlob.wrap(audioPath),
        },
      ],
    );

    return response.json();
  }

  // 🔊 Generate cloned voice for translated text
  async generateClonedVoice(
    translatedText: string,
    transcription: string,
    userEmail: string,
    targetLang: string,
  ): Promise<CloneResponse> {
    const token = await this.getToken();

    const response = await RNFetchBlob.fetch(
      'POST',
      `${api.defaults.baseURL}/api/cloneaudio/`,
      {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      [
        { name: 'user_email', data: userEmail },
        { name: 'translated_text', data: translatedText },
        { name: 'transcription', data: transcription },
        { name: 'target_lang', data: targetLang },
      ],
    );

    return response.json();
  }
}

export default new TranslatorService();
