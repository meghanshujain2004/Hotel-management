import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { colors, STATUS_COLORS, radius, spacing } from '../theme';
import { api, Lead } from '../api';
import { AppText } from './AppText';
import { AppBadge } from './AppBadge';
import { AppCard } from './AppCard';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';

interface StaffAssignedLeadsModalProps {
  visible: boolean;
  staff: any | null;
  onClose: () => void;
  onSelectTimeline: (lead: Lead) => void;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return 'Not Scheduled';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
    ' at ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
};

const formatDuration = (secs: number) => {
  if (!secs) return '0s';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

export const StaffAssignedLeadsModal: React.FC<StaffAssignedLeadsModalProps> = ({
  visible,
  staff,
  onClose,
  onSelectTimeline,
}) => {
  const [assignedLeads, setAssignedLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && staff) {
      const staffId = staff.user_id || staff.id;
      if (staffId) {
        setLoading(true);
        api
          .getLeads({ assigned_to: String(staffId) })
          .then((data) => {
            const list: Lead[] = Array.isArray(data) ? data : data.results || [];
            setAssignedLeads(list);
          })
          .catch(() => {
            setAssignedLeads([]);
          })
          .finally(() => setLoading(false));
      }
    }
  }, [visible, staff]);

  if (!staff) return null;

  const staffName = staff.full_name || staff.username || 'Staff Member';

  const handleMakeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Dial Call', `Dialing +91 ${phone}`);
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <AppText variant="h2" style={styles.headerTitle}>
                Assigned Leads 📋
              </AppText>
              <AppText variant="caption" color={colors.purpleLight}>
                Assigned to {staffName} ({assignedLeads.length})
              </AppText>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <AppText style={styles.closeText}>✕</AppText>
            </TouchableOpacity>
          </View>

          {/* List Content */}
          {loading ? (
            <LoadingState message={`Fetching leads assigned to ${staffName}...`} />
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {assignedLeads.length === 0 ? (
                <EmptyState
                  icon="📭"
                  title="No Assigned Leads"
                  description={`No active leads are currently assigned to ${staffName}.`}
                />
              ) : (
                assignedLeads.map((lead) => {
                  const statusColor = STATUS_COLORS[lead.status] || colors.textMuted;
                  return (
                    <AppCard key={lead.id} elevated style={styles.leadCard}>
                      {/* Guest Info Row */}
                      <View style={styles.cardHeader}>
                        <View style={styles.guestInfo}>
                          <AppText variant="title" bold style={styles.guestName}>
                            {lead.guest_name}
                          </AppText>
                          <TouchableOpacity onPress={() => handleMakeCall(lead.phone)} activeOpacity={0.7}>
                            <AppText variant="caption" color={colors.goldLight} style={styles.phoneText}>
                              📞 +91 {lead.phone}
                            </AppText>
                          </TouchableOpacity>
                        </View>
                        <AppBadge label={lead.status.replace('_', ' ')} color={statusColor} size="sm" />
                      </View>

                      {/* Call Duration & Followup Date Grid */}
                      <View style={styles.metaRow}>
                        <View style={styles.metaPill}>
                          <AppText variant="caption" color={colors.textMuted}>
                            ⏱ Call Duration:
                          </AppText>
                          <AppText variant="caption" bold color={colors.purpleLight}>
                            {formatDuration(lead.last_call_duration)}
                          </AppText>
                        </View>

                        <View style={styles.metaPill}>
                          <AppText variant="caption" color={colors.textMuted}>
                            📅 Scheduled Followup:
                          </AppText>
                          <AppText variant="caption" bold color={lead.followup_date_time ? colors.goldLight : colors.textMuted}>
                            {formatDate(lead.followup_date_time)}
                          </AppText>
                        </View>
                      </View>

                      {/* Dispositions & Talk Notes */}
                      <View style={styles.notesBox}>
                        <AppText variant="caption" bold color={colors.textMuted} style={styles.notesTitle}>
                          📝 CONVERSATION & DISPOSITION NOTES:
                        </AppText>
                        <AppText variant="body" color={colors.textSecondary} style={styles.notesBody}>
                          {lead.last_disposition_note || lead.inquiry_details || 'No discussion notes logged yet.'}
                        </AppText>
                      </View>

                      {/* Action Bar */}
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => handleMakeCall(lead.phone)}
                          activeOpacity={0.75}
                        >
                          <AppText variant="caption" bold color={colors.greenLight}>
                            📞 Call Guest
                          </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.timelineBtn}
                          onPress={() => {
                            onClose();
                            onSelectTimeline(lead);
                          }}
                          activeOpacity={0.75}
                        >
                          <AppText variant="caption" bold color={colors.goldLight}>
                            View Timeline ➔
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    </AppCard>
                  );
                })
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surfaceCard,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  leadCard: {
    padding: spacing.lg,
    backgroundColor: '#12121c',
    borderWidth: 1,
    borderColor: '#1f1f33',
    borderRadius: radius.xl,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  guestInfo: {
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
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  notesBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.purpleLight,
  },
  notesTitle: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesBody: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  callBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.greenLight + '44',
  },
  timelineBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
