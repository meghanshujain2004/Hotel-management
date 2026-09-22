import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, spacing } from '../theme';
import { api, UserProfile } from '../api';
import { AppScreen } from '../components/AppScreen';
import { AppText } from '../components/AppText';
import { AppCard } from '../components/AppCard';
import { LoadingState } from '../components/LoadingState';
import { Chip } from '../components/Chip';
import { CircularGaugeCard } from '../components/CircularGaugeCard';
import { AddLeadModal } from '../components/AddLeadModal';
import { NotificationModal, NotificationItem } from '../components/NotificationModal';

const READ_NOTIFS_STORAGE_KEY = 'HOTEL_CRM_READ_NOTIFICATIONS_V1';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface Props {
  user: UserProfile;
  navigation: any;
}

export const HomeScreen: React.FC<Props> = ({ user, navigation }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [dueFollowups, setDueFollowups] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'today' | 'this_week' | 'this_month' | 'all'>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  // Notification / Read Tracker State
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [readMap, setReadMap] = useState<Record<string, number>>({});

  const PERIODS = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'this_week', label: 'Week' },
    { key: 'this_month', label: 'Month' },
  ];

  // Helper to load & purge 24h old read notifications
  const loadReadMap = async (): Promise<Record<string, number>> => {
    try {
      const stored = await AsyncStorage.getItem(READ_NOTIFS_STORAGE_KEY);
      if (!stored) return {};
      const parsed: Record<string, number> = JSON.parse(stored);
      const now = Date.now();
      const cleaned: Record<string, number> = {};

      // Filter out items read more than 24 hours ago (Auto-purge after 24h)
      Object.entries(parsed).forEach(([id, readAt]) => {
        if (now - readAt < TWENTY_FOUR_HOURS_MS) {
          cleaned[id] = readAt;
        }
      });

      await AsyncStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(cleaned));
      return cleaned;
    } catch {
      return {};
    }
  };

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await api.getDashboardOverview(period);
      setMetrics(data);
      const followData = await api.getDueFollowups();
      setDueFollowups(followData);

      // Process Notifications (Recent Activity Audit Trail + Escalations)
      const currentRead = await loadReadMap();
      setReadMap(currentRead);

      const items: NotificationItem[] = [];

      // Add Active Escalations as urgent notifications
      if (data?.kpi_cards?.active_escalations > 0) {
        const escId = `escalation_active_${data.kpi_cards.active_escalations}`;
        items.push({
          id: escId,
          title: `${data.kpi_cards.active_escalations} Critical Escalations`,
          subtitle: 'Immediate SLA breach attention required',
          timestamp: 'Just now',
          createdAtMs: Date.now(),
          type: 'escalation',
          isRead: !!currentRead[escId],
        });
      }

      // Add Recent Audit Trail Activities
      if (data?.recent_activities && Array.isArray(data.recent_activities)) {
        data.recent_activities.forEach((act: any) => {
          const actId = `act_${act.id}`;
          const isRead = !!currentRead[actId];
          items.push({
            id: actId,
            title: `${act.user_name} · ${act.activity_type_display}`,
            subtitle: `Guest: ${act.guest_name}`,
            timestamp: act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            createdAtMs: act.created_at ? new Date(act.created_at).getTime() : Date.now(),
            type: 'activity',
            isRead: isRead,
          });
        });
      }

      setNotificationsList(items);
    } catch {
      Alert.alert('Error', 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchMetrics();
  }, [fetchMetrics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  // Open Notification Modal & Mark all current notifications as READ
  const handleOpenNotifications = async () => {
    setIsNotifModalOpen(true);
    await markAllNotificationsRead();
  };

  const markAllNotificationsRead = async () => {
    const now = Date.now();
    const updatedMap = { ...readMap };

    notificationsList.forEach((n) => {
      updatedMap[n.id] = now;
    });

    setReadMap(updatedMap);
    setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await AsyncStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(updatedMap));
    } catch (e) {
      console.warn('Failed to save read notifications state', e);
    }
  };

  const handleWhatsAppAlert = () => {
    Alert.alert(
      'WhatsApp Alert System',
      'Automated SLA Breach & Follow-up reminders dispatched to support team via WhatsApp.',
      [{ text: 'OK' }]
    );
  };

  const kpi = metrics?.kpi_cards;

  // Requirement 1: Only count real active escalations (no fallback to 3!)
  const activeEscalationsCount = kpi?.active_escalations ?? 0;
  const totalLeadsCount = kpi?.total_leads ?? 0;
  const convertedCount = kpi?.today_converted ?? 0;

  // Requirement 2: Calculate unread notification count
  const unreadNotifCount = notificationsList.filter((n) => !n.isRead).length;

  const displayName = user.first_name || user.username || 'Megh';
  const roleTitle = user.role === 'admin' ? 'Admin Hub' : user.role === 'manager' ? 'Manager Hub' : 'Support Desk';

  return (
    <AppScreen scrollable refreshing={refreshing} onRefresh={onRefresh}>
      {/* Top Header Section */}
      <View style={styles.topHeader}>
        {/* Logo Badge (Crown + H) */}
        <View style={styles.logoCircle}>
          <View style={styles.logoInner}>
            <AppText style={styles.crownEmoji}>👑</AppText>
            <AppText style={styles.logoLetter}>H</AppText>
          </View>
        </View>

        {/* Bell Notification Icon (Shows unread counter only if unreadNotifCount > 0) */}
        <TouchableOpacity
          style={styles.bellBtn}
          activeOpacity={0.75}
          onPress={handleOpenNotifications}
        >
          <AppText style={styles.bellIcon}>🔔</AppText>
          {unreadNotifCount > 0 && (
            <View style={styles.bellBadge}>
              <AppText style={styles.bellBadgeText}>
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Greeting Title Row */}
      <View style={styles.greetingContainer}>
        <AppText style={styles.greetingTitle}>
          {roleTitle} <AppText style={styles.greetingSub}>- Welcome, </AppText>
          <AppText style={styles.greetingName}>{displayName}</AppText>
        </AppText>
      </View>

      {/* Period Filter Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {PERIODS.map((p) => (
          <Chip
            key={p.key}
            label={p.label}
            active={period === p.key}
            onPress={() => setPeriod(p.key as any)}
          />
        ))}
      </ScrollView>

      {loading ? (
        <LoadingState message="Fetching live metrics..." />
      ) : (
        <View style={styles.mainBody}>
          {/* KPI Ring Gauge Cards Row */}
          <View style={styles.gaugeRow}>
            {/* Total Leads Card (Purple Theme) */}
            <CircularGaugeCard
              topText={`Total Leads: ${totalLeadsCount}`}
              value={totalLeadsCount}
              label="Total Leads"
              accentColor={colors.purpleLight}
              glowColor="rgba(139, 92, 246, 0.4)"
              cardBg="#161329"
              borderColor="#34255d"
              onPress={() => navigation.navigate('Leads')}
            />

            {/* Converted Card (Gold Theme) */}
            <CircularGaugeCard
              topText={`Converted: ${convertedCount}`}
              value={convertedCount}
              label="Converted"
              accentColor={colors.goldLight}
              glowColor="rgba(245, 158, 11, 0.4)"
              cardBg="#1d1912"
              borderColor="#4a3e20"
              onPress={() => navigation.navigate('Leads')}
            />
          </View>

          {/* Due Followups Notification Banner */}
          {dueFollowups && dueFollowups.due_count > 0 && (
            <TouchableOpacity
              style={[styles.dueBanner]}
              onPress={() => navigation.navigate('FollowupCalls')}
              activeOpacity={0.85}
            >
              <AppText style={styles.dueBannerIcon}>📅</AppText>
              <View style={styles.bannerTextCol}>
                <AppText variant="title" bold color={colors.purpleLight}>
                  {dueFollowups.due_count} Scheduled Follow-up{dueFollowups.due_count > 1 ? 's' : ''} Due
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Tap to execute scheduled call queue
                </AppText>
              </View>
              <AppText variant="title" color={colors.purpleLight}>➔</AppText>
            </TouchableOpacity>
          )}

          {/* REQUIREMENT 1: Critical Escalations Alert Banner (ONLY SHOWN WHEN activeEscalationsCount > 0) */}
          {activeEscalationsCount > 0 && (
            <TouchableOpacity
              style={styles.escalationBanner}
              onPress={() => navigation.navigate('Escalations')}
              activeOpacity={0.85}
            >
              <View style={styles.escalationLeft}>
                <View style={styles.alertIconBg}>
                  <AppText style={styles.alertWarningIcon}>⚠️</AppText>
                </View>
                <View style={styles.alertTextWrap}>
                  <AppText style={styles.alertTitleText}>
                    {activeEscalationsCount} Critical Escalation{activeEscalationsCount > 1 ? 's' : ''}
                  </AppText>
                  <AppText style={styles.alertSubText}>Need Action</AppText>
                </View>
              </View>

              <View style={styles.reviewBtn}>
                <AppText style={styles.reviewBtnText}>Review Now →</AppText>
              </View>
            </TouchableOpacity>
          )}

          {/* Quick Actions Grid */}
          <AppText variant="subtitle" bold style={styles.sectionHeader}>
            Quick Actions
          </AppText>
          <View style={styles.quickGrid}>
            {/* Tile 1: Add Lead */}
            <TouchableOpacity
              style={styles.quickTile}
              activeOpacity={0.8}
              onPress={() => setIsAddModalOpen(true)}
            >
              <View style={styles.quickIconBox}>
                <AppText style={styles.quickIconText}>＋</AppText>
              </View>
              <AppText style={styles.quickTileLabel}>Add Lead</AppText>
            </TouchableOpacity>

            {/* Tile 2: Reassign Lead */}
            <TouchableOpacity
              style={styles.quickTile}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Leads')}
            >
              <View style={styles.quickIconBox}>
                <AppText style={styles.quickIconText}>👤</AppText>
              </View>
              <AppText style={styles.quickTileLabel}>Reassign Lead</AppText>
            </TouchableOpacity>

            {/* Tile 3: WhatsApp Alert */}
            <TouchableOpacity
              style={styles.quickTile}
              activeOpacity={0.8}
              onPress={handleWhatsAppAlert}
            >
              <View style={styles.quickIconBox}>
                <AppText style={styles.quickIconText}>💬</AppText>
              </View>
              <AppText style={styles.quickTileLabel}>WhatsApp Alert</AppText>
            </TouchableOpacity>
          </View>

          {/* Lead Sources Breakdown Section */}
          {metrics?.sources_breakdown?.length > 0 && (
            <View style={styles.sourcesSection}>
              <AppText variant="subtitle" bold style={styles.sectionHeader}>
                Lead Channels & Sources
              </AppText>
              <AppCard elevated style={styles.sourcesCard}>
                {metrics.sources_breakdown.map((s: any) => (
                  <View key={s.source} style={styles.sourceRow}>
                    <AppText variant="caption" color={colors.textSecondary} style={styles.sourceLabel}>
                      {s.source_display}
                    </AppText>
                    <View style={styles.sourceBar}>
                      <View
                        style={[
                          styles.sourceBarFill,
                          { width: `${s.percentage}%`, backgroundColor: colors.purpleLight },
                        ]}
                      />
                    </View>
                    <AppText variant="caption" bold style={styles.sourceCount}>
                      {s.count}
                    </AppText>
                  </View>
                ))}
              </AppCard>
            </View>
          )}
        </View>
      )}

      {/* Add Lead Modal */}
      <AddLeadModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadAdded={() => {
          setIsAddModalOpen(false);
          fetchMetrics();
        }}
      />

      {/* REQUIREMENT 2: Notifications & Audit Trail Modal */}
      <NotificationModal
        visible={isNotifModalOpen}
        notifications={notificationsList}
        onClose={() => setIsNotifModalOpen(false)}
        onMarkAllAsRead={markAllNotificationsRead}
        onSelectNotification={(item) => {
          setIsNotifModalOpen(false);
          if (item.type === 'escalation') {
            navigation.navigate('Escalations');
          } else {
            navigation.navigate('Leads');
          }
        }}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  logoCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#161421',
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  logoInner: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  crownEmoji: {
    fontSize: 18,
    position: 'absolute',
    top: -12,
  },
  logoLetter: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.goldLight,
    marginTop: 4,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 20,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.red,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  greetingContainer: {
    marginBottom: spacing.md,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  greetingSub: {
    fontSize: 22,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.goldLight,
  },
  filterRow: {
    marginBottom: spacing.lg,
    flexGrow: 0,
  },
  filterContent: {
    paddingRight: spacing.xl,
    alignItems: 'center',
  },
  mainBody: {
    gap: spacing.lg,
  },
  gaugeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.purpleSurface,
    borderColor: colors.purpleLight,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dueBannerIcon: {
    fontSize: 24,
  },
  bannerTextCol: {
    flex: 1,
  },
  escalationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1913',
    borderWidth: 1.2,
    borderColor: '#785a21',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  escalationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  alertIconBg: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertWarningIcon: {
    fontSize: 20,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  alertSubText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  reviewBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: colors.goldLight + '88',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  reviewBtnText: {
    color: colors.goldLight,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  quickTile: {
    flex: 1,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs + 2,
  },
  quickIconText: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  quickTileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sourcesSection: {
    marginTop: spacing.xs,
  },
  sourcesCard: {
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  sourceLabel: {
    width: 90,
  },
  sourceBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xs,
    overflow: 'hidden',
  },
  sourceBarFill: {
    height: '100%',
    borderRadius: radius.xs,
  },
  sourceCount: {
    width: 32,
    textAlign: 'right',
  },
  activitySection: {
    marginTop: spacing.xs,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityItem: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  activityDot: {
    fontSize: 12,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityGuest: {
    marginTop: 2,
  },
});
