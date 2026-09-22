import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { api, UserProfile } from '../api';
import { AppText } from '../components/AppText';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { AppBadge } from '../components/AppBadge';

interface Props {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      const profile = await api.login(username.trim(), password);
      onLoginSuccess(profile as UserProfile);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Hero Top Branding */}
        <View style={styles.heroSection}>
          <View style={styles.crownContainer}>
            <AppText style={styles.crown}>👑</AppText>
          </View>
          <AppText variant="display" align="center" style={styles.heroTitle}>
            HotelCRM
          </AppText>
          <AppText variant="subtitle" color={colors.purpleLight} align="center" style={styles.heroSub}>
            Manage Your Hotel Leads Smarter
          </AppText>
          <AppText variant="caption" color={colors.textMuted} align="center" style={styles.heroDesc}>
            Enterprise CRM & SLA Escalations
          </AppText>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <AppText variant="h2" style={styles.cardTitle}>
            Welcome Back
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.cardSub}>
            Sign in to your account
          </AppText>

          <AppInput
            label="USERNAME"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<AppText style={styles.inputIcon}>👤</AppText>}
          />

          <AppInput
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            leftIcon={<AppText style={styles.inputIcon}>🔒</AppText>}
          />

          <AppButton
            title="Sign In →"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            size="lg"
            style={styles.loginBtn}
          />

          {/* Role pills */}
          <View style={styles.rolesRow}>
            <AppBadge label="Admin" color={colors.gold} size="sm" />
            <AppBadge label="Manager" color={colors.purpleLight} size="sm" />
            <AppBadge label="Support" color={colors.green} size="sm" />
          </View>
        </View>

        <AppText variant="caption" color={colors.textMuted} align="center" style={styles.footer}>
          HotelCRM v1.0 · Secured with JWT
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  crownContainer: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    backgroundColor: colors.goldSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gold + '44',
  },
  crown: {
    fontSize: 38,
  },
  heroTitle: {
    marginBottom: 2,
  },
  heroSub: {
    marginTop: spacing.xs,
  },
  heroDesc: {
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    marginBottom: spacing.xs,
  },
  cardSub: {
    marginBottom: spacing.xl,
  },
  inputIcon: {
    fontSize: 16,
  },
  loginBtn: {
    marginTop: spacing.sm,
  },
  rolesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  footer: {
    marginTop: spacing.xxl,
  },
});
