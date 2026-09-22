import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { colors, STATUS_COLORS, radius, spacing } from '../theme';
import { Lead } from '../api';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { AppBadge } from './AppBadge';

const SOURCE_ICONS: Record<string, string> = {
  instagram: '📸',
  whatsapp: '💬',
  facebook: '📘',
  website: '🌐',
  manual: '✏️',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  awaiting_followup: 'Awaiting F/U',
  completed_followup: 'Completed F/U',
  registered: 'Registered',
  not_interested: 'Not Interested',
  lost: 'Lost',
};

interface Props {
  lead: Lead;
  onPress?: () => void;
  onViewTimeline?: () => void;
  onReassign?: () => void;
  onDelete?: () => void;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return 'Not contacted yet';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
};

const formatDuration = (secs: number) => {
  if (!secs) return '0s';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

export const LeadCard: React.FC<Props> = ({ lead, onPress, onViewTimeline, onReassign, onDelete }) => {
  const statusColor = STATUS_COLORS[lead.status] || colors.textMuted;

  const assignedToName =
    typeof lead.assigned_to === 'object' && lead.assigned_to?.username
      ? lead.assigned_to.username
      : lead.assigned_to_name || 'Unassigned';

  const assignedManagerName =
    typeof lead.assigned_manager === 'object' && lead.assigned_manager?.username
      ? lead.assigned_manager.username
      : lead.assigned_manager_name || null;

  const handleMakeCall = () => {
    if (!lead.phone) return;
    Linking.openURL(`tel:${lead.phone}`).catch(() => {
      Alert.alert('Call Action', `Dialing +91 ${lead.phone}`);
    });
  };

  return (
    <AppCard onPress={onPress} elevated style={styles.card}>
      {/* Escalated Alert Top Bar */}
      {lead.is_escalated && (
        <View style={styles.escalatedBar}>
          <AppText style={styles.escalatedText}>🚨 SLA BREACH ESCALATED</AppText>
        </View>
      )}

      {/* Main Header row */}
      <View style={styles.headerRow}>
        <View style={styles.nameRow}>
          <View style={styles.sourceAvatar}>
            <AppText style={styles.sourceIcon}>{SOURCE_ICONS[lead.source] || '📋'}</AppText>
          </View>
          <View style={styles.guestDetails}>
            <AppText variant="title" bold numberOfLines={1} style={styles.guestName}>
              {lead.guest_name}
            </AppText>
            <TouchableOpacity onPress={handleMakeCall} activeOpacity={0.7}>
              <AppText variant="caption" color={colors.goldLight} style={styles.phoneText}>
                📞 +91 {lead.phone}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <AppBadge
          label={STATUS_LABELS[lead.status] || lead.status}
          color={statusColor}
          size="sm"
        />
      </View>

      {/* Inquiry detail preview */}
      {lead.inquiry_details ? (
        <View style={styles.inquiryBox}>
          <AppText variant="body" color={colors.textSecondary} numberOfLines={2} style={styles.inquiryText}>
            💬 "{lead.inquiry_details}"
          </AppText>
        </View>
      ) : null}

      {/* Assignment Info Row */}
      <View style={styles.assignmentRow}>
        <View style={styles.assignPill}>
          <AppText variant="caption" color={colors.textMuted}>
            Support:
          </AppText>
          <AppText
            variant="caption"
            bold
            color={assignedToName !== 'Unassigned' ? colors.purpleLight : colors.textMuted}
            style={styles.assignName}
          >
            {assignedToName}
          </AppText>
        </View>

        {assignedManagerName && (
          <View style={styles.assignPill}>
            <AppText variant="caption" color={colors.textMuted}>
              Manager:
            </AppText>
            <AppText variant="caption" bold color={colors.goldLight} style={styles.assignName}>
              {assignedManagerName}
            </AppText>
          </View>
        )}
      </View>

      {/* Meta details row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <AppText variant="caption" color={colors.textMuted}>
            🕒 {formatDate(lead.last_contacted_at)}
          </AppText>
        </View>
        <View style={styles.metaItem}>
          <AppText variant="caption" color={colors.textMuted}>
            ⏱ {formatDuration(lead.last_call_duration)}
          </AppText>
        </View>
      </View>

      {/* Action buttons footer */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.callQuickBtn} onPress={handleMakeCall} activeOpacity={0.75}>
          <AppText variant="caption" bold color={colors.greenLight}>
            📞 Call
          </AppText>
        </TouchableOpacity>

        {onReassign && (
          <TouchableOpacity style={styles.actionBtn} onPress={onReassign} activeOpacity={0.75}>
            <AppText variant="caption" bold color={colors.purpleLight}>
              ↪️ Reassign
            </AppText>
          </TouchableOpacity>
        )}

        {onViewTimeline && (
          <TouchableOpacity style={styles.actionBtn} onPress={onViewTimeline} activeOpacity={0.75}>
            <AppText variant="caption" bold color={colors.goldLight}>
              Timeline ➔
            </AppText>
          </TouchableOpacity>
        )}

        {onDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.75}>
            <AppText variant="caption" bold color={colors.redLight}>
              🗑️
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    backgroundColor: '#12121c',
    borderWidth: 1,
    borderColor: '#1f1f33',
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  escalatedBar: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.3)',
  },
  escalatedText: {
    color: colors.redLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm + 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  sourceAvatar: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: '#181826',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sourceIcon: {
    fontSize: 20,
  },
  guestDetails: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  phoneText: {
    marginTop: 2,
    fontSize: 13,
  },
  inquiryBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.purpleLight,
  },
  inquiryText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  assignPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  assignName: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm + 2,
  },
  callQuickBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.greenLight + '44',
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  deleteBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
});
