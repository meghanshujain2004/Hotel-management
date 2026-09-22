import React, { useEffect, useState } from 'react';
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
import { api, Lead, UserProfile } from '../api';
import { AppText } from './AppText';
import { AppInput } from './AppInput';
import { AppButton } from './AppButton';
import { AppBadge } from './AppBadge';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';

interface Props {
  visible: boolean;
  lead: Lead | null;
  currentUserRole: string;
  onClose: () => void;
  onReassigned: () => void;
}

export const ReassignModal: React.FC<Props> = ({
  visible,
  lead,
  currentUserRole,
  onClose,
  onReassigned,
}) => {
  const [staffUsers, setStaffUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && lead) {
      setLoading(true);
      api
        .getStaffUsers()
        .then((users) => {
          // If manager, filter to support only. If admin, allow manager and support
          if (currentUserRole === 'manager') {
            setStaffUsers(users.filter((u) => u.role === 'support'));
          } else {
            setStaffUsers(users.filter((u) => u.role === 'support' || u.role === 'manager'));
          }
        })
        .catch(() => setStaffUsers([]))
        .finally(() => setLoading(false));
    }
  }, [visible, lead, currentUserRole]);

  const handleReassign = async () => {
    if (!lead || !selectedUserId) {
      Alert.alert('Selection Required', 'Please select a staff member to assign this lead to.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.reassignLead(lead.id, selectedUserId, notes.trim());
      Alert.alert('Lead Reassigned', res.message || 'Lead assigned successfully!');
      setSelectedUserId(null);
      setNotes('');
      onReassigned();
      onClose();
    } catch (e: any) {
      Alert.alert('Reassignment Failed', e.message || 'Failed to reassign lead.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppText variant="h2">Assign Lead</AppText>
            <AppText variant="subtitle" color={colors.purpleLight}>
              {lead.guest_name} (+91 {lead.phone})
            </AppText>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <AppText variant="subtitle" color={colors.textSecondary}>✕</AppText>
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingState message="Loading eligible staff members..." />
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <AppText variant="label" style={styles.sectionLabel}>
              SELECT STAFF MEMBER TO ASSIGN
            </AppText>

            {staffUsers.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No Eligible Staff Found"
                description="Please create staff members first in the Team tab."
              />
            ) : (
              staffUsers.map((u) => {
                const isSelected = selectedUserId === u.id;
                const isManagerRole = u.role === 'manager';
                const roleBadgeColor = isManagerRole ? colors.gold : colors.green;

                return (
                  <TouchableOpacity
                    key={u.id}
                    style={[
                      styles.staffOption,
                      isSelected && { borderColor: colors.purple, backgroundColor: colors.purpleSurface },
                    ]}
                    onPress={() => setSelectedUserId(u.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[styles.avatar, { backgroundColor: roleBadgeColor + '22' }]}>
                        <AppText variant="subtitle" bold color={roleBadgeColor}>
                          {u.username[0].toUpperCase()}
                        </AppText>
                      </View>
                      <View style={styles.staffMeta}>
                        <AppText variant="title" bold color={isSelected ? colors.purpleLight : colors.textPrimary}>
                          {u.username}
                        </AppText>
                        <AppText variant="caption" color={colors.textMuted}>
                          {u.email || u.phone || 'Staff User'}
                        </AppText>
                      </View>
                    </View>

                    <AppBadge
                      label={isManagerRole ? 'Manager' : 'Support'}
                      color={roleBadgeColor}
                      size="sm"
                    />
                  </TouchableOpacity>
                );
              })
            )}

            {staffUsers.length > 0 && (
              <AppInput
                label="REASSIGNMENT REASON / NOTES (OPTIONAL)"
                value={notes}
                onChangeText={setNotes}
                placeholder="Why is this lead being reassigned?"
                multiline
                numberOfLines={2}
                style={styles.textArea}
              />
            )}
          </ScrollView>
        )}

        {/* CTA Footer */}
        {staffUsers.length > 0 && (
          <View style={styles.footer}>
            <AppButton
              title="Confirm Reassignment ➔"
              onPress={handleReassign}
              disabled={!selectedUserId || submitting}
              loading={submitting}
              variant="primary"
              size="lg"
            />
          </View>
        )}
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
  sectionLabel: {
    marginBottom: spacing.md,
  },
  staffOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  staffMeta: {
    flex: 1,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: spacing.sm,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
