import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { api, Lead, UserProfile } from '../api';
import { AppScreen } from '../components/AppScreen';
import { AppText } from '../components/AppText';
import { SearchBar } from '../components/SearchBar';
import { Chip } from '../components/Chip';
import { LeadCard } from '../components/LeadCard';
import { TimelineModal } from '../components/TimelineModal';
import { ReassignModal } from '../components/ReassignModal';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

interface Props {
  user: UserProfile;
}

const FILTER_CHIPS = [
  { key: 'all', label: 'All Scheduled' },
  { key: 'today', label: '📅 Today' },
  { key: 'tomorrow', label: '⏩ Tomorrow' },
  { key: 'overdue', label: '🚨 Overdue' },
];

const formatFollowupDate = (iso?: string | null) => {
  if (!iso) return 'Not Scheduled';
  const d = new Date(iso);
  const now = new Date();
  const diffHours = Math.round((d.getTime() - now.getTime()) / (1000 * 3600));

  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  if (diffHours < 0) {
    return `🚨 OVERDUE · ${dateStr} at ${timeStr}`;
  } else if (d.toDateString() === now.toDateString()) {
    return `📅 TODAY at ${timeStr}`;
  }
  return `📅 ${dateStr} at ${timeStr}`;
};

export const FollowupCallsScreen: React.FC<Props> = ({ user }) => {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [displayedLeads, setDisplayedLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [timelineLead, setTimelineLead] = useState<Lead | null>(null);
  const [reassignLead, setReassignLead] = useState<Lead | null>(null);

  const canReassign = user.role === 'admin' || user.role === 'manager';

  const fetchFollowupLeads = useCallback(async () => {
    try {
      const params: Record<string, string> = {
        has_followup: 'true',
        ordering: 'followup_date_time',
      };
      if (user.role === 'support') {
        params.assigned_to = String(user.id);
      }
      if (search.trim().length >= 2) {
        params.search = search.trim();
      }

      const data = await api.getLeads(params);
      let list: Lead[] = Array.isArray(data) ? data : data.results || [];

      // Sort by followup_date_time ascending
      list.sort((a, b) => {
        const timeA = a.followup_date_time ? new Date(a.followup_date_time).getTime() : Infinity;
        const timeB = b.followup_date_time ? new Date(b.followup_date_time).getTime() : Infinity;
        return timeA - timeB;
      });

      setAllLeads(list);

      // Apply filter
      let filtered = [...list];
      if (activeFilter !== 'all') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfTomorrow = startOfToday + 86400000;
        const endOfTomorrow = startOfTomorrow + 86400000;

        filtered = filtered.filter((l) => {
          if (!l.followup_date_time) return false;
          const t = new Date(l.followup_date_time).getTime();
          if (activeFilter === 'today') return t >= startOfToday && t < startOfTomorrow;
          if (activeFilter === 'tomorrow') return t >= startOfTomorrow && t < endOfTomorrow;
          if (activeFilter === 'overdue') return t < now.getTime();
          return true;
        });
      }

      setDisplayedLeads(filtered);
    } catch {
      Alert.alert('Error', 'Failed to load scheduled follow-up calls');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, user.role, search, activeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchFollowupLeads();
  }, [fetchFollowupLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFollowupLeads();
  };

  // Metrics
  const nowMs = Date.now();
  const startOfToday = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
  const startOfTomorrow = startOfToday + 86400000;

  const dueTodayCount = allLeads.filter((l) => {
    if (!l.followup_date_time) return false;
    const t = new Date(l.followup_date_time).getTime();
    return t >= startOfToday && t < startOfTomorrow;
  }).length;

  const overdueCount = allLeads.filter((l) => {
    if (!l.followup_date_time) return false;
    return new Date(l.followup_date_time).getTime() < nowMs;
  }).length;

  return (
    <AppScreen paddingHorizontal={0}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.logoCircle}>
            <AppText style={styles.logoIcon}>👑</AppText>
          </View>
          <View>
            <AppText variant="h1" bold style={styles.headerTitle}>
              Follow-Up Calls
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Scheduled Callbacks & Priority Queue
            </AppText>
          </View>
        </View>
      </View>

      {/* KPI Stats Strip */}
      <View style={styles.statsRow}>
        <View style={[styles.statTile, { backgroundColor: '#161329', borderColor: '#34255d' }]}>
          <AppText variant="caption" color={colors.purpleLight} style={styles.statLabel}>
            ALL QUEUED
          </AppText>
          <AppText style={[styles.statValue, { color: colors.purpleLight }]}>
            {allLeads.length}
          </AppText>
        </View>

        <View style={[styles.statTile, { backgroundColor: '#1d1912', borderColor: '#4a3e20' }]}>
          <AppText variant="caption" color={colors.goldLight} style={styles.statLabel}>
            DUE TODAY
          </AppText>
          <AppText style={[styles.statValue, { color: colors.goldLight }]}>
            {dueTodayCount}
          </AppText>
        </View>

        <View style={[styles.statTile, { backgroundColor: '#210d10', borderColor: '#5e1e23' }]}>
          <AppText variant="caption" color={colors.redLight} style={styles.statLabel}>
            OVERDUE
          </AppText>
          <AppText style={[styles.statValue, { color: colors.redLight }]}>
            {overdueCount}
          </AppText>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchPadding}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search guest name or phone..."
        />
      </View>

      {/* Filter Chips */}
      <FlatList
        data={FILTER_CHIPS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => (
          <Chip
            label={item.label}
            active={activeFilter === item.key}
            onPress={() => setActiveFilter(item.key)}
          />
        )}
      />

      {/* Follow-Up List */}
      {loading ? (
        <LoadingState message="Loading scheduled callbacks..." />
      ) : (
        <FlatList
          data={displayedLeads}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.goldLight}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="📅"
              title="No Scheduled Callbacks"
              description="No upcoming follow-up calls match your selected filter."
            />
          }
          renderItem={({ item }) => {
            const isOverdue = item.followup_date_time && new Date(item.followup_date_time).getTime() < Date.now();
            return (
              <View style={styles.cardWrapper}>
                {/* Time Banner */}
                <View
                  style={[
                    styles.timeBanner,
                    isOverdue ? styles.timeBannerOverdue : styles.timeBannerUpcoming,
                  ]}
                >
                  <AppText variant="caption" bold color={isOverdue ? colors.redLight : colors.purpleLight}>
                    {formatFollowupDate(item.followup_date_time)}
                  </AppText>
                </View>

                <LeadCard
                  lead={item}
                  onViewTimeline={() => setTimelineLead(item)}
                  onReassign={canReassign ? () => setReassignLead(item) : undefined}
                />
              </View>
            );
          }}
        />
      )}

      {/* Timeline Modal */}
      {timelineLead && (
        <TimelineModal
          visible={!!timelineLead}
          leadId={timelineLead.id}
          guestName={timelineLead.guest_name}
          onClose={() => setTimelineLead(null)}
        />
      )}

      {/* Reassign Modal */}
      {reassignLead && (
        <ReassignModal
          visible={!!reassignLead}
          lead={reassignLead}
          currentUserRole={user.role}
          onClose={() => setReassignLead(null)}
          onReassigned={fetchFollowupLeads}
        />
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  headerTitle: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
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
  searchPadding: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xs,
  },
  filterRow: {
    paddingLeft: spacing.xl,
    marginBottom: spacing.xs,
    flexGrow: 0,
    maxHeight: 48,
  },
  filterContent: {
    paddingRight: spacing.xl,
    paddingBottom: spacing.xs,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  timeBanner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginBottom: -8,
    zIndex: 1,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  timeBannerUpcoming: {
    backgroundColor: '#161329',
    borderColor: '#34255d',
  },
  timeBannerOverdue: {
    backgroundColor: '#210d10',
    borderColor: '#5e1e23',
  },
});
