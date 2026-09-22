import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { typography, TypographyVariant, colors } from '../theme';

export interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  bold?: boolean;
  style?: StyleProp<TextStyle>;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color,
  align,
  bold,
  style,
  children,
  ...rest
}) => {
  const baseStyle = typography[variant] || typography.body;

  return (
    <RNText
      style={[
        baseStyle,
        color ? { color } : undefined,
        align ? { textAlign: align } : undefined,
        bold ? { fontWeight: '700' } : undefined,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};
