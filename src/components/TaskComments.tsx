import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Surface, Avatar } from 'react-native-paper';
import { colors } from '../theme/colors';
import { PartnerService } from '../services/PartnerService';
import { useAuth } from '../contexts/AuthContext';
import type { TaskComment } from '../types/partner';
import { format } from 'date-fns';

interface TaskCommentsProps {
  taskId: string;
}

export default function TaskComments({ taskId }: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      const data = await PartnerService.getTaskComments(taskId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!session?.user.id || !newComment.trim()) return;
    
    setLoading(true);
    try {
      await PartnerService.addComment(session.user.id, {
        task_id: taskId,
        content: newComment.trim()
      });
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Surface style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>Comments</Text>
      
      <View style={styles.commentsList}>
        {comments.map(comment => (
          <View key={comment.id} style={styles.commentItem}>
            <Avatar.Text 
              size={32} 
              label={comment.user?.full_name?.substring(0, 2) || '??'} 
            />
            <View style={styles.commentContent}>
              <View style={styles.commentHeader}>
                <Text style={styles.userName}>{comment.user?.full_name}</Text>
                <Text style={styles.timestamp}>
                  {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                </Text>
              </View>
              <Text style={styles.commentText}>{comment.content}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          multiline
          style={styles.input}
        />
        <Button
          mode="contained"
          onPress={handleAddComment}
          loading={loading}
          disabled={loading || !newComment.trim()}
          style={styles.button}
        >
          Send
        </Button>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  title: {
    marginBottom: 16,
    fontWeight: '600',
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  commentText: {
    fontSize: 14,
    color: colors.onSurface,
  },
  inputContainer: {
    marginTop: 16,
    gap: 8,
  },
  input: {
    backgroundColor: colors.surface,
  },
  button: {
    alignSelf: 'flex-end',
  },
}); 