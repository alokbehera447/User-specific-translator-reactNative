import React, {createContext, useContext, useReducer, ReactNode} from 'react';

// Define types
export interface AppState {
  isRecording: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  recentTranslations: any[];
  voiceProfiles: any[];
  settings: {
    audioEnhancement: boolean;
    autoTranslate: boolean;
    saveHistory: boolean;
    notifications: boolean;
  };
}

export type AppAction =
  | {type: 'SET_RECORDING'; payload: boolean}
  | {type: 'SET_SOURCE_LANGUAGE'; payload: string}
  | {type: 'SET_TARGET_LANGUAGE'; payload: string}
  | {type: 'ADD_RECENT_TRANSLATION'; payload: any}
  | {type: 'ADD_VOICE_PROFILE'; payload: any}
  | {type: 'REMOVE_VOICE_PROFILE'; payload: string}
  | {type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']>};

// Initial state
const initialState: AppState = {
  isRecording: false,
  sourceLanguage: 'English',
  targetLanguage: 'Spanish',
  recentTranslations: [],
  voiceProfiles: [
    {
      id: '1',
      name: 'Professional Voice',
      language: 'English',
      duration: '5s',
      date: '2024-01-15',
    },
    {
      id: '2',
      name: 'Spanish Accent',
      language: 'Spanish',
      duration: '8s',
      date: '2024-01-14',
    },
  ],
  settings: {
    audioEnhancement: true,
    autoTranslate: false,
    saveHistory: true,
    notifications: true,
  },
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_RECORDING':
      return {...state, isRecording: action.payload};
    case 'SET_SOURCE_LANGUAGE':
      return {...state, sourceLanguage: action.payload};
    case 'SET_TARGET_LANGUAGE':
      return {...state, targetLanguage: action.payload};
    case 'ADD_RECENT_TRANSLATION':
      return {
        ...state,
        recentTranslations: [action.payload, ...state.recentTranslations].slice(0, 50), // Keep last 50
      };
    case 'ADD_VOICE_PROFILE':
      return {
        ...state,
        voiceProfiles: [...state.voiceProfiles, action.payload],
      };
    case 'REMOVE_VOICE_PROFILE':
      return {
        ...state,
        voiceProfiles: state.voiceProfiles.filter(profile => profile.id !== action.payload),
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {...state.settings, ...action.payload},
      };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({children}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{state, dispatch}}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;