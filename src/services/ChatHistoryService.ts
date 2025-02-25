import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_HISTORY_KEY = 'ai_assistant_chat_history';
const MAX_MESSAGES = 50; // Limit stored messages

interface StoredMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string; // Store as ISO string
}

export async function saveChatHistory(messages: StoredMessage[]) {
  try {
    // Keep only the last MAX_MESSAGES
    const messagesToStore = messages.slice(-MAX_MESSAGES);
    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messagesToStore));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}

export async function loadChatHistory(): Promise<StoredMessage[]> {
  try {
    const history = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    if (history) {
      return JSON.parse(history);
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
  return [];
}

export async function clearChatHistory() {
  try {
    await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
} 