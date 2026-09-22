import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';
import { AppInput } from './AppInput';
import { AppButton } from './AppButton';
import { Chip } from './Chip';

const getPresetDate = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} 10:00`;
};

const DISPOSITIONS = [
  { key: 'interested', label: 'Interested', icon: '⭐', desc: 'Auto-sends: Brochure + 15% Booking Code', color: colors.gold },
  { key: 'awaiting_followup', label: 'Awaiting Follow-up', icon: '📅', desc: 'Auto-sends: Callback Confirmation', color: colors.purpleLight },
  { key: 'completed_followup', label: 'Completed Follow-up', icon: '✅', desc: 'Follow-up conversation concluded', color: colors.green },
  { key: 'registered', label: 'Registered / Converted', icon: '🏆', desc: 'Auto-sends: Booking Confirmation + Welcome', color: colors.green },
  { key: 'not_interested', label: 'Not Interested', icon: '👋', desc: 'Auto-sends: Polite Future Membership', color: colors.textMuted },
  { key: 'lost', label: 'Lost / Junk', icon: '❌', desc: 'Invalid number — no WhatsApp sent', color: colors.red },
];

interface Props {
  visible: boolean;
  leadId: number;
  guestName: string;
  callDuration: number;
  onClose: () => void;
  onSubmit: (data: {
    lead_id: number;
    disposition: string;
    call_duration_seconds: number;
    notes: string;
    followup_date_time?: string | null;
  }) => Promise<void>;
}

export const DispositionModal: React.FC<Props> = ({
  visible,
  leadId,
  guestName,
  callDuration,
  onClose,
  onSubmit,
}) => {
  const [selected, setSelected] = useState('');
  const [notes, setNotes] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await onSubmit({
        lead_id: leadId,
        disposition: selected,
        call_duration_seconds: callDuration,
        notes,
        followup_date_time: followupDate.trim() ? followupDate.trim() : null,
      });
      setSelected('');
      setNotes('');
      setFollowupDate('');
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(callDuration / 60);
  const seconds = callDuration % 60;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppText variant="h2">Post-Call Disposition</AppText>
            <AppText variant="subtitle" color={colors.purpleLight}>
              {guestName} · {minutes}m {seconds}s
            </AppText>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <AppText variant="subtitle" color={colors.textSecondary}>✕</AppText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <AppText variant="label" color={colors.textMuted} style={styles.sectionLabel}>
            SELECT CALL OUTCOME
          </AppText>

          {DISPOSITIONS.map((d) => {
            const isSelected = selected === d.key;
            return (
              <TouchableOpacity
                key={d.key}
                style={[
                  styles.dispositionOption,
                  isSelected && { borderColor: d.color, backgroundColor: d.color + '15' },
                ]}
                onPress={() => setSelected(d.key)}
                activeOpacity={0.8}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.iconBox, { backgroundColor: d.color + '20' }]}>
                    <AppText style={styles.optionIcon}>{d.icon}</AppText>
                  </View>
                  <View style={styles.optionTextWrapper}>
                    <AppText variant="title" bold color={isSelected ? d.color : colors.textPrimary}>
                      {d.label}
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {d.desc}
                    </AppText>
                  </View>
                </View>
                <View style={[styles.radio, isSelected && { backgroundColor: d.color, borderColor: d.color }]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}

          {selected ? (
            <View style={styles.followupBox}>
              <AppText variant="label" color={colors.purpleLight} style={styles.followupLabel}>
                📅 SCHEDULE FOLLOW-UP DATE & TIME (OPTIONAL)
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
                <Chip
                  label="Tomorrow (10 AM)"
                  active={followupDate === getPresetDate(1)}
                  onPress={() => setFollowupDate(getPresetDate(1))}
                />
                <Chip
                  label="+2 Days"
                  active={followupDate === getPresetDate(2)}
                  onPress={() => setFollowupDate(getPresetDate(2))}
                />
                <Chip
                  label="+3 Days"
                  active={followupDate === getPresetDate(3)}
                  onPress={() => setFollowupDate(getPresetDate(3))}
                />
                <Chip
                  label="Next Week"
                  active={followupDate === getPresetDate(7)}
                  onPress={() => setFollowupDate(getPresetDate(7))}
                />
              </ScrollView>
              <AppInput
                label="CUSTOM DATE & TIME"
                value={followupDate}
                onChangeText={setFollowupDate}
                placeholder="YYYY-MM-DD HH:MM (e.g. 2026-09-17 10:00)"
              />
            </View>
          ) : null}

          <AppInput
            label="CALL NOTES"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add detailed call notes..."
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </ScrollView>

        {/* Footer CTA */}
        <View style={styles.footer}>
          <AppButton
            title="Save Disposition & Next Lead ➔"
            onPress={handleSubmit}
            disabled={!selected || loading}
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
  sectionLabel: {
    marginBottom: spacing.md,
  },
  dispositionOption: {
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
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionIcon: {
    fontSize: 20,
  },
  optionTextWrapper: {
    flex: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textPrimary,
  },
  followupBox: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followupLabel: {
    marginBottom: spacing.xs + 2,
  },
  chipRow: {
    marginBottom: spacing.sm,
    flexGrow: 0,
  },
  chipContent: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
