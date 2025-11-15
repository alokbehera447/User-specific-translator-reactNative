import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFetchBlob from 'rn-fetch-blob';

// ----------------------------------------------------
// 🔄 GET SAVED ACCENTS
// ----------------------------------------------------
export const getSavedAccents = async () => {
  const email = await AsyncStorage.getItem('user_email');
  const token = await AsyncStorage.getItem('access_token');

  if (!email) {
    console.log("❌ No email found in storage");
    return [];
  }

  const res = await api.get(
    `/api/saved_accents/?user_email=${email}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return res.data;
};

// ----------------------------------------------------
// 🗑 DELETE ACCENT
// ----------------------------------------------------
export const deleteAccent = async (accentId: number) => {
  const email = await AsyncStorage.getItem('user_email');
  const token = await AsyncStorage.getItem('access_token');

  return api.delete(
    `/api/saved_accent/${accentId}?user_email=${email}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
};

// ----------------------------------------------------
// 🎤 SAVE ACCENT – FULLY FIXED
// ----------------------------------------------------
export const saveAccent = async (fileUri: string, accentName: string, lang: string) => {
  const email = await AsyncStorage.getItem('user_email');
  const token = await AsyncStorage.getItem('access_token');

  if (!email || !token) {
    console.log("❌ Authentication missing");
    throw new Error("User not logged in");
  }

  // ------------------------------
  // 1️⃣ VALIDATE FILE PATH SAFELY
  // ------------------------------
  if (!fileUri || fileUri.includes("recorder stopped") || fileUri === "undefined") {
    console.log("❌ INVALID FILE URI:", fileUri);
    throw new Error("Recording failed. Please record again.");
  }

  let stat;
  try {
    stat = await RNFetchBlob.fs.stat(fileUri);
  } catch (err) {
    console.log("❌ STAT ERROR:", err);
    throw new Error("Audio file not found. Try recording again.");
  }

  const actualPath = stat.path;

  console.log("📤 Uploading Accent:");
  console.log(" Email:", email);
  console.log(" Name:", accentName);
  console.log(" Lang:", lang);
  console.log(" FilePath:", actualPath);

  // ------------------------------
  // 2️⃣ BUILD MULTIPART BODY
  // ------------------------------
  const formData = [
    { name: 'user_email', data: email },
    { name: 'accent_name', data: accentName },
    { name: 'lang', data: lang },
    {
      name: 'file',
      filename: 'accent.wav',
      type: 'audio/wav',
      data: RNFetchBlob.wrap(actualPath),
    },
  ];

  // ------------------------------
  // 3️⃣ SEND REQUEST WITH TOKEN
  // ------------------------------
  let response;
  try {
    response = await RNFetchBlob.fetch(
      'POST',
      `${api.defaults.baseURL}/api/save_accent/`,
      {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`, // REQUIRED
      },
      formData
    );
  } catch (err) {
    console.log("❌ FETCH ERROR:", err);
    throw new Error("Upload failed. Check file or server.");
  }

  console.log("📥 Raw Server Response:", response.text());

  return response.json();
};
