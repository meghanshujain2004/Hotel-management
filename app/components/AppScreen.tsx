import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { AppHeader, AppHeaderProps } from './AppHeader';

export interface AppScreenProps {
  children: React.ReactNode;
  headerProps?: AppHeaderProps;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
  paddingHorizontal?: number;
}

export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  headerProps,
  scrollable = false,
  style,
  contentContainerStyle,
  refreshing = false,
  onRefresh,
  paddingHorizontal = spacing.lg,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }, style]}>
      {headerProps ? <AppHeader {...headerProps} /> : null}

      {scrollable ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal, paddingBottom: insets.bottom + spacing.xxl },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.purple}
                colors={[colors.purple]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { paddingHorizontal, paddingBottom: insets.bottom }, contentContainerStyle]}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.sm,
  },
});
