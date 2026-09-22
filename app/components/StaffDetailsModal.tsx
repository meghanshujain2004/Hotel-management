import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';
import { AppAvatar } from './AppAvatar';
import { AppBadge } from './AppBadge';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';

interface StaffDetailsModalProps {
  visible: boolean;
  staff: any | null;
  onClose: () => void;
  onViewAssignedLeads?: (staff: any) => void;
}

export const StaffDetailsModal: React.FC<StaffDetailsModalProps> = ({
  visible,
  staff,
  onClose,
  onViewAssignedLeads,
}) => {
  if (!staff) return null;

  const staffName = staff.full_name || staff.username || 'Staff Member';
  const roleTitle = staff.role === 'manager' ? 'Sales Manager' : 'Customer Support Desk';

  const convRate = staff.conversion_rate_percentage ?? staff.team_conversion_percentage ?? 0;
  const convColor =
    convRate >= 70 ? colors.green : convRate >= 40 ? colors.gold : colors.red;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="h2" style={styles.headerTitle}>
              Staff Profile Details
            </AppText>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <AppText style={styles.closeText}>✕</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Hero Profile Card */}
            <View style={styles.heroCard}>
              <AppAvatar name={staffName} role={staff.role === 'manager' ? 'manager' : 'support'} size={64} />
              <View style={styles.heroInfo}>
                <AppText variant="h2" bold style={styles.nameText}>
                  {staffName}
                </AppText>
                <AppText variant="subtitle" color={colors.purpleLight}>
                  {roleTitle}
                </AppText>
                <View style={styles.badgeRow}>
                  <AppBadge label={`${convRate}% Conversion Rate`} color={convColor} />
                  <AppBadge label={`ID: #${staff.user_id || staff.id || '—'}`} color={colors.borderLight} />
                </View>
              </View>
            </View>

            {/* Performance Key Metrics Grid */}
            <AppText variant="subtitle" bold style={styles.sectionTitle}>
              Performance Breakdown
            </AppText>
            <View style={styles.metricsGrid}>
              <View style={[styles.gridTile, { backgroundColor: '#161329', borderColor: '#34255d' }]}>
                <AppText style={[styles.tileVal, { color: colors.purpleLight }]}>
                  {staff.leads_assigned ?? staff.leads_overseeing ?? 0}
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={styles.tileLabel}>
                  Assigned Leads
                </AppText>
              </View>

              <View style={[styles.gridTile, { backgroundColor: '#11192e', borderColor: '#1f345e' }]}>
                <AppText style={[styles.tileVal, { color: colors.blueLight }]}>
                  {staff.calls_logged ?? '—'}
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={styles.tileLabel}>
                  Calls Logged
                </AppText>
              </View>

              <View style={[styles.gridTile, { backgroundColor: '#1d1912', borderColor: '#4a3e20' }]}>
                <AppText style={[styles.tileVal, { color: colors.goldLight }]}>
                  {staff.registered_count ?? staff.team_registered_count ?? 0}
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={styles.tileLabel}>
                  Converted
                </AppText>
              </View>

              <View style={[styles.gridTile, { backgroundColor: '#210d10', borderColor: '#5e1e23' }]}>
                <AppText
                  style={[
                    styles.tileVal,
                    {
                      color:
                        (staff.support_breach_count || staff.manager_critical_breaches || 0) > 0
                          ? colors.redLight
                          : colors.textPrimary,
                    },
                  ]}
                >
                  {staff.support_breach_count ?? staff.manager_critical_breaches ?? 0}
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={styles.tileLabel}>
                  SLA Breaches
                </AppText>
              </View>
            </View>

            {/* Contact Details Card */}
            <AppText variant="subtitle" bold style={styles.sectionTitle}>
              Contact Information
            </AppText>
            <AppCard elevated style={styles.infoCard}>
              <View style={styles.infoRow}>
                <AppText variant="caption" color={colors.textMuted} style={styles.infoLabel}>
                  📧 EMAIL:
                </AppText>
                <AppText variant="body" bold color={colors.textPrimary}>
                  {staff.email || 'Not Provided'}
                </AppText>
              </View>
              <View style={styles.infoRow}>
                <AppText variant="caption" color={colors.textMuted} style={styles.infoLabel}>
                  📱 PHONE:
                </AppText>
                <AppText variant="body" bold color={colors.goldLight}>
                  {staff.phone || 'Not Provided'}
                </AppText>
              </View>
              <View style={styles.infoRow}>
                <AppText variant="caption" color={colors.textMuted} style={styles.infoLabel}>
                  ⏱ AVG CALL DURATION:
                </AppText>
                <AppText variant="body" bold color={colors.purpleLight}>
                  {staff.avg_call_duration_display || '—'}
                </AppText>
              </View>
            </AppCard>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            {onViewAssignedLeads && (
              <AppButton
                title="View Assigned Leads ➔"
                onPress={() => {
                  onClose();
                  onViewAssignedLeads(staff);
                }}
                variant="primary"
                size="md"
              />
            )}
          </View>
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
    maxHeight: '85%',
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
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
  },
  heroInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridTile: {
    width: '48%',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  tileVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  infoCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
