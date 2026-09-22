import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { colors, spacing } from '../theme';
import { api, Lead, UserProfile } from '../api';
import { AppScreen } from '../components/AppScreen';
import { AppText } from '../components/AppText';
import { SearchBar } from '../components/SearchBar';
import { Chip } from '../components/Chip';
import { LeadCard } from '../components/LeadCard';
import { TimelineModal } from '../components/TimelineModal';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

interface Props {
  user: UserProfile;
}

const TIME_FILTERS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: '📅 Today' },
  { key: 'yesterday', label: '⏪ Yesterday' },
  { key: 'week', label: '🗓️ This Week' },
];

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'interested', label: 'Interested' },
  { key: 'awaiting_followup', label: 'Awaiting F/U' },
  { key: 'completed_followup', label: 'Completed F/U' },
  { key: 'registered', label: 'Registered' },
  { key: 'not_interested', label: 'Not Interested' },
  { key: 'lost', label: 'Lost' },
];

export const MyCallsScreen: React.FC<Props> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [timelineLead, setTimelineLead] = useState<Lead | null>(null);

  const fetchMyLeads = useCallback(async () => {
    try {
      const params: Record<string, string> = {
        assigned_to: String(user.id),
      };
      if (statusFilter) params.status = statusFilter;
      if (search.trim().length >= 2) params.search = search.trim();
      const data = await api.getLeads(params);
      let list: Lead[] = Array.isArray(data) ? data : data.results || [];

      // Filter by time locally (today, yesterday, week)
      if (timeFilter !== 'all') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfYesterday = startOfToday - 86400000;
        const startOfWeek = startOfToday - now.getDay() * 86400000;

        list = list.filter((l) => {
          const targetDateStr = l.last_contacted_at || l.updated_at || l.created_at;
          if (!targetDateStr) return false;
          const t = new Date(targetDateStr).getTime();
          if (timeFilter === 'today') return t >= startOfToday;
          if (timeFilter === 'yesterday') return t >= startOfYesterday && t < startOfToday;
          if (timeFilter === 'week') return t >= startOfWeek;
          return true;
        });
      }

      setLeads(list);
    } catch {
      Alert.alert('Error', 'Failed to load your called leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, statusFilter, search, timeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchMyLeads();
  }, [fetchMyLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyLeads();
  };

  return (
    <AppScreen paddingHorizontal={0}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="h1" bold>
          📞 My Called Leads
        </AppText>
        <AppText variant="subtitle" color={colors.textSecondary}>
          History of all guest leads handled by you ({leads.length})
        </AppText>
      </View>

      {/* Search Input */}
      <View style={styles.searchPadding}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by guest name or phone..."
        />
      </View>

      {/* Time Filter Chips (Day / Week) */}
      <FlatList
        data={TIME_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => (
          <Chip
            label={item.label}
            active={timeFilter === item.key}
            onPress={() => setTimeFilter(item.key)}
          />
        )}
      />

      {/* Status Filter Chips */}
      <FlatList
        data={STATUS_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => (
          <Chip
            label={item.label}
            active={statusFilter === item.key}
            onPress={() => setStatusFilter(item.key)}
          />
        )}
      />

      {/* Called Lead List */}
      {loading ? (
        <LoadingState message="Loading your called leads..." />
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.purple}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="📭"
              title="No Called Leads Found"
              description="No called guest records match your search or selected day filter."
            />
          }
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onViewTimeline={() => setTimelineLead(item)}
            />
          )}
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
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  searchPadding: {
    paddingHorizontal: spacing.xl,
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
