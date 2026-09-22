import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { api } from '../api';
import { AppText } from './AppText';
import { AppInput } from './AppInput';
import { AppButton } from './AppButton';
import { Chip } from './Chip';

interface Props {
  visible: boolean;
  currentUserRole: 'admin' | 'manager' | 'support' | string;
  onClose: () => void;
  onStaffAdded: () => void;
}

export const AddStaffModal: React.FC<Props> = ({
  visible,
  currentUserRole,
  onClose,
  onStaffAdded,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'support' | 'manager'>('support');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);

  const canSelectRole = currentUserRole === 'admin';

  const handleCreate = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Username and Password are required.');
      return;
    }

    setLoading(true);
    try {
      await api.createStaff({
        username: username.trim(),
        password: password.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        role: canSelectRole ? role : 'support',
        gender,
      });
      Alert.alert('Success', `Staff member "${username}" created successfully!`);
      setUsername('');
      setPassword('');
      setEmail('');
      setPhone('');
      setRole('support');
      setGender('male');
      onStaffAdded();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create staff member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppText variant="h2">Add New Staff Member</AppText>
            <AppText variant="subtitle" color={colors.purpleLight}>
              {canSelectRole ? 'Create Manager or Support account' : 'Create Support Staff account'}
            </AppText>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <AppText variant="subtitle" color={colors.textSecondary}>✕</AppText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Role selector (Admin only) */}
          {canSelectRole ? (
            <View style={styles.roleSelectionGroup}>
              <AppText variant="label" style={styles.fieldLabel}>
                ASSIGN ROLE
              </AppText>
              <View style={styles.roleChipsRow}>
                <Chip
                  label="🎧 Support Staff"
                  active={role === 'support'}
                  onPress={() => setRole('support')}
                />
                <Chip
                  label="👔 Sales Manager"
                  active={role === 'manager'}
                  onPress={() => setRole('manager')}
                />
              </View>
            </View>
          ) : (
            <View style={styles.presetRoleBox}>
              <AppText variant="caption" color={colors.textMuted}>
                Role assigned: <AppText variant="caption" bold color={colors.greenLight}>Customer Support Staff</AppText>
              </AppText>
            </View>
          )}

          {/* Gender selection */}
          <View style={styles.roleSelectionGroup}>
            <AppText variant="label" style={styles.fieldLabel}>
              PROFILE DP / GENDER
            </AppText>
            <View style={styles.roleChipsRow}>
              <Chip
                label="👨‍💼 Male DP"
                active={gender === 'male'}
                onPress={() => setGender('male')}
              />
              <Chip
                label="👩‍💼 Female DP"
                active={gender === 'female'}
                onPress={() => setGender('female')}
              />
            </View>
          </View>

          <AppInput
            label="USERNAME *"
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. john_doe"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <AppInput
            label="PASSWORD *"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter temporary password"
            secureTextEntry
            autoCapitalize="none"
          />

          <AppInput
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. john@hotel.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AppInput
            label="PHONE NUMBER"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
          />
        </ScrollView>

        {/* CTA Footer */}
        <View style={styles.footer}>
          <AppButton
            title="Create Staff Account ➔"
            onPress={handleCreate}
            loading={loading}
            variant="primary"
            size="lg"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  roleSelectionGroup: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    marginBottom: spacing.xs + 2,
  },
  roleChipsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  presetRoleBox: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
