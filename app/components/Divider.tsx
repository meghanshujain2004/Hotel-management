import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

export interface DividerProps {
  marginVertical?: number;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  marginVertical = spacing.md,
  style,
}) => {
  return <View style={[styles.divider, { marginVertical }, style]} />;
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    width: '100%',
  },
});
