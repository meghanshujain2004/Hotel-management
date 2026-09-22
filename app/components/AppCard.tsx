import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacityProps,
} from 'react-native';
import { colors, radius, spacing, shadows } from '../theme';

export interface AppCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  elevated?: boolean;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  elevated = false,
  accentColor,
  style,
  onPress,
  ...rest
}) => {
  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    elevated ? styles.elevated : styles.surface,
    accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : undefined,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  surface: {
    backgroundColor: colors.surfaceCard,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    ...shadows.sm,
  },
});
