import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { api, Lead } from '../api';
import { AppScreen } from '../components/AppScreen';
import { AppText } from '../components/AppText';
import { SearchBar } from '../components/SearchBar';
import { Chip } from '../components/Chip';
import { LeadCard } from '../components/LeadCard';
import { TimelineModal } from '../components/TimelineModal';
import { AddLeadModal } from '../components/AddLeadModal';
import { ReassignModal } from '../components/ReassignModal';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

interface Props {
  user: any;
}

const STATUS_FILTERS = [
  { key: '', label: 'All Leads' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'interested', label: 'Interested' },
  { key: 'awaiting_followup', label: 'Awaiting F/U' },
  { key: 'completed_followup', label: 'Completed F/U' },
  { key: 'registered', label: 'Registered' },
  { key: 'not_interested', label: 'Not Interested' },
  { key: 'lost', label: 'Lost' },
];

export const LeadsScreen: React.FC<Props> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [timelineLead, setTimelineLead] = useState<Lead | null>(null);
  const [reassignLead, setReassignLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const canReassign = user.role === 'admin' || user.role === 'manager';
  const canDelete = user.role === 'admin';

  const handleDeleteLead = (leadId: number, guestName: string) => {
    Alert.alert(
      'Delete Lead',
      `Are you sure you want to permanently delete lead for ${guestName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteLead(leadId);
              Alert.alert('Success', 'Lead deleted successfully');
              fetchLeads();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete lead');
            }
          },
        },
      ]
    );
  };

  const fetchLeads = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (search.length >= 2) params.search = search;
      const data = await api.getLeads(params);
      setLeads(Array.isArray(data) ? data : data.results || []);
    } catch {
      Alert.alert('Error', 'Failed to fetch leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    setLoading(true);
    fetchLeads();
  }, [fetchLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  // Quick Stats
  const totalCount = leads.length;
  const newCount = leads.filter((l) => l.status === 'new').length;
  const registeredCount = leads.filter((l) => l.status === 'registered').length;

  return (
    <AppScreen paddingHorizontal={0}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <View style={styles.logoCircle}>
              <AppText style={styles.logoIcon}>👑</AppText>
            </View>
            <View>
              <AppText variant="h1" bold style={styles.titleText}>
                Leads Directory
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Hotel Guest Pipeline & Inquiries
              </AppText>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <AppText style={styles.addBtnText}>＋ Add Lead</AppText>
        </TouchableOpacity>
      </View>

      {/* KPI Stats Strip */}
      <View style={styles.statsRow}>
        <View style={[styles.statTile, { backgroundColor: '#161329', borderColor: '#34255d' }]}>
          <AppText variant="caption" color={colors.purpleLight} style={styles.statLabel}>
            TOTAL LEADS
          </AppText>
          <AppText style={[styles.statValue, { color: colors.purpleLight }]}>
            {totalCount}
          </AppText>
        </View>

        <View style={[styles.statTile, { backgroundColor: '#11192e', borderColor: '#1f345e' }]}>
          <AppText variant="caption" color={colors.blueLight} style={styles.statLabel}>
            NEW
          </AppText>
          <AppText style={[styles.statValue, { color: colors.blueLight }]}>
            {newCount}
          </AppText>
        </View>

        <View style={[styles.statTile, { backgroundColor: '#1d1912', borderColor: '#4a3e20' }]}>
          <AppText variant="caption" color={colors.goldLight} style={styles.statLabel}>
            REGISTERED
          </AppText>
          <AppText style={[styles.statValue, { color: colors.goldLight }]}>
            {registeredCount}
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

      {/* Filter chips */}
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

      {/* Lead list */}
      {loading ? (
        <LoadingState message="Loading directory..." />
      ) : (
        <FlatList
          data={leads}
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
              icon="📭"
              title="No Leads Found"
              description="No guests match your selected search or filter criteria."
              actionTitle="+ Add New Lead Manually"
              onAction={() => setShowAddModal(true)}
            />
          }
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onViewTimeline={() => setTimelineLead(item)}
              onReassign={canReassign ? () => setReassignLead(item) : undefined}
              onDelete={canDelete ? () => handleDeleteLead(item.id, item.guest_name) : undefined}
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

      {/* Reassign Modal */}
      {reassignLead && (
        <ReassignModal
          visible={!!reassignLead}
          lead={reassignLead}
          currentUserRole={user.role}
          onClose={() => setReassignLead(null)}
          onReassigned={fetchLeads}
        />
      )}

      {/* Add Lead Modal */}
      <AddLeadModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onLeadAdded={fetchLeads}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
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
  titleText: {
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
});
