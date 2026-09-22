import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { api, Lead, UserProfile } from '../api';
import { AppScreen } from '../components/AppScreen';
import { AppText } from '../components/AppText';
import { AppCard } from '../components/AppCard';
import { AppBadge } from '../components/AppBadge';
import { Chip } from '../components/Chip';
import { EscalationCard } from '../components/EscalationCard';
import { ReassignModal } from '../components/ReassignModal';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

interface Props {
  user: UserProfile;
}

export const EscalationsScreen: React.FC<Props> = ({ user }) => {
  const isAdmin = user.role === 'admin';
  const isManager = user.role === 'manager';

  // Role-based default level: Admin sees Level 2, Manager sees Level 1
  const initialFilter = isAdmin ? 'level2' : isManager ? 'level1' : 'all';

  const [escalations, setEscalations] = useState<Lead[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reassignLead, setReassignLead] = useState<Lead | null>(null);

  // Available filters based on role
  const FILTERS = isAdmin
    ? [{ key: 'level2', label: '🔥 Level 2: Admin Critical' }]
    : isManager
    ? [{ key: 'level1', label: '⚡ Level 1: Manager Escalations' }]
    : [
        { key: 'all', label: 'All Escalations' },
        { key: 'level1', label: '⚡ Level 1: Manager' },
        { key: 'level2', label: '🔥 Level 2: Admin Critical' },
      ];

  const fetchData = useCallback(async () => {
    try {
      // Force filter for Admin/Manager
      const effectiveFilter = isAdmin ? 'level2' : isManager ? 'level1' : activeFilter;
      const data = await api.getEscalations(effectiveFilter);

      let list: Lead[] = data.escalations || [];

      // Additional strict client-side filtering guarantee
      if (isAdmin) {
        list = list.filter(
          (l) => l.escalation_level === 'level2_admin' || l.support_breach_count >= 2 || l.is_escalated
        );
      } else if (isManager) {
        list = list.filter(
          (l) => l.escalation_level === 'level1_manager' || l.escalation_level === 'day1_reminder' || l.escalation_level === 'day3_reminder'
        );
      }

      setEscalations(list);
      setMetrics(data.metrics || null);
    } catch {
      Alert.alert('Error', 'Failed to load escalations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, isAdmin, isManager]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <AppScreen scrollable refreshing={refreshing} onRefresh={onRefresh}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.logoCircle}>
            <AppText style={styles.logoIcon}>👑</AppText>
          </View>
          <View style={styles.headerTextCol}>
            <AppText variant="h1" bold style={styles.headerTitle}>
              Escalations Hub
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {isAdmin
                ? 'Level 2 Critical SLA Breaches (Admin View)'
                : isManager
                ? 'Level 1 Manager Inaction Oversight'
                : 'SLA Escalations & Breach Monitoring'}
            </AppText>
          </View>
        </View>

        <AppBadge
          label={isAdmin ? 'ADMIN L2 ONLY' : isManager ? 'MANAGER L1 ONLY' : 'SLA ENGINE'}
          color={isAdmin ? colors.red : isManager ? colors.gold : colors.purpleLight}
          size="sm"
        />
      </View>

      {/* KPI Metrics Row */}
      {metrics && (
        <View style={styles.metricsRow}>
          {(!isAdmin && !isManager) && (
            <View style={[styles.metricCard, { backgroundColor: '#161329', borderColor: '#34255d' }]}>
              <AppText style={[styles.metricVal, { color: colors.textPrimary }]}>
                {metrics.total_escalated ?? 0}
              </AppText>
              <AppText variant="caption" color={colors.textMuted} style={styles.metricLabel}>
                TOTAL
              </AppText>
            </View>
          )}

          {(!isAdmin) && (
            <View style={[styles.metricCard, { backgroundColor: '#1f160b', borderColor: '#4a3212' }]}>
              <AppText style={[styles.metricVal, { color: colors.goldLight }]}>
                {metrics.level1_support_inaction ?? 0}
              </AppText>
              <AppText variant="caption" color={colors.textMuted} style={styles.metricLabel}>
                L1 MANAGER
              </AppText>
            </View>
          )}

          {(!isManager) && (
            <View style={[styles.metricCard, { backgroundColor: '#210d10', borderColor: '#5e1e23' }]}>
              <AppText style={[styles.metricVal, { color: colors.redLight }]}>
                {metrics.level2_admin_critical ?? 0}
              </AppText>
              <AppText variant="caption" color={colors.textMuted} style={styles.metricLabel}>
                L2 CRITICAL
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Filter chips (Hidden if single enforced level) */}
      {FILTERS.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              active={activeFilter === f.key}
              onPress={() => setActiveFilter(f.key)}
            />
          ))}
        </ScrollView>
      )}

      {/* Role scope banner indicator */}
      <View style={[styles.roleScopeBanner, isAdmin ? styles.bannerAdmin : styles.bannerManager]}>
        <AppText style={styles.roleScopeText}>
          {isAdmin
            ? '🔒 Strict Admin Filter Active: Displaying ONLY Level 2 Critical SLA Breaches'
            : isManager
            ? '🔒 Strict Manager Filter Active: Displaying ONLY Level 1 Manager Escalations'
            : '📋 Displaying Active SLA Escalations'}
        </AppText>
      </View>

      {/* List content */}
      {loading ? (
        <LoadingState message="Fetching active SLA breaches..." />
      ) : escalations.length === 0 ? (
        <EmptyState
          icon="✅"
          title={
            isAdmin
              ? 'No Level 2 Critical Escalations'
              : isManager
              ? 'No Level 1 Manager Escalations'
              : 'No Active Escalations'
          }
          description="All leads are being processed within SLA thresholds — no breach actions required."
        />
      ) : (
        <View style={styles.listContent}>
          {escalations.map((lead) => (
            <EscalationCard key={lead.id} lead={lead} onReassign={() => setReassignLead(lead)} />
          ))}
        </View>
      )}

      {/* Reassign Modal */}
      {reassignLead && (
        <ReassignModal
          visible={!!reassignLead}
          lead={reassignLead}
          currentUserRole={user.role}
          onClose={() => setReassignLead(null)}
          onReassigned={fetchData}
        />
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#161421',
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 20,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  roleScopeBanner: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  bannerAdmin: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  bannerManager: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  roleScopeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterRow: {
    marginBottom: spacing.md,
    flexGrow: 0,
  },
  filterContent: {
    paddingRight: spacing.xl,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});
