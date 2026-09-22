import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { AppCard } from './AppCard';
import { AppText } from './AppText';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}

export const KPICard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  accentColor = colors.purple,
  icon = '📊',
  style,
}) => {
  return (
    <AppCard accentColor={accentColor} elevated style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={[styles.iconBg, { backgroundColor: accentColor + '18', borderColor: accentColor + '33' }]}>
          <AppText style={styles.icon}>{icon}</AppText>
        </View>
        <View style={styles.content}>
          <AppText variant="label" color={colors.textSecondary}>
            {title}
          </AppText>
          <AppText variant="display" color={accentColor} style={styles.value}>
            {value}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color={colors.textMuted} style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md + 2,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subtitle: {
    marginTop: 2,
  },
});
