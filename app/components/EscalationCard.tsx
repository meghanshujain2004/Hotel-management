import React from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { colors, ESCALATION_COLORS, spacing } from '../theme';
import { Lead } from '../api';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { AppBadge } from './AppBadge';
import { AppButton } from './AppButton';

const LEVEL_LABELS: Record<string, string> = {
  normal: 'Normal',
  day1_reminder: 'Day 1 Reminder',
  level1_manager: 'Level 1 — Manager',
  day3_reminder: 'Day 3 Reminder',
  level2_admin: 'Level 2 — CRITICAL',
};

interface Props {
  lead: Lead;
  onReassign?: () => void;
}

export const EscalationCard: React.FC<Props> = ({ lead, onReassign }) => {
  const escalationColor = ESCALATION_COLORS[lead.escalation_level] || colors.red;

  const handleCall = () => {
    Linking.openURL(`tel:${lead.phone}`).catch(() => Alert.alert('Error', 'Cannot open dialer'));
  };

  return (
    <AppCard accentColor={escalationColor} elevated style={styles.card}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.guestInfo}>
          <AppText variant="title" bold>
            {lead.guest_name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            +91 {lead.phone}
          </AppText>
        </View>
        <AppBadge
          label={LEVEL_LABELS[lead.escalation_level] || lead.escalation_level}
          color={escalationColor}
          size="sm"
        />
      </View>

      {/* Inquiry detail */}
      {lead.inquiry_details ? (
        <AppText variant="body" color={colors.textSecondary} numberOfLines={1} style={styles.inquiry}>
          💬 {lead.inquiry_details}
        </AppText>
      ) : null}

      {/* Overdue timer */}
      {lead.overdue_duration_display && (
        <View style={styles.overdueRow}>
          <AppText style={styles.overdueIcon}>⏰</AppText>
          <AppText variant="subtitle" bold color={colors.redLight}>
            {lead.overdue_duration_display}
          </AppText>
        </View>
      )}

      {/* Assigned personnel attribution */}
      <View style={styles.assignedRow}>
        {lead.assigned_to && (
          <AppText variant="caption" color={colors.textMuted}>
            👤 Support: <AppText variant="caption" bold color={colors.textSecondary}>{lead.assigned_to.username}</AppText>
          </AppText>
        )}
        {lead.assigned_manager && (
          <AppText variant="caption" color={colors.textMuted}>
            👔 Manager: <AppText variant="caption" bold color={colors.textSecondary}>{lead.assigned_manager.username}</AppText>
          </AppText>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <AppButton
          title="Direct Call"
          onPress={handleCall}
          variant="success"
          size="sm"
          fullWidth={false}
          style={styles.actionBtn}
        />
        <AppButton
          title="Reassign"
          onPress={onReassign}
          variant="secondary"
          size="sm"
          fullWidth={false}
          style={styles.actionBtn}
        />
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  guestInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  inquiry: {
    marginBottom: spacing.sm,
  },
  overdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.redSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  overdueIcon: {
    fontSize: 14,
  },
  assignedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});
