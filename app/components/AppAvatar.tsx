import React from 'react';
import { View, StyleSheet, Image, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '../theme';

export interface AppAvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
  role?: string;
  gender?: 'male' | 'female' | string;
  style?: ViewStyle;
}

export const AppAvatar: React.FC<AppAvatarProps> = ({
  name,
  uri,
  size = 44,
  role,
  gender = 'male',
  style,
}) => {
  const isFemale = gender?.toLowerCase() === 'female';
  const roleColor =
    role === 'admin' ? colors.gold : role === 'manager' ? colors.purpleLight : colors.green;

  // Gender specific default avatar illustration URLs
  const maleDpUri = 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png';
  const femaleDpUri = 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png';

  const avatarUri = uri || (isFemale ? femaleDpUri : maleDpUri);
  const emojiFallback = isFemale ? '👩‍💼' : '👨‍💼';

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.avatarPlaceholder,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isFemale ? '#3b1c32' : colors.surfaceElevated,
            borderColor: isFemale ? '#e056fd' : colors.purpleDark,
          },
        ]}
      >
        <AppText style={{ fontSize: size * 0.55 }}>
          {emojiFallback}
        </AppText>
      </View>

      {role ? (
        <View
          style={[
            styles.roleIndicator,
            {
              backgroundColor: roleColor,
              bottom: 0,
              right: 0,
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: (size * 0.3) / 2,
            },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.purpleDark,
    overflow: 'hidden',
  },
  roleIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.bg,
  },
});
