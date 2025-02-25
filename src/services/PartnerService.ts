import { supabase } from '../config/supabase';
import type { 
  PartnerInvitation, 
  CreatePartnerInvitationParams,
  CreateTaskCommentParams,
  TaskComment 
} from '../types/partner';

export const PartnerService = {
  // Send a partner invitation
  async sendInvitation(userId: string, params: CreatePartnerInvitationParams) {
    const { data, error } = await supabase
      .from('partner_invitations')
      .insert({
        sender_id: userId,
        recipient_email: params.recipient_email,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all invitations for a user (both sent and received)
  async getInvitations(userId: string) {
    const { data, error } = await supabase
      .from('partner_invitations')
      .select(`
        *,
        sender:sender_id(id, email, full_name)
      `)
      .or(`sender_id.eq.${userId},recipient_email.eq.${supabase.auth.user()?.email}`);

    if (error) throw error;
    return data;
  },

  // Respond to an invitation
  async respondToInvitation(invitationId: string, status: 'accepted' | 'declined') {
    const { data, error } = await supabase
      .from('partner_invitations')
      .update({ status })
      .eq('id', invitationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Add a comment to a task
  async addComment(userId: string, params: CreateTaskCommentParams): Promise<TaskComment> {
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        user_id: userId,
        task_id: params.task_id,
        content: params.content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get comments for a task
  async getTaskComments(taskId: string) {
    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        user:user_id(id, email, full_name)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
}; 