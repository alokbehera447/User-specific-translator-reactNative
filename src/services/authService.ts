import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// =========================
// 🧩 Type Definitions
// =========================

export interface LoginData {
  username: string; // backend expects "username" (use email here)
  password: string;
}

export interface RegisterData {
  email: string;
  username?: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id?: number;
  email: string;
  username?: string;
  is_active: boolean;
}

// =========================
// 🔐 AuthService
// =========================
class AuthService {
  // --------------------------------
  // LOGIN (store token + email) ✅
  // --------------------------------
  async login({ username, password }: LoginData): Promise<AuthResponse> {
    const data = new URLSearchParams();
    data.append('username', username);
    data.append('password', password);

    const response = await api.post<AuthResponse>(
      '/api/token',
      data.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    if (response.data.access_token) {
      await AsyncStorage.setItem("access_token", response.data.access_token);

      // 🔥 FIX: Save email for accent system
      await AsyncStorage.setItem("user_email", username);
    }

    return response.data;
  }

  // --------------------------------
  // REGISTER
  // --------------------------------
  async register({ email, password }: RegisterData): Promise<User> {
    const response = await api.post<User>('/api/register', {
      email,
      password,
    });
    return response.data;
  }

  // --------------------------------
  // GET CURRENT USER
  // --------------------------------
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/users/me');
    return response.data;
  }

  // --------------------------------
  // TOKEN MANAGEMENT
  // --------------------------------
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem('access_token');
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user_email'); // ← clear this too
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export default new AuthService();
