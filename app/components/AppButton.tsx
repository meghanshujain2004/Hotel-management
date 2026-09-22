import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  disabled,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const containerStyles: StyleProp<ViewStyle> = [
    styles.baseContainer,
    styles[`${size}Container`],
    styles[`${variant}Container`],
    fullWidth ? styles.fullWidth : styles.autoWidth,
    isDisabled ? styles.disabledContainer : undefined,
    style,
  ];

  const textVariant = size === 'sm' ? 'caption' : size === 'lg' ? 'button' : 'bodyLarge';
  const textColor = getTextColor(variant, isDisabled);

  return (
    <TouchableOpacity
      style={containerStyles}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.leftIconWrapper}>{leftIcon}</View> : null}
          <AppText variant={textVariant} bold color={textColor}>
            {title}
          </AppText>
          {rightIcon ? <View style={styles.rightIconWrapper}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const getTextColor = (variant: ButtonVariant, disabled?: boolean): string => {
  if (disabled) return colors.textDisabled;
  switch (variant) {
    case 'primary':
    case 'danger':
    case 'success':
      return colors.textPrimary;
    case 'secondary':
      return colors.purpleLight;
    case 'outline':
      return colors.purpleLight;
    case 'ghost':
      return colors.textSecondary;
    default:
      return colors.textPrimary;
  }
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  autoWidth: {
    alignSelf: 'flex-start',
  },
  smContainer: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  mdContainer: {
    paddingVertical: spacing.md - 1,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  lgContainer: {
    paddingVertical: spacing.lg - 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  primaryContainer: {
    backgroundColor: colors.purple,
  },
  secondaryContainer: {
    backgroundColor: colors.purpleSurface,
    borderWidth: 1,
    borderColor: colors.purpleDark,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  dangerContainer: {
    backgroundColor: colors.red,
  },
  successContainer: {
    backgroundColor: colors.green,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconWrapper: {
    marginRight: spacing.sm,
  },
  rightIconWrapper: {
    marginLeft: spacing.sm,
  },
});
