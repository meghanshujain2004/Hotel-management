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
  onClose: () => void;
  onLeadAdded: () => void;
}

const SOURCES = [
  { key: 'manual', label: '✏️ Manual' },
  { key: 'website', label: '🌐 Website' },
  { key: 'instagram', label: '📸 Instagram' },
  { key: 'whatsapp', label: '💬 WhatsApp' },
  { key: 'facebook', label: '📘 Facebook' },
];

const PRIORITIES = [
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: '🔥 High' },
  { key: 'urgent', label: '🚨 Urgent' },
];

const STATUSES = [
  { key: 'new', label: '🆕 New' },
  { key: 'contacted', label: '📞 Contacted' },
  { key: 'interested', label: '🌟 Interested' },
  { key: 'awaiting_followup', label: '⏰ Awaiting F/U' },
];

export const AddLeadModal: React.FC<Props> = ({ visible, onClose, onLeadAdded }) => {
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('manual');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('new');
  const [inquiryDetails, setInquiryDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!guestName.trim() || !phone.trim()) {
      Alert.alert('Required Fields', 'Guest Name and Phone Number are required.');
      return;
    }

    setLoading(true);
    try {
      await api.createLead({
        guest_name: guestName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        source,
        priority,
        status,
        inquiry_details: inquiryDetails.trim() || undefined,
      });

      Alert.alert('Success', `Lead for "${guestName}" created successfully!`);
      setGuestName('');
      setPhone('');
      setEmail('');
      setSource('manual');
      setPriority('medium');
      setStatus('new');
      setInquiryDetails('');
      onLeadAdded();
      onClose();
    } catch (e: any) {
      Alert.alert('Failed to Create Lead', e.message || 'Please check the entered lead details.');
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
            <AppText variant="h2">Add New Lead</AppText>
            <AppText variant="subtitle" color={colors.purpleLight}>
              Enter guest details manually
            </AppText>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <AppText variant="subtitle" color={colors.textSecondary}>✕</AppText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <AppInput
            label="GUEST NAME *"
            value={guestName}
            onChangeText={setGuestName}
            placeholder="e.g. Ramesh Kumar"
          />

          <AppInput
            label="PHONE NUMBER *"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
          />

          <AppInput
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. ramesh@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Source Chips */}
          <View style={styles.chipGroup}>
            <AppText variant="label" style={styles.chipGroupLabel}>
              LEAD SOURCE
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {SOURCES.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  active={source === s.key}
                  onPress={() => setSource(s.key)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Priority Chips */}
          <View style={styles.chipGroup}>
            <AppText variant="label" style={styles.chipGroupLabel}>
              PRIORITY LEVEL
            </AppText>
            <View style={styles.chipsRow}>
              {PRIORITIES.map((p) => (
                <Chip
                  key={p.key}
                  label={p.label}
                  active={priority === p.key}
                  onPress={() => setPriority(p.key)}
                />
              ))}
            </View>
          </View>

          {/* Initial Status Chips */}
          <View style={styles.chipGroup}>
            <AppText variant="label" style={styles.chipGroupLabel}>
              INITIAL LEAD STATUS
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {STATUSES.map((st) => (
                <Chip
                  key={st.key}
                  label={st.label}
                  active={status === st.key}
                  onPress={() => setStatus(st.key)}
                />
              ))}
            </ScrollView>
          </View>

          <AppInput
            label="INQUIRY DETAILS / NOTES"
            value={inquiryDetails}
            onChangeText={setInquiryDetails}
            placeholder="Room preference, dates, budget, etc."
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </ScrollView>

        {/* CTA Footer */}
        <View style={styles.footer}>
          <AppButton
            title="Create Lead ➔"
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
  chipGroup: {
    marginBottom: spacing.lg,
  },
  chipGroupLabel: {
    marginBottom: spacing.xs + 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
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
