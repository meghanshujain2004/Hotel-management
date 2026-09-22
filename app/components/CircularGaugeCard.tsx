import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';

interface CircularGaugeCardProps {
  topText: string;
  value: number | string;
  label: string;
  accentColor: string; // e.g. colors.purple or colors.gold
  glowColor: string;
  cardBg: string;
  borderColor: string;
  onPress?: () => void;
}

export const CircularGaugeCard: React.FC<CircularGaugeCardProps> = ({
  topText,
  value,
  label,
  accentColor,
  glowColor,
  cardBg,
  borderColor,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: borderColor,
          shadowColor: glowColor,
        },
      ]}
    >
      {/* Top subtitle */}
      <AppText variant="caption" color={colors.textSecondary} style={styles.topText}>
        {topText}
      </AppText>

      {/* Ring & Value Container */}
      <View style={styles.ringWrapper}>
        <View
          style={[
            styles.outerGlowRing,
            {
              borderColor: glowColor,
              shadowColor: accentColor,
            },
          ]}
        >
          <View
            style={[
              styles.innerRing,
              {
                borderColor: accentColor,
              },
            ]}
          >
            <AppText style={styles.valueText}>{value}</AppText>
          </View>
        </View>
      </View>

      {/* Bottom Label */}
      <AppText variant="caption" color={colors.textSecondary} style={styles.bottomLabel}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 185,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  topText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  ringWrapper: {
    marginVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlowRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  innerRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bottomLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
