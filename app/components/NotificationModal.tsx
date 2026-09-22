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
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { AppBadge } from './AppBadge';

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  createdAtMs: number;
  type: 'escalation' | 'activity' | 'system';
  isRead: boolean;
}

interface NotificationModalProps {
  visible: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onSelectNotification?: (item: NotificationItem) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  notifications,
  onClose,
  onMarkAllAsRead,
  onSelectNotification,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <AppText variant="h2" style={styles.title}>
                Notifications 🔔
              </AppText>
              {unreadCount > 0 ? (
                <AppBadge label={`${unreadCount} New`} color={colors.red} size="sm" />
              ) : (
                <AppBadge label="All Read" color={colors.green} size="sm" />
              )}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <AppText style={styles.closeText}>✕</AppText>
            </TouchableOpacity>
          </View>

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <AppText variant="caption" color={colors.textMuted}>
              Auto-clears read items older than 24h
            </AppText>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={onMarkAllAsRead} activeOpacity={0.7}>
                <AppText variant="caption" bold color={colors.goldLight}>
                  Mark All Read ✓
                </AppText>
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <ScrollView contentContainerStyle={styles.listContent}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <AppText style={styles.emptyIcon}>🎉</AppText>
                <AppText variant="title" bold style={styles.emptyTitle}>
                  No Notifications
                </AppText>
                <AppText variant="caption" color={colors.textMuted} align="center">
                  You are all caught up! New audit trails & escalations will appear here.
                </AppText>
              </View>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => onSelectNotification?.(item)}
                >
                  <AppCard
                    elevated
                    style={[
                      styles.card,
                      !item.isRead && styles.cardUnread,
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <AppText style={styles.typeIcon}>
                          {item.type === 'escalation' ? '🚨' : '📋'}
                        </AppText>
                        <AppText
                          variant="body"
                          bold
                          color={item.type === 'escalation' ? colors.redLight : colors.purpleLight}
                        >
                          {item.title}
                        </AppText>
                      </View>
                      {!item.isRead && (
                        <View style={styles.newDot}>
                          <AppText style={styles.newDotText}>NEW</AppText>
                        </View>
                      )}
                    </View>

                    <AppText variant="caption" color={colors.textSecondary} style={styles.cardSub}>
                      {item.subtitle}
                    </AppText>

                    <AppText variant="caption" color={colors.textMuted} style={styles.timestamp}>
                      {item.timestamp}
                    </AppText>
                  </AppCard>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <AppButton title="Done" onPress={onClose} variant="secondary" size="md" />
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContent: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    marginBottom: spacing.xs,
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cardUnread: {
    borderColor: colors.goldLight + '88',
    backgroundColor: colors.goldSurface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  typeIcon: {
    fontSize: 16,
  },
  newDot: {
    backgroundColor: colors.red,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  newDotText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  cardSub: {
    marginBottom: spacing.xs,
  },
  timestamp: {
    fontSize: 11,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
