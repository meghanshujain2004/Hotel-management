import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { api, Lead } from '../api';
import { AppScreen } from '../components/AppScreen';
import { AppText } from '../components/AppText';
import { AppCard } from '../components/AppCard';
import { AppAvatar } from '../components/AppAvatar';
import { AppBadge } from '../components/AppBadge';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { AddStaffModal } from '../components/AddStaffModal';
import { StaffDetailsModal } from '../components/StaffDetailsModal';
import { StaffAssignedLeadsModal } from '../components/StaffAssignedLeadsModal';
import { TimelineModal } from '../components/TimelineModal';

interface Props {
  user: any;
}

export const TeamScreen: React.FC<Props> = ({ user }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'support' | 'managers'>('support');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaffDetails, setSelectedStaffDetails] = useState<any | null>(null);
  const [selectedStaffLeads, setSelectedStaffLeads] = useState<any | null>(null);
  const [timelineLead, setTimelineLead] = useState<Lead | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.getTeamPerformance();
      setData(res);
    } catch {
      Alert.alert('Error', 'Failed to load team performance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDeleteStaff = (staffId: number, staffName: string) => {
    Alert.alert(
      'Remove Staff Member',
      `Are you sure you want to remove "${staffName}" from your team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteStaff(staffId);
              Alert.alert('Success', `Staff member "${staffName}" removed.`);
              fetchData();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to remove staff member.');
            }
          },
        },
      ]
    );
  };

  const supportAgents: any[] = data?.support_agents || [];
  const managers: any[] = data?.managers || [];
  const activeList = activeTab === 'support' ? supportAgents : managers;

  const canAdd = user.role === 'admin' || user.role === 'manager';
  const isAdmin = user.role === 'admin';
  const isManager = user.role === 'manager';

  const totalStaffCount = supportAgents.length + managers.length;
  const totalBreachesCount =
    supportAgents.reduce((sum, a) => sum + (a.support_breach_count || 0), 0) +
    managers.reduce((sum, m) => sum + (m.manager_critical_breaches || 0), 0);

  const renderSupportCard = (agent: any) => {
    const expanded = expandedId === agent.user_id;
    const convColor =
      agent.conversion_rate_percentage >= 70
        ? colors.green
        : agent.conversion_rate_percentage >= 40
        ? colors.gold
        : colors.red;

    const canDelete = isAdmin || isManager;

    return (
      <AppCard
        key={agent.user_id}
        elevated
        onPress={() => setExpandedId(expanded ? null : agent.user_id)}
        style={styles.card}
      >
        {/* Clickable Header for Staff Profile Details */}
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.75}
          onPress={() => setSelectedStaffDetails({ ...agent, role: 'support' })}
        >
          <AppAvatar name={agent.full_name || agent.username} role="support" size={46} />
          <View style={styles.cardInfo}>
            <View style={styles.nameHeaderRow}>
              <AppText variant="title" bold style={styles.staffName}>
                {agent.full_name || agent.username}
              </AppText>
              <AppText style={styles.infoTapIcon}>ℹ️</AppText>
            </View>
            <AppText variant="caption" color={colors.purpleLight}>
              Customer Support Desk · Tap for details
            </AppText>
          </View>
          <AppBadge label={`${agent.conversion_rate_percentage}%`} color={convColor} />
          {canDelete && (
            <TouchableOpacity
              onPress={() => handleDeleteStaff(agent.user_id, agent.full_name || agent.username)}
              style={styles.deleteBtn}
              activeOpacity={0.7}
            >
              <AppText style={styles.deleteIcon}>🗑️</AppText>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Performance Metrics Row */}
        <View style={styles.statsRow}>
          {/* Clickable Assigned Tile -> Opens Assigned Leads Modal */}
          <TouchableOpacity
            style={[styles.statItem, styles.statItemClickable]}
            activeOpacity={0.75}
            onPress={() => setSelectedStaffLeads(agent)}
          >
            <AppText variant="h2" bold style={styles.statValClickable}>
              {agent.leads_assigned} ➔
            </AppText>
            <AppText style={styles.clickableStatLabel} numberOfLines={1}>
              Assigned
            </AppText>
          </TouchableOpacity>

          <View style={styles.statItem}>
            <AppText variant="h2" bold style={styles.statValNum}>
              {agent.calls_logged}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Calls
            </AppText>
          </View>

          <View style={styles.statItem}>
            <AppText variant="h2" bold color={colors.greenLight} style={styles.statValNum}>
              {agent.registered_count}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Converted
            </AppText>
          </View>

          <View style={styles.statItem}>
            <AppText
              variant="h2"
              bold
              color={agent.support_breach_count > 0 ? colors.redLight : colors.textPrimary}
              style={styles.statValNum}
            >
              {agent.support_breach_count}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Breaches
            </AppText>
          </View>
        </View>

        {expanded && (
          <View style={styles.expandedSection}>
            <View style={styles.expandedRow}>
              <AppText variant="body" color={colors.textSecondary}>
                📞 Avg Call Duration
              </AppText>
              <AppText variant="body" bold color={colors.goldLight}>
                {agent.avg_call_duration_display}
              </AppText>
            </View>
            <View style={styles.expandedRow}>
              <AppText variant="body" color={colors.textSecondary}>
                🚨 Active Escalations
              </AppText>
              <AppText
                variant="body"
                bold
                color={agent.active_escalations > 0 ? colors.redLight : colors.textPrimary}
              >
                {agent.active_escalations}
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.viewLeadsLink}
              activeOpacity={0.8}
              onPress={() => setSelectedStaffLeads(agent)}
            >
              <AppText variant="caption" bold color={colors.goldLight}>
                📋 View {agent.leads_assigned} Assigned Leads with Notes ➔
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </AppCard>
    );
  };

  const renderManagerCard = (mgr: any) => {
    const expanded = expandedId === mgr.user_id;
    const convColor =
      mgr.team_conversion_percentage >= 70
        ? colors.green
        : mgr.team_conversion_percentage >= 40
        ? colors.gold
        : colors.red;

    const canDelete = isAdmin;

    return (
      <AppCard
        key={mgr.user_id}
        elevated
        accentColor={colors.gold}
        onPress={() => setExpandedId(expanded ? null : mgr.user_id)}
        style={styles.card}
      >
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.75}
          onPress={() => setSelectedStaffDetails({ ...mgr, role: 'manager' })}
        >
          <AppAvatar name={mgr.full_name || mgr.username} role="manager" size={46} />
          <View style={styles.cardInfo}>
            <View style={styles.nameHeaderRow}>
              <AppText variant="title" bold style={styles.staffName}>
                {mgr.full_name || mgr.username}
              </AppText>
              <AppText style={styles.infoTapIcon}>ℹ️</AppText>
            </View>
            <AppText variant="caption" color={colors.goldLight}>
              Sales Manager · Tap for details
            </AppText>
          </View>
          <AppBadge label={`${mgr.team_conversion_percentage}%`} color={convColor} />
          {canDelete && (
            <TouchableOpacity
              onPress={() => handleDeleteStaff(mgr.user_id, mgr.full_name || mgr.username)}
              style={styles.deleteBtn}
              activeOpacity={0.7}
            >
              <AppText style={styles.deleteIcon}>🗑️</AppText>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statItem, styles.statItemClickable]}
            activeOpacity={0.75}
            onPress={() => setSelectedStaffLeads(mgr)}
          >
            <AppText variant="h2" bold style={styles.statValClickable}>
              {mgr.leads_overseeing} ➔
            </AppText>
            <AppText style={styles.clickableStatLabelGold} numberOfLines={1}>
              Overseeing
            </AppText>
          </TouchableOpacity>

          <View style={styles.statItem}>
            <AppText variant="h2" bold style={styles.statValNum}>
              {mgr.supervised_agents_count}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Staff
            </AppText>
          </View>

          <View style={styles.statItem}>
            <AppText variant="h2" bold color={colors.greenLight} style={styles.statValNum}>
              {mgr.team_registered_count}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Converted
            </AppText>
          </View>

          <View style={styles.statItem}>
            <AppText
              variant="h2"
              bold
              color={mgr.manager_critical_breaches > 0 ? colors.redLight : colors.textPrimary}
              style={styles.statValNum}
            >
              {mgr.manager_critical_breaches}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Breaches
            </AppText>
          </View>
        </View>

        {mgr.manager_critical_breaches > 0 && (
          <View style={styles.breachAlert}>
            <AppText variant="caption" bold color={colors.redLight}>
              ⚠️ Manager Critical Breaches: {mgr.manager_critical_breaches} (Escalated to Admin)
            </AppText>
          </View>
        )}

        {expanded && (
          <View style={styles.expandedSection}>
            <View style={styles.expandedRow}>
              <AppText variant="body" color={colors.textSecondary}>
                🚨 Active Escalations
              </AppText>
              <AppText
                variant="body"
                bold
                color={mgr.active_escalations > 0 ? colors.redLight : colors.textPrimary}
              >
                {mgr.active_escalations}
              </AppText>
            </View>
          </View>
        )}
      </AppCard>
    );
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
              Team Performance
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Staff Leaderboard & SLA Compliance
            </AppText>
          </View>
        </View>

        {canAdd && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <AppText style={styles.addBtnText}>＋ Add Staff</AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* KPI Stats Strip */}
      <View style={styles.statsRowTop}>
        <View style={[styles.statTile, { backgroundColor: '#161329', borderColor: '#34255d' }]}>
          <AppText variant="caption" color={colors.purpleLight} style={styles.statLabel}>
            TOTAL STAFF
          </AppText>
          <AppText style={[styles.statValue, { color: colors.purpleLight }]}>
            {totalStaffCount}
          </AppText>
        </View>

        <View style={[styles.statTile, { backgroundColor: '#1d1912', borderColor: '#4a3e20' }]}>
          <AppText variant="caption" color={colors.goldLight} style={styles.statLabel}>
            SUPPORT STAFF
          </AppText>
          <AppText style={[styles.statValue, { color: colors.goldLight }]}>
            {supportAgents.length}
          </AppText>
        </View>

        <View style={[styles.statTile, { backgroundColor: '#210d10', borderColor: '#5e1e23' }]}>
          <AppText variant="caption" color={colors.redLight} style={styles.statLabel}>
            BREACHES
          </AppText>
          <AppText style={[styles.statValue, { color: colors.redLight }]}>
            {totalBreachesCount}
          </AppText>
        </View>
      </View>

      {/* Segmented Switcher */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'support' && styles.segmentTabActive]}
          onPress={() => {
            setActiveTab('support');
            setExpandedId(null);
          }}
          activeOpacity={0.8}
        >
          <AppText
            variant="caption"
            bold
            color={activeTab === 'support' ? colors.purpleLight : colors.textSecondary}
          >
            Support Staff ({supportAgents.length})
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'managers' && styles.segmentTabActiveGold]}
          onPress={() => {
            setActiveTab('managers');
            setExpandedId(null);
          }}
          activeOpacity={0.8}
        >
          <AppText
            variant="caption"
            bold
            color={activeTab === 'managers' ? colors.goldLight : colors.textSecondary}
          >
            Managers ({managers.length})
          </AppText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingState message="Loading leaderboard..." />
      ) : activeList.length === 0 ? (
        <EmptyState
          icon="👥"
          title={`No ${activeTab === 'support' ? 'Support Staff' : 'Managers'} Found`}
          description="There are currently no staff accounts registered under this role."
          actionTitle={canAdd ? '+ Add Staff Member' : undefined}
          onAction={canAdd ? () => setShowAddModal(true) : undefined}
        />
      ) : (
        <View style={styles.listContent}>
          {activeTab === 'support'
            ? activeList.map(renderSupportCard)
            : activeList.map(renderManagerCard)}
        </View>
      )}

      {/* Add Staff Modal */}
      <AddStaffModal
        visible={showAddModal}
        currentUserRole={user.role}
        onClose={() => setShowAddModal(false)}
        onStaffAdded={fetchData}
      />

      {/* Staff Profile Details Modal (Tapping Support/Manager Name) */}
      <StaffDetailsModal
        visible={!!selectedStaffDetails}
        staff={selectedStaffDetails}
        onClose={() => setSelectedStaffDetails(null)}
        onViewAssignedLeads={(st) => setSelectedStaffLeads(st)}
      />

      {/* Staff Assigned Leads Modal (Tapping Assigned Count) */}
      <StaffAssignedLeadsModal
        visible={!!selectedStaffLeads}
        staff={selectedStaffLeads}
        onClose={() => setSelectedStaffLeads(null)}
        onSelectTimeline={(ld) => setTimelineLead(ld)}
      />

      {/* Timeline Modal */}
      {timelineLead && (
        <TimelineModal
          visible={!!timelineLead}
          leadId={timelineLead.id}
          guestName={timelineLead.guest_name}
          onClose={() => setTimelineLead(null)}
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
  addBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: colors.goldLight + '88',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  addBtnText: {
    color: colors.goldLight,
    fontSize: 13,
    fontWeight: '700',
  },
  statsRowTop: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statTile: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  segmentTabActive: {
    backgroundColor: colors.purpleSurface,
  },
  segmentTabActiveGold: {
    backgroundColor: colors.goldSurface,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: '#12121c',
    borderWidth: 1,
    borderColor: '#1f1f33',
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  staffName: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  infoTapIcon: {
    fontSize: 12,
  },
  deleteBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  deleteIcon: {
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemClickable: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: radius.md,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clickableStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.purpleLight,
    textAlign: 'center',
    marginTop: 1,
  },
  clickableStatLabelGold: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.goldLight,
    textAlign: 'center',
    marginTop: 1,
  },
  statValClickable: {
    fontSize: 17,
    color: colors.purpleLight,
  },
  statValNum: {
    fontSize: 17,
  },
  breachAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  expandedSection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  viewLeadsLink: {
    marginTop: spacing.xs,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
