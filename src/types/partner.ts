import type { Database } from './database';

export type PartnerInvitation = Database['public']['Tables']['partner_invitations']['Row'];
export type TaskPartner = Database['public']['Tables']['task_partners']['Row'];
export type TaskComment = Database['public']['Tables']['task_comments']['Row'];

export interface PartnerInvitationWithDetails extends PartnerInvitation {
  sender?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface CreatePartnerInvitationParams {
  recipient_email: string;
}

export interface CreateTaskCommentParams {
  task_id: string;
  content: string;
} 