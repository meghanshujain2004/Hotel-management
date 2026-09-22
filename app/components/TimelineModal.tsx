import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { api, ActivityLog } from '../api';
import { AppText } from './AppText';
import { AppBadge } from './AppBadge';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';

interface Props {
  visible: boolean;
  leadId: number;
  guestName: string;
  onClose: () => void;
}

const ACTIVITY_ICONS: Record<string, string> = {
  call: '📞',
  disposition: '📝',
  whatsapp_dispatched: '💬',
  reassigned: '↪️',
  escalated: '🚨',
  note: '📌',
  created: '✨',
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
};

export const TimelineModal: React.FC<Props> = ({ visible, leadId, guestName, onClose }) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [leadMeta, setLeadMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && leadId) {
      setLoading(true);
      api
        .getLeadTimeline(leadId)
        .then((data) => {
          setActivities(data.activities || []);
          setLeadMeta({
            followup_date_time: data.followup_date_time,
            last_contacted_at: data.last_contacted_at,
            is_escalated: data.is_escalated,
            escalation_level: data.escalation_level,
            status: data.status,
          });
        })
        .catch(() => {
          setActivities([]);
          setLeadMeta(null);
        })
        .finally(() => setLoading(false));
    }
  }, [visible, leadId]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppText variant="h2">Activity Timeline</AppText>
            <AppText variant="subtitle" color={colors.purpleLight}>
              {guestName}
            </AppText>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <AppText variant="subtitle" color={colors.textSecondary}>
              ✕
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Lead Overview Summary Header */}
        {leadMeta && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <AppText variant="caption" color={colors.textSecondary}>
                📅 Follow-Up:{' '}
                <AppText variant="caption" bold color={leadMeta.followup_date_time ? colors.purpleLight : colors.textMuted}>
                  {leadMeta.followup_date_time ? formatDate(leadMeta.followup_date_time) : 'None'}
                </AppText>
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                📞 Last Contact:{' '}
                <AppText variant="caption" bold color={colors.textPrimary}>
                  {leadMeta.last_contacted_at ? formatDate(leadMeta.last_contacted_at) : 'None'}
                </AppText>
              </AppText>
            </View>
            <View style={styles.summaryBadgeRow}>
              {leadMeta.is_escalated ? (
                <AppBadge label={`🚨 Escalated (${leadMeta.escalation_level})`} color={colors.red} size="sm" />
              ) : (
                <AppBadge label="✅ Normal SLA" color={colors.green} size="sm" />
              )}
            </View>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <LoadingState message="Loading timeline..." />
        ) : activities.length === 0 ? (
          <EmptyState icon="📋" title="No Activity Recorded" description="No logged activities for this guest yet." />
        ) : (
          <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
            {activities.map((a, idx) => (
              <View key={a.id} style={styles.timelineItem}>
                <View style={styles.timelineLine}>
                  <View style={styles.dot} />
                  {idx < activities.length - 1 && <View style={styles.line} />}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <AppText style={styles.activityIcon}>
                      {ACTIVITY_ICONS[a.activity_type] || '📋'}
                    </AppText>
                    <AppText variant="title" bold style={styles.activityType}>
                      {a.activity_type_display}
                    </AppText>
                    {a.call_duration_seconds > 0 && (
                      <AppText variant="caption" color={colors.goldLight}>
                        ⏱ {Math.floor(a.call_duration_seconds / 60)}m {a.call_duration_seconds % 60}s
                      </AppText>
                    )}
                  </View>
                  {a.activity_type === 'whatsapp_dispatched' ? (
                    <View style={styles.whatsappBox}>
                      <View style={styles.whatsappHeaderRow}>
                        <AppText variant="caption" bold color={a.whatsapp_status === 'failed' ? colors.redLight : colors.greenLight}>
                          💬 WhatsApp {a.whatsapp_status === 'failed' ? 'Failed' : 'Sent'}
                        </AppText>
                        {a.whatsapp_template_name ? (
                          <AppBadge label={a.whatsapp_template_name} color={colors.purpleLight} size="sm" />
                        ) : null}
                      </View>
                      <AppText variant="body" color={colors.textSecondary} numberOfLines={3} style={styles.whatsappBody}>
                        {a.whatsapp_message_body || a.notes || 'Message dispatched to guest phone.'}
                      </AppText>
                    </View>
                  ) : (
                    <>
                      {a.notes ? (
                        <AppText variant="body" color={colors.textSecondary} style={styles.notes}>
                          {a.notes}
                        </AppText>
                      ) : null}
                    </>
                  )}
                  <AppText variant="caption" color={colors.textMuted}>
                    {a.user?.username ? `by ${a.user.username} · ` : ''}
                    {formatDate(a.created_at)}
                  </AppText>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryCard: {
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  timeline: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  timelineLine: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.purple,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  activityIcon: {
    fontSize: 16,
  },
  activityType: {
    flex: 1,
  },
  notes: {
    marginBottom: spacing.xs + 2,
  },
  whatsappBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs + 2,
    borderLeftWidth: 3,
    borderLeftColor: colors.green,
    borderWidth: 1,
    borderColor: colors.border,
  },
  whatsappHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  whatsappBody: {
    marginTop: 2,
    fontSize: 13,
  },
});
