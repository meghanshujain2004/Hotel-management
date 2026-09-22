// Mobile Scheduled Follow-up Reminder Helper
import { api, Lead } from '../api';

export interface DueFollowupSummary {
  dueCount: number;
  overdueCount: number;
  dueLeads: Lead[];
}

export const checkDueFollowups = async (): Promise<DueFollowupSummary> => {
  try {
    const data = await api.getDueFollowups();
    return {
      dueCount: data.due_count || 0,
      overdueCount: data.overdue_count || 0,
      dueLeads: data.due_leads || [],
    };
  } catch (err) {
    return {
      dueCount: 0,
      overdueCount: 0,
      dueLeads: [],
    };
  }
};
