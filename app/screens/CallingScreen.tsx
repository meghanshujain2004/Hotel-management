import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { api, Lead } from '../api';
import { AppScreen } from '../components/AppScreen';
import { AppText } from '../components/AppText';
import { AppCard } from '../components/AppCard';
import { AppBadge } from '../components/AppBadge';
import { AppButton } from '../components/AppButton';
import { DispositionModal } from '../components/DispositionModal';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

interface Props {
  user: any;
}

export const CallingScreen: React.FC<Props> = ({ user }) => {
  const [queueData, setQueueData] = useState<{
    active_lead: Lead | null;
    total_in_queue: number;
    reassigned_notice?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showDisposition, setShowDisposition] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartTimeRef = useRef<number | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const data = await api.getActiveQueue();
      setQueueData(data);
    } catch {
      Alert.alert('Error', 'Failed to load calling queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQueue();
  };

  const startCall = () => {
    const now = Date.now();
    callStartTimeRef.current = now;
    setCallActive(true);
    setCallDuration(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(elapsed);
      }
    }, 500);

    // Launch mobile native phone keypad with pre-filled guest number
    const activeLead = queueData?.active_lead;
    if (activeLead && activeLead.phone) {
      const cleanPhone = activeLead.phone.replace(/[^0-9+]/g, '');
      const telUrl = `tel:${cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`}`;
      Linking.openURL(telUrl).catch(() => {
        Alert.alert('Dialer Error', `Could not automatically launch phone dialer for ${cleanPhone}`);
      });
    }
  };

  const endCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (callStartTimeRef.current) {
      const finalDuration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      setCallDuration(finalDuration);
    }
    setCallActive(false);
    setShowDisposition(true);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleDispositionSubmit = async (data: any) => {
    const result = await api.submitDisposition(data);
    setShowDisposition(false);
    setCallDuration(0);
    setQueueData({
      active_lead: result.next_lead || null,
      total_in_queue: result.remaining_in_queue || 0,
    });
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const lead = queueData?.active_lead;

  return (
    <AppScreen scrollable refreshing={refreshing} onRefresh={onRefresh}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText variant="h1" bold>
            📞 Calling Workspace
          </AppText>
          <AppText variant="subtitle" color={colors.textSecondary}>
            Live Queue {queueData ? `(${queueData.total_in_queue} waiting)` : ''}
          </AppText>
        </View>
        <View style={styles.headerRight}>
          <AppButton
            title="🔄 Fetch Next"
            onPress={fetchQueue}
            loading={loading && !refreshing}
            variant="outline"
            size="sm"
            fullWidth={false}
          />
        </View>
      </View>

      {/* Reassignment notice */}
      {queueData?.reassigned_notice && (
        <AppCard elevated accentColor={colors.gold} style={styles.reassignNotice}>
          <AppText style={styles.reassignIcon}>↪️</AppText>
          <AppText variant="body" color={colors.goldLight} style={styles.reassignText}>
            {queueData.reassigned_notice}
          </AppText>
        </AppCard>
      )}

      {loading ? (
        <LoadingState message="Fetching active lead queue..." />
      ) : !lead ? (
        <View style={styles.centerFetchBox}>
          <EmptyState
            icon="🎉"
            title="All leads done!"
            description="There are currently no new pending leads in your calling queue."
            actionTitle="🔄 Fetch Next Lead"
            onAction={fetchQueue}
          />
        </View>
      ) : (
        <View style={styles.body}>
          {/* Prominent Center Fetch Next Lead Bar */}
          <AppCard elevated style={styles.centerFetchBar}>
            <View style={styles.centerFetchContent}>
              <View style={styles.centerFetchTextGroup}>
                <AppText variant="title" bold color={colors.purpleLight}>
                  Active Calling Queue
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {queueData?.total_in_queue || 0} leads pending in system
                </AppText>
              </View>
              <AppButton
                title="🔄 Fetch Next"
                onPress={fetchQueue}
                loading={loading && !refreshing}
                variant="primary"
                size="sm"
                fullWidth={false}
              />
            </View>
          </AppCard>
          {/* Guest profile card */}
          <AppCard elevated style={styles.guestCard}>
            <View style={styles.guestAvatarRow}>
              <View style={styles.guestAvatar}>
                <AppText variant="h2" bold color={colors.purpleLight}>
                  {lead.guest_name?.[0]?.toUpperCase()}
                </AppText>
              </View>
              <View style={styles.guestInfo}>
                <AppText variant="title" bold>
                  {lead.guest_name}
                </AppText>
                <AppText variant="subtitle" bold color={colors.purpleLight}>
                  +91 {lead.phone}
                </AppText>
                {lead.email && (
                  <AppText variant="caption" color={colors.textSecondary}>
                    {lead.email}
                  </AppText>
                )}
              </View>
              <AppBadge
                label={(lead.priority || 'NORMAL').toUpperCase()}
                color={
                  lead.priority === 'urgent'
                    ? colors.red
                    : lead.priority === 'high'
                    ? colors.gold
                    : colors.purpleLight
                }
                size="sm"
              />
            </View>

            {lead.inquiry_details && (
              <View style={styles.inquiryBox}>
                <AppText variant="label" color={colors.textMuted}>
                  💬 INQUIRY DETAILS
                </AppText>
                <AppText variant="body" color={colors.textPrimary} style={styles.inquiryText}>
                  {lead.inquiry_details}
                </AppText>
              </View>
            )}

            {/* Pipeline progress steps */}
            <View style={styles.pipelineRow}>
              {['new', 'contacted', 'interested', 'registered'].map((s, i) => (
                <View key={s} style={styles.pipelineStep}>
                  <View
                    style={[
                      styles.pipelineDot,
                      lead.status === s && styles.pipelineDotActive,
                    ]}
                  />
                  <AppText
                    variant="caption"
                    color={lead.status === s ? colors.purpleLight : colors.textMuted}
                    bold={lead.status === s}
                  >
                    {s}
                  </AppText>
                  {i < 3 && <View style={styles.pipelineConnector} />}
                </View>
              ))}
            </View>
          </AppCard>

          {/* Active Call Timer Card */}
          {callActive && (
            <AppCard elevated accentColor={colors.green} style={styles.timerCard}>
              <AppText variant="label" color={colors.greenLight} align="center">
                CALL IN PROGRESS
              </AppText>
              <AppText variant="display" color={colors.greenLight} align="center" style={styles.timer}>
                {formatDuration(callDuration)}
              </AppText>
              <View style={styles.timerDot} />
            </AppCard>
          )}

          {/* Escalation warning banner */}
          {lead.is_escalated && (
            <AppCard elevated accentColor={colors.red} style={styles.escalationWarning}>
              <AppText variant="subtitle" bold color={colors.redLight} align="center">
                🚨 ESCALATED · {lead.overdue_duration_display || 'SLA Breached'}
              </AppText>
            </AppCard>
          )}

          {/* Action CTAs */}
          <View style={styles.ctaRow}>
            {!callActive ? (
              <AppButton
                title="📞 Start Call"
                onPress={startCall}
                variant="success"
                size="lg"
              />
            ) : (
              <AppButton
                title="🔴 End Call & Dispose"
                onPress={endCall}
                variant="danger"
                size="lg"
              />
            )}
          </View>

          {/* Skip option */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => setShowDisposition(true)}
            disabled={callActive}
            activeOpacity={0.7}
          >
            <AppText variant="caption" color={colors.textMuted} align="center">
              Log Disposition Without Calling
            </AppText>
          </TouchableOpacity>

          {/* Previous activity note */}
          {lead.last_disposition_note ? (
            <AppCard elevated style={styles.lastActivity}>
              <AppText variant="label" color={colors.textMuted}>
                📌 LAST NOTE
              </AppText>
              <AppText variant="body" color={colors.textSecondary} style={styles.lastActivityText}>
                {lead.last_disposition_note}
              </AppText>
            </AppCard>
          ) : null}
        </View>
      )}

      {/* Disposition Modal */}
      {lead && (
        <DispositionModal
          visible={showDisposition}
          leadId={lead.id}
          guestName={lead.guest_name}
          callDuration={callDuration}
          onClose={() => setShowDisposition(false)}
          onSubmit={handleDispositionSubmit}
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
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerFetchBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  centerFetchBar: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.purpleDark,
    borderWidth: 1.5,
  },
  centerFetchContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerFetchTextGroup: {
    flex: 1,
    marginRight: spacing.md,
  },
  reassignNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  reassignIcon: {
    fontSize: 20,
  },
  reassignText: {
    flex: 1,
  },
  body: {
    paddingBottom: spacing.xxl,
  },
  guestCard: {
    marginBottom: spacing.lg,
  },
  guestAvatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  guestAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.purpleSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.purpleDark,
  },
  guestInfo: {
    flex: 1,
  },
  inquiryBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  inquiryText: {
    marginTop: 4,
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pipelineStep: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
  },
  pipelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    marginRight: 4,
  },
  pipelineDotActive: {
    backgroundColor: colors.purple,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pipelineConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  timerCard: {
    backgroundColor: colors.greenSurface,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  timer: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
    marginTop: spacing.sm,
  },
  escalationWarning: {
    backgroundColor: colors.redSurface,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  ctaRow: {
    marginBottom: spacing.md,
  },
  skipBtn: {
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  lastActivity: {
    padding: spacing.md,
  },
  lastActivityText: {
    marginTop: 4,
  },
});
