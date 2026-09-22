import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '../theme';

export interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  active,
  onPress,
  count,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active ? styles.activeChip : styles.inactiveChip,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <AppText
        variant="caption"
        bold
        color={active ? colors.textPrimary : colors.textSecondary}
      >
        {label} {count !== undefined ? `(${count})` : ''}
      </AppText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  activeChip: {
    backgroundColor: colors.purple,
    borderColor: colors.purpleLight,
  },
  inactiveChip: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
});
