import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { radius, spacing } from '../theme';

export interface AppBadgeProps {
  label: string;
  color: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  label,
  color,
  size = 'md',
  style,
}) => {
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + '22',
          borderColor: color + '55',
          paddingHorizontal: isSm ? spacing.xs + 2 : spacing.sm + 2,
          paddingVertical: isSm ? 2 : spacing.xs,
        },
        style,
      ]}
    >
      <AppText
        variant={isSm ? 'caption' : 'label'}
        bold
        color={color}
        style={{ fontSize: isSm ? 10 : 11 }}
      >
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
