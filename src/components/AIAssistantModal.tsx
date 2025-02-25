import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TextInput, FlatList, Alert, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native';
import { Modal, Portal, Text, IconButton, Surface, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getAIResponse, getOpenAIKey } from '../services/AIAssistantService';
import { useDispatch, useSelector } from 'react-redux';
import { addTask, toggleTaskStatus, updateTask } from '../store/slices/taskSlice';
import type { RootState, AppDispatch } from '../store';
import type { Database } from '../types/database';
import { useNetInfo } from '@react-native-community/netinfo';
import { saveChatHistory, loadChatHistory, clearChatHistory } from '../services/ChatHistoryService';
import AITaskInsights from '../components/AITaskInsights';
import AnalyticsAIInsights from '../components/AnalyticsAIInsights';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIAssistantModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const { width, height } = Dimensions.get('window');

type TaskPriority = 'low' | 'medium' | 'high' | null;

export default function AIAssistantModal({ visible, onDismiss }: AIAssistantModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const categories = useSelector((state: RootState) => state.categories.categories);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your productivity assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const scrollViewRef = useRef<FlatList>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const netInfo = useNetInfo();
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  const suggestions = [
    "Create a new task for me",
    "Help me prioritize my tasks",
    "What tasks do I have due today?",
    "Give me productivity tips"
  ];

  useEffect(() => {
    const initialize = async () => {
      setInitializing(true);
      
      // Get API key
      const key = getOpenAIKey();
      setApiKey(key);
      
      // Load chat history if not already loaded
      if (!hasLoadedHistory) {
        const history = await loadChatHistory();
        if (history.length > 0) {
          setMessages(history.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
          setShowSuggestions(false);
        }
        setHasLoadedHistory(true);
      }
      
      setInitializing(false);
    };
    
    initialize();
  }, [hasLoadedHistory]);

  const formatMessagesForAPI = (messages: Message[]): ChatMessage[] => {
    return messages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    }));
  };

  const executeTaskAction = (action: string, taskTitle: string) => {
    try {
      if (action === 'create') {
        // Find category id based on name if provided in taskTitle
        // Format: "Buy milk (Shopping)"
        let categoryId = null;
        let title = taskTitle;
        
        const categoryMatch = taskTitle.match(/\(([^)]+)\)$/);
        if (categoryMatch && categoryMatch[1]) {
          const categoryName = categoryMatch[1].trim();
          const category = categories.find(c => 
            c.name.toLowerCase() === categoryName.toLowerCase()
          );
          if (category) {
            categoryId = category.id;
            title = taskTitle.replace(/\(([^)]+)\)$/, '').trim();
          }
        }
        
        dispatch(addTask({
          title: title,
          description: '',
          category: categoryId,
          priority: null,
          due_date: null,
          completed: false
        }));
        
        return `✅ Created new task: "${title}"`;
      } 
      
      else if (action === 'complete' || action === 'mark-complete') {
        // Find a task by title or close match
        const task = tasks.find(t => 
          t.title.toLowerCase().includes(taskTitle.toLowerCase())
        );
        
        if (task && !task.completed) {
          dispatch(toggleTaskStatus({
            taskId: task.id, 
            completed: true
          }));
          return `✅ Marked task "${task.title}" as complete`;
        } else if (task && task.completed) {
          return `Task "${task.title}" is already completed`;
        } else {
          return `Could not find a matching task to complete`;
        }
      }
      
      else if (action === 'schedule') {
        // Format: "Call mom||2023-07-25"
        const parts = taskTitle.split('||');
        if (parts.length !== 2) {
          return `Could not parse scheduling information`;
        }
        
        const title = parts[0].trim();
        const date = parts[1].trim();
        
        // Find a task by title or close match
        const task = tasks.find(t => 
          t.title.toLowerCase().includes(title.toLowerCase())
        );
        
        if (task) {
          // Update the task with a due date
          // Note: This assumes you have a method to update tasks in your taskSlice
          dispatch(updateTask({
            taskId: task.id,
            updates: {
              due_date: date
            }
          }));
          return `✅ Scheduled task "${task.title}" for ${date}`;
        } else {
          // Create a new task with a due date
          const categoryId = null; // Default, you could enhance to find category
          
          dispatch(addTask({
            title: title,
            description: '',
            category: categoryId,
            priority: null,
            due_date: date,
            completed: false
          }));
          
          return `✅ Created and scheduled new task: "${title}" for ${date}`;
        }
      }
      
      else if (action === 'priority') {
        const [title, priorityInput] = taskTitle.split('||').map(s => s.trim());
        const task = tasks.find(t => 
          t.title.toLowerCase().includes(title.toLowerCase())
        );
        
        // Validate priority input
        const priorityLower = priorityInput.toLowerCase();
        if (!['low', 'medium', 'high'].includes(priorityLower)) {
          return `Invalid priority level. Please use low, medium, or high.`;
        }
        
        const priority = priorityLower as TaskPriority;
        
        if (task) {
          dispatch(updateTask({
            taskId: task.id,
            updates: {
              priority
            }
          }));
          return `✅ Set priority of "${task.title}" to ${priority}`;
        }
        return `Could not find task "${title}"`;
      }
      
      else if (action === 'describe') {
        const [title, description] = taskTitle.split('||').map(s => s.trim());
        const task = tasks.find(t => 
          t.title.toLowerCase().includes(title.toLowerCase())
        );
        
        if (task) {
          dispatch(updateTask({
            taskId: task.id,
            updates: {
              description
            }
          }));
          return `✅ Updated description for "${task.title}"`;
        }
        return `Could not find task "${title}"`;
      }
      
      else if (action === 'categorize') {
        const [title, categoryName] = taskTitle.split('||').map(s => s.trim());
        const task = tasks.find(t => 
          t.title.toLowerCase().includes(title.toLowerCase())
        );
        const category = categories.find(c => 
          c.name.toLowerCase() === categoryName.toLowerCase()
        );
        
        if (task && category) {
          dispatch(updateTask({
            taskId: task.id,
            updates: {
              category: category.id
            }
          }));
          return `✅ Moved "${task.title}" to ${category.name} category`;
        }
        return `Could not find task "${title}" or category "${categoryName}"`;
      }
      
      // Add more actions as needed
      
      return null;
    } catch (error) {
      console.error('Error executing task action:', error);
      return `Failed to perform task action`;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Check if we have an API key
    if (!apiKey) {
      Alert.alert(
        "API Key Missing",
        "Please set your OpenAI API key in the environment variables.",
        [{ text: "OK" }]
      );
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Format messages for the API
      const chatMessages = formatMessagesForAPI([...messages, userMessage]);
      
      // Call the OpenAI API
      const response = await getAIResponse(chatMessages, apiKey);
      
      // Check for action commands in the response
      let finalResponse = response;
      
      // Format: "[[ACTION:create]]Create a new task: Buy groceries (Shopping)"
      const actionMatch = response.match(/\[\[ACTION:([a-z-]+)\]\](.*?)(\[\[|$)/s);
      if (actionMatch) {
        const action = actionMatch[1];
        const content = actionMatch[2].trim();
        
        const actionResult = executeTaskAction(action, content);
        if (actionResult) {
          finalResponse = response.replace(actionMatch[0], actionResult);
        }
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: finalResponse,
        isUser: false,
        timestamp: new Date(),
      };
      
      const newMessages = [...messages, aiResponse];
      setMessages(newMessages);
      
      // Save chat history after each message
      await saveChatHistory(newMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      })));
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      let errorMessage = "Sorry, I'm having trouble connecting to my brain. Please try again later.";
      
      if (!netInfo.isConnected) {
        errorMessage = "You appear to be offline. Please check your internet connection and try again.";
      } else if (error instanceof Error && error.message?.includes('API Error')) {
        errorMessage = `There was an issue with the AI service: ${error.message.replace('API Error: ', '')}`;
      }
      
      const aiError: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        isUser: false,
        timestamp: new Date(),
      };
      
      const newMessagesWithError = [...messages, aiError];
      setMessages(newMessagesWithError);
      
      // Save chat history after each message
      await saveChatHistory(newMessagesWithError.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
    setShowSuggestions(false);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <Surface 
      style={[
        styles.messageBubble,
        item.isUser ? styles.userMessage : styles.assistantMessage
      ]}
      elevation={1}
    >
      {!item.isUser && (
        <View style={styles.avatarContainer}>
          <Surface style={styles.avatarBackground} elevation={2}>
            <MaterialCommunityIcons name="robot" size={20} color={colors.primary} />
          </Surface>
        </View>
      )}
      <View style={styles.messageContent}>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Surface>
  );

  const debugApiKey = () => {
    if (!apiKey) {
      // Don't show the full key, but show a hint about what's available
      const envKeyAvailable = process.env.OPENAI_API_KEY ? 'Yes' : 'No';
      const expoKeyAvailable = process.env.EXPO_PUBLIC_OPENAI_ACCESS_KEY ? 'Yes' : 'No';
      
      Alert.alert(
        "API Key Missing",
        `Please check your environment configuration:
        
- process.env.OPENAI_API_KEY: ${envKeyAvailable}
- process.env.EXPO_PUBLIC_OPENAI_ACCESS_KEY: ${expoKeyAvailable}

Add your API key to .env or app.config.js`,
        [{ text: "OK" }]
      );
    } else {
      // Show masked key for debugging
      const maskedKey = apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
      Alert.alert(
        "API Key Found",
        `Using API key: ${maskedKey}`,
        [{ text: "OK" }]
      );
    }
  };

  const handleClearHistory = async () => {
    Alert.alert(
      "Clear Chat History",
      "Are you sure you want to clear all chat history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: async () => {
            await clearChatHistory();
            setMessages([{
              id: '1',
              text: "Hello! I'm your productivity assistant. How can I help you today?",
              isUser: false,
              timestamp: new Date(),
            }]);
          }
        }
      ]
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <StatusBar backgroundColor={colors.primary} />
        <View style={styles.fullScreenContainer}>
          <Surface style={styles.header} elevation={4}>
            <View style={styles.headerContent}>
              <IconButton
                icon="arrow-left"
                size={24}
                onPress={onDismiss}
                iconColor={colors.onSurface}
              />
              <Text style={styles.title}>AI Assistant</Text>
              <View style={styles.headerButtons}>
                <IconButton
                  icon="delete-outline"
                  size={24}
                  onPress={handleClearHistory}
                  iconColor={colors.onSurface}
                />
                <IconButton
                  icon="help-circle-outline"
                  size={24}
                  onPress={debugApiKey}
                  iconColor={colors.onSurface}
                />
              </View>
            </View>
          </Surface>

          {/* Chat Content */}
          <View style={styles.chatContainer}>
            {initializing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Initializing AI Assistant...</Text>
              </View>
            ) : (
              <>
                <FlatList
                  ref={scrollViewRef}
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.messagesList}
                  onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                  style={styles.messagesListContainer}
                />
                
                {/* Add the AITaskInsights component here if no suggestions are shown */}
                {!showSuggestions && messages.length > 1 && (
                  <View style={styles.insightsContainer}>
                    <AITaskInsights />
                  </View>
                )}
                
                {showSuggestions && messages.length === 1 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Try asking:</Text>
                    <View style={styles.suggestionsList}>
                      {suggestions.map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionButton}
                          onPress={() => handleSuggestionPress(suggestion)}
                        >
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Input Footer */}
          {!initializing && (
            <Surface style={styles.inputFooter} elevation={4}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask your assistant..."
                  multiline
                  maxLength={500}
                  placeholderTextColor={colors.onSurfaceVariant}
                />
                <Button
                  mode="contained"
                  onPress={handleSend}
                  disabled={isLoading || !inputText.trim()}
                  style={styles.sendButton}
                >
                  {isLoading ? (
                    <ActivityIndicator size={20} color={colors.surface} />
                  ) : (
                    <MaterialCommunityIcons name="send" size={20} color={colors.surface} />
                  )}
                </Button>
              </View>
            </Surface>
          )}
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 0,
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  fullScreenContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    width: '100%',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    paddingTop: Platform.OS === 'ios' ? 44 : 8, // Account for iOS status bar
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.onSurface,
    flex: 1,
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  messagesListContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    flexDirection: 'row',
    maxWidth: '85%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 16,
    elevation: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: `${colors.primary}15`,
    borderTopRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceVariant,
    borderTopLeftRadius: 4,
  },
  avatarContainer: {
    marginRight: 8,
    justifyContent: 'flex-start',
  },
  avatarBackground: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    color: colors.onSurface,
    flexWrap: 'wrap',
  },
  timestamp: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputFooter: {
    width: '100%',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingBottom: Platform.OS === 'ios' ? 24 : 0, // Account for iOS home indicator
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    color: colors.onSurface,
  },
  sendButton: {
    marginLeft: 12,
    borderRadius: 20,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.onSurfaceVariant,
  },
  suggestionsList: {
    flexDirection: 'column',
  },
  suggestionButton: {
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  suggestionText: {
    fontSize: 14,
    color: colors.onSurface,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightsContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
}); 