import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
  statusText?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  statusText = 'Loading hotel services...',
}) => {
  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  // Loading status text cycle
  const [currentStepText, setCurrentStepText] = useState(statusText);
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    // 1. Initial entrance animations (Fade + Scale)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous ambient pulse & glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Progress bar animation & simulated loading steps
    const stepInterval = setInterval(() => {
      // update text periodically
    }, 600);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
      easing: Easing.out(Easing.quad),
    }).start();

    const progressListener = progressAnim.addListener(({ value }) => {
      const pct = Math.round(value * 100);
      setProgressPercent(pct);

      if (pct < 35) {
        setCurrentStepText('Initializing CRM engine...');
      } else if (pct < 75) {
        setCurrentStepText('Securing encrypted session...');
      } else if (pct < 100) {
        setCurrentStepText('Preparing workspace...');
      } else {
        setCurrentStepText('Ready!');
      }
    });

    return () => {
      clearInterval(stepInterval);
      progressAnim.removeListener(progressListener);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Background Decorative Ambient Glow Orbs */}
      <Animated.View
        style={[
          styles.glowOrbTop,
          {
            transform: [{ scale: pulseAnim }],
            opacity: glowAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrbBottom,
          {
            transform: [{ scale: pulseAnim }],
            opacity: glowAnim,
          },
        ]}
      />

      {/* Content Container */}
      <View style={styles.centerContent}>
        {/* Animated Brand Emblem / Icon */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: glowAnim,
              },
            ]}
          />
          <View style={styles.iconContainer}>
            <AppText style={styles.iconCrown}>👑</AppText>
          </View>
        </Animated.View>

        {/* Brand Titles */}
        <Animated.View style={[styles.textGroup, { opacity: textFadeAnim }]}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeLine} />
            <AppText style={styles.badgeText}>LUXURY HOSPITALITY CRM</AppText>
            <View style={styles.badgeLine} />
          </View>

          <AppText variant="display" align="center" style={styles.mainTitle}>
            HotelCRM
          </AppText>

          <AppText variant="subtitle" color={colors.purpleLight} align="center" style={styles.subTitle}>
            Lead & SLA Escalation Suite
          </AppText>

          <AppText variant="caption" color={colors.textMuted} align="center" style={styles.desc}>
            Enterprise Hotel Operations Management
          </AppText>
        </Animated.View>
      </View>

      {/* Bottom Progress & Footer */}
      <Animated.View style={[styles.footerContainer, { opacity: textFadeAnim }]}>
        <View style={styles.statusRow}>
          <AppText variant="caption" color={colors.textSecondary} style={styles.statusText}>
            {currentStepText}
          </AppText>
          <AppText variant="caption" color={colors.goldLight} style={styles.percentText}>
            {progressPercent}%
          </AppText>
        </View>

        {/* Progress Track */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>

        {/* Feature Dots / Version */}
        <View style={styles.metaRow}>
          <View style={styles.dot} />
          <AppText variant="caption" color={colors.textMuted} style={styles.versionText}>
            v1.0.0 • Enterprise Edition
          </AppText>
          <View style={styles.dot} />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl + 20,
    paddingHorizontal: spacing.xl,
  },
  glowOrbTop: {
    position: 'absolute',
    top: -100,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.purpleGlow,
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.goldSurface,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: colors.gold + '66',
    backgroundColor: colors.purpleGlow,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gold,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  iconCrown: {
    fontSize: 48,
  },
  textGroup: {
    alignItems: 'center',
    width: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeLine: {
    width: 24,
    height: 1,
    backgroundColor: colors.purpleLight + '44',
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '700',
    color: colors.goldLight,
    marginHorizontal: spacing.xs,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  desc: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  footerContainer: {
    width: width * 0.82,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.purpleLight,
    borderRadius: radius.pill,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.purpleLight,
    opacity: 0.5,
  },
  versionText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
