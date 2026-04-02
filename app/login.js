import {
  FontAwesome
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView, StyleSheet, Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import {
  signInWithGoogle
} from '@/lib/util/authUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';



const logoImage = require('../public/icons/icon-512-transparent.png');

export default function LoginScreen() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [errors, setErrors] = useState({
    general: '',
  });
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const setGeneralError = (message) => {
    setErrors((prev) => ({ ...prev, general: message }));
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle({
      refreshAuth,
      router,
      setLoading: setIsGoogleSigningIn,
      setErrorMessage: setGeneralError,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[colors.primary[50], colors.primary[100]]} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Card style={styles.card}>
              <View style={styles.brandSection}>
                <View style={styles.logoWrap}>
                  <Image source={logoImage} style={styles.logo} resizeMode="contain" />
                </View>
                <Text style={styles.brandTitle}>티업링크</Text>
                <Text style={styles.brandSubtitle}>골프 모임을 더 쉽고 즐겁게</Text>
              </View>

              {errors.general ? (
                <Text style={styles.generalError}>{errors.general}</Text>
              ) : null}

              <Button
                variant="primary"
                size="lg"
                onPress={handleGoogleSignIn}
                loading={isGoogleSigningIn}
                disabled={isGoogleSigningIn}
                style={styles.buttonSpacing}
              >
                <FontAwesome name="google" size={16} color={colors.white} style={styles.iconGap} />
                <Text style={styles.primaryButtonText}>Google로 로그인</Text>
              </Button>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaPrimary,
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.padding.md,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    paddingHorizontal: tokens.padding.xl,
    paddingVertical: tokens.padding.xl2,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg2,
  },
  logoWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm2,
  },
  logo: {
    width: 48,
    height: 48,
  },
  brandTitle: {
    fontSize: tokens.font.xxl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  brandSubtitle: {
    fontSize: tokens.font.md,
    color: colors.neutral[600],
  },
  pageTitle: {
    fontSize: tokens.font.display,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  pageSubtitle: {
    fontSize: tokens.font.md,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: tokens.spacing.md3,
  },
  generalError: {
    textAlign: 'center',
    color: colors.error[600],
    fontSize: tokens.font.sm,
    marginBottom: tokens.spacing.sm2,
  },
  buttonSpacing: {
    marginTop: tokens.spacing.md,
  },
  iconGap: {
    marginRight: tokens.spacing.xs2,
  },
  primaryButtonText: {
    fontSize: tokens.font.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.white,
  },
});
