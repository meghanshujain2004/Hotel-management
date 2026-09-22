import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { colors, spacing } from '../theme';
import { api, UserProfile } from '../api';
import { AppScreen } from '../components/AppScreen';
import { AppText } from '../components/AppText';
import { AppCard } from '../components/AppCard';
import { AppAvatar } from '../components/AppAvatar';
import { AppBadge } from '../components/AppBadge';
import { AppButton } from '../components/AppButton';

interface Props {
  user: UserProfile;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<Props> = ({ user, onLogout }) => {
  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await api.clearAuth();
          onLogout();
        },
      },
    ]);
  };

  const ROLE_INFO: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrator', color: colors.gold },
    manager: { label: 'Sales Manager', color: colors.purpleLight },
    support: { label: 'Customer Support', color: colors.green },
  };

  const roleInfo = ROLE_INFO[user.role] || ROLE_INFO.support;

  return (
    <AppScreen scrollable>
      {/* Profile Card Header */}
      <View style={styles.profileHeader}>
        <AppAvatar name={user.username} role={user.role} gender={user.gender} size={84} style={styles.avatar} />
        <AppText variant="h1" bold align="center">
          {user.username}
        </AppText>
        {user.first_name || user.last_name ? (
          <AppText variant="subtitle" color={colors.textSecondary} align="center" style={styles.fullName}>
            {user.first_name} {user.last_name}
          </AppText>
        ) : null}
        <AppBadge label={roleInfo.label.toUpperCase()} color={roleInfo.color} style={styles.roleBadge} />
      </View>

      {/* Account Info Section */}
      <AppText variant="label" style={styles.sectionTitle}>
        ACCOUNT DETAILS
      </AppText>
      <AppCard elevated style={styles.infoCard}>
        <InfoRow icon="📧" label="Email" value={user.email || '—'} />
        <InfoRow icon="📱" label="Phone" value={user.phone || '—'} />
        <InfoRow
          icon="📅"
          label="Joined"
          value={user.date_joined ? new Date(user.date_joined).toLocaleDateString('en-IN') : '—'}
        />
        <InfoRow icon="✅" label="Status" value={user.is_active ? 'Active' : 'Inactive'} last />
      </AppCard>

      {/* App Information Section */}
      <AppText variant="label" style={styles.sectionTitle}>
        SYSTEM INFO
      </AppText>
      <AppCard elevated style={styles.infoCard}>
        <InfoRow icon="👑" label="App" value="HotelCRM Mobile" />
        <InfoRow icon="🔖" label="Version" value="1.0.0" last />
      </AppCard>

      {/* Sign Out CTA */}
      <AppButton
        title="🚪 Sign Out"
        onPress={handleLogout}
        variant="danger"
        size="lg"
        style={styles.logoutBtn}
      />
    </AppScreen>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View style={[styles.infoRow, last && styles.infoRowLast]}>
    <AppText style={styles.infoIcon}>{icon}</AppText>
    <AppText variant="body" color={colors.textSecondary} style={styles.infoLabel}>
      {label}
    </AppText>
    <AppText variant="body" bold align="right" style={styles.infoValue} numberOfLines={1}>
      {value}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  avatar: {
    marginBottom: spacing.md,
  },
  fullName: {
    marginTop: 2,
  },
  roleBadge: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  infoCard: {
    padding: 0,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIcon: {
    fontSize: 18,
    width: 32,
  },
  infoLabel: {
    width: 80,
  },
  infoValue: {
    flex: 1,
  },
  logoutBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
});
