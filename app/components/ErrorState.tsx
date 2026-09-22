import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { colors, spacing } from '../theme';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load data. Please try again.',
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <AppText style={styles.icon}>⚠️</AppText>
      <AppText variant="subtitle" color={colors.redLight} align="center" style={styles.message}>
        {message}
      </AppText>
      {onRetry ? (
        <AppButton title="Retry" onPress={onRetry} variant="outline" size="sm" fullWidth={false} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    backgroundColor: colors.redSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.redDim,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  icon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  message: {
    marginBottom: spacing.md,
  },
});
