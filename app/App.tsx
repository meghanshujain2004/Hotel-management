import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { api, UserProfile } from './api';
import { colors, radius, spacing } from './theme';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { EscalationsScreen } from './screens/EscalationsScreen';
import { LeadsScreen } from './screens/LeadsScreen';
import { TeamScreen } from './screens/TeamScreen';
import { CallingScreen } from './screens/CallingScreen';
import { MyCallsScreen } from './screens/MyCallsScreen';
import { FollowupCallsScreen } from './screens/FollowupCallsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AppText } from './components/AppText';
import { SplashScreen } from './components/SplashScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Leads: '📋',
  FollowupCalls: '📅',
  MyCalls: '📋',
  Escalations: '🚨',
  Team: '👥',
  Calling: '📞',
  Settings: '⚙️',
};

function renderTabIcon(routeName: string, focused: boolean) {
  const icon = TAB_ICONS[routeName] || '📌';
  return (
    <View style={styles.tabIconWrapper}>
      {focused && <View style={styles.tabActiveTopBar} />}
      <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
        <AppText style={[styles.tabIconText, focused && styles.tabIconTextActive]}>
          {icon}
        </AppText>
        {routeName === 'Escalations' && (
          <View style={styles.tabBadge}>
            <AppText style={styles.tabBadgeText}>3</AppText>
          </View>
        )}
      </View>
    </View>
  );
}

function AdminManagerTabs({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.goldLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => renderTabIcon(route.name, focused),
      })}
    >
      <Tab.Screen name="Home" options={{ tabBarLabel: 'Home' }}>
        {(props) => <HomeScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Leads" options={{ tabBarLabel: 'Leads' }}>
        {(props) => <LeadsScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="FollowupCalls" options={{ tabBarLabel: 'Follow-ups' }}>
        {(props) => <FollowupCallsScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Escalations" options={{ tabBarLabel: 'Escalations' }}>
        {(props) => <EscalationsScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Team" options={{ tabBarLabel: 'Team' }}>
        {(props) => <TeamScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Settings" options={{ tabBarLabel: 'Settings' }}>
        {(props) => <SettingsScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function SupportTabs({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.goldLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => renderTabIcon(route.name, focused),
      })}
    >
      <Tab.Screen name="Calling" options={{ tabBarLabel: 'Queue' }}>
        {(props) => <CallingScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="FollowupCalls" options={{ tabBarLabel: 'Follow-ups' }}>
        {(props) => <FollowupCallsScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="MyCalls" options={{ tabBarLabel: 'My Calls' }}>
        {(props) => <MyCallsScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Settings" options={{ tabBarLabel: 'Settings' }}>
        {(props) => <SettingsScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    api.getSavedUser().then((savedUser) => {
      const elapsed = Date.now() - startTime;
      const minDelay = 2000; // ensure splash animation is cleanly visible
      const remaining = Math.max(0, minDelay - elapsed);

      setTimeout(() => {
        if (savedUser && savedUser.id) {
          setUser(savedUser as UserProfile);
        }
        setLoading(false);
      }, remaining);
    });
  }, []);

  const handleLogout = async () => {
    await api.clearAuth();
    setUser(null);
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: colors.purple,
            background: colors.bg,
            card: colors.surfaceCard,
            text: colors.textPrimary,
            border: colors.border,
            notification: colors.red,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium: { fontFamily: 'System', fontWeight: '500' },
            bold: { fontFamily: 'System', fontWeight: '700' },
            heavy: { fontFamily: 'System', fontWeight: '800' },
          },
        }}
      >
        {!user ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login">
              {() => <LoginScreen onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />}
            </Stack.Screen>
          </Stack.Navigator>
        ) : user.role === 'support' ? (
          <SupportTabs user={user} onLogout={handleLogout} />
        ) : (
          <AdminManagerTabs user={user} onLogout={handleLogout} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: colors.surfaceCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 68,
    paddingBottom: spacing.xs + 2,
    paddingTop: spacing.xs + 2,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  tabActiveTopBar: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 3,
    backgroundColor: colors.goldLight,
    borderRadius: radius.pill,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  tabIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainerActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  tabIconText: {
    fontSize: 18,
  },
  tabIconTextActive: {
    fontSize: 20,
  },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: colors.red,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surfaceCard,
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
});
