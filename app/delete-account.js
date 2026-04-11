import { Link } from 'expo-router';
import Head from 'expo-router/head';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const APP_DISPLAY_NAME = '티업링크';
const APP_SHORT_NAME = 'TeeupLink';
const DEVELOPER_NAME = 'Pixencrew';
const SUPPORT_EMAIL = 'pixencrew@gmail.com';
const DELETE_ACCOUNT_PAGE_TITLE = '계정 및 데이터 삭제 요청 안내';

function Section({ title, children }) {
  return (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </Card>
  );
}

export default function DeleteAccountInfoScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      {Platform.OS === 'web' ? (
        <Head>
          <title>{`${APP_DISPLAY_NAME}`}</title>
          <meta
            name="description"
            content={`${APP_DISPLAY_NAME}(${APP_SHORT_NAME}) 계정 및 데이터 삭제 요청 방법, 삭제되는 데이터, 보관 데이터, 처리 기간 안내`}
          />
        </Head>
      ) : null}
      <ScreenHeader title={DELETE_ACCOUNT_PAGE_TITLE} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{DELETE_ACCOUNT_PAGE_TITLE}</Text>
          <Text style={styles.heroSubtitle}>
            본 페이지는 Google Play 정책에 따라, {APP_DISPLAY_NAME}({APP_SHORT_NAME}) 서비스에서 계정을 삭제하거나 삭제를 요청하는 방법과
            처리되는 데이터 범위를 안내합니다.
          </Text>
          <Text style={styles.metaLine}>
            앱 이름: {APP_DISPLAY_NAME} ({APP_SHORT_NAME})
          </Text>
          <Text style={styles.metaLine}>개발자(운영): {DEVELOPER_NAME}</Text>
          <View style={styles.emailCalloutBox}>
            <Text style={styles.emailCalloutTitle}>공식 문의·삭제 요청 이메일 (필수 이용)</Text>
            <Text style={styles.emailCalloutAddress}>{SUPPORT_EMAIL}</Text>
            <Text style={styles.emailCalloutBody}>
              계정·데이터 삭제 요청과 이 안내 페이지에 관한 문의는 반드시 위 주소로만 보내 주세요. 위 메일로 접수해 주시면 본인 확인 후 순차적으로 안내드립니다.
            </Text>
          </View>
        </View>

        <Section title="1. 앱에서 직접 탈퇴 (로그인 상태)">
          <Text style={styles.p}>
            로그인한 상태에서 아래 경로로 이동한 뒤, 안내에 따라 탈퇴를 완료할 수 있습니다.
          </Text>
          <Text style={styles.ol}>① 하단 탭에서 「마이페이지」를 선택합니다.</Text>
          <Text style={styles.ol}>② 「회원정보 수정」으로 이동합니다.</Text>
          <Text style={styles.ol}>③ 「회원 탈퇴」를 선택하고, 확인 절차를 진행합니다.</Text>
          <Text style={styles.note}>
            탈퇴가 완료되면 해당 계정으로는 더 이상 로그인할 수 없으며, 앱 내 개인화 기능을 이용할 수 없습니다. 로그인 후 탈퇴는 이 경로(회원정보 수정의 탈퇴)로만 진행합니다.
          </Text>
        </Section>

        <Section title="2. 외부를 통한 삭제 요청 (이메일 등)">
          <Text style={styles.p}>
            <Text style={styles.bold}>
              외부 경로로 삭제·데이터 정리를 요청하시는 경우, 문의는 반드시 공식 이메일 {SUPPORT_EMAIL}로만 보내 주시기 바랍니다.
            </Text>
          </Text>
          <Text style={styles.p}>
            앱에 로그인할 수 없거나, 로그인한 상태에서라도 앱 내 「회원 탈퇴」가 아닌 경우에 해당하면 위 주소로 메일을 보내 주시거나, Google Play 콘솔에 등록된 개발자 연락처를 통해서도 요청하실 수 있습니다.
          </Text>
          <Text style={styles.p}>
            메일을 보내실 때는 <Text style={styles.bold}>가입에 사용한 이메일 주소</Text>와{' '}
            <Text style={styles.bold}>삭제를 원한다는 취지</Text>를 본문에 분명히 적어 주시면 확인 후 안내드립니다.
          </Text>
        </Section>

        <Section title="3. 처리 기간">
          <Text style={styles.p}>
            앱 내 탈퇴는 즉시 처리됩니다. 문의·고객센터를 통한 삭제 요청은 본인 확인 및 내부 절차에 따라{' '}
            <Text style={styles.bold}>접수일로부터 영업일 기준 7일 이내</Text>에 처리하거나, 불가 시 그 사유와 함께 회신합니다.
          </Text>
        </Section>

        <Section title="4. 삭제·비식별화되는 데이터 (탈퇴 직후)">
          <Text style={styles.p}>탈퇴 처리 시 일반적으로 다음과 같이 적용됩니다.</Text>
          <Text style={styles.subheading}>■ 삭제되는 데이터</Text>
          <Text style={styles.bullet}>• 계정 정보 (이메일, 로그인 정보)</Text>
          <Text style={styles.bullet}>• 프로필 정보 (닉네임 등)</Text>
          <Text style={styles.bullet}>• 앱 내 활동 정보</Text>
          <Text style={styles.note}>
            ※ 일부 커뮤니티 게시글 및 기록은 비식별 처리될 수 있습니다. 푸시 알림 등 단말 연동 정보는 비활성화됩니다.
          </Text>
        </Section>

        <Section title="5. 보관되는 데이터 및 보관 기간">
          <Text style={styles.p}>
            아래 항목은 <Text style={styles.bold}>전자상거래 등에서의 소비자보호에 관한 법률</Text>,{' '}
            <Text style={styles.bold}>국세기본법</Text> 등 관련 법령에 따른 보존 의무 또는 분쟁·부정이용 방지를 위해, 탈퇴 후에도 일정 기간 분리 보관될 수 있습니다.
          </Text>
          <Text style={styles.bullet}>• 계약·청약철회, 대금결제 및 재화 등의 공급에 관한 기록: 법령에서 정한 기간(통상 5년 등 해당 법령에 따름)</Text>
          <Text style={styles.bullet}>• 소비자 불만 또는 분쟁처리에 관한 기록: 법령에서 정한 기간(통상 3년 등 해당 법령에 따름)</Text>
          <Text style={styles.bullet}>• 세법이 정한 장부·증빙 등 관련 자료: 법령에서 정한 보존기간</Text>
          <Text style={styles.bullet}>
            • 모임·정산·참가 이력 등 서비스 운영·분쟁 대응에 필요한 최소한의 메타데이터: 내부 정책 및 법령 범위 내 보관 후 파기 (원칙적으로 비식별·접근 제한 상태로 관리)
          </Text>
          <Text style={styles.note}>
            보관 기간이 만료되면 복구 불가능한 방식으로 삭제하거나 완전히 익명화합니다. 구체적 보존 항목은 서비스 이용 시점의 약관·개인정보처리방침을 따릅니다.
          </Text>
        </Section>

        <Section title="6. 정책 문서">
          <Text style={styles.p}>데이터 처리의 전반적인 내용은 아래 약관·정책 페이지에서 확인할 수 있습니다.</Text>
          <Link href="/terms#privacy" asChild>
            <Pressable style={styles.secondaryLink}>
              <Text style={styles.secondaryLinkText}>개인정보처리방침 (웹)</Text>
            </Pressable>
          </Link>
          <View style={styles.linkSpacer} />
          <Link href="/terms" asChild>
            <Pressable style={styles.secondaryLink}>
              <Text style={styles.secondaryLinkText}>약관 및 정책 전체 보기</Text>
            </Pressable>
          </Link>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: {
    ...base.containerLg,
    paddingBottom: tokens.spacing.xl,
  },
  hero: {
    marginBottom: tokens.spacing.lg,
  },
  heroTitle: {
    fontSize: tokens.font.xxl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  heroSubtitle: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    lineHeight: 20,
    marginBottom: tokens.spacing.md,
  },
  metaLine: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  emailCalloutBox: {
    marginTop: tokens.spacing.md,
    padding: tokens.padding.md,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[600],
  },
  emailCalloutTitle: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs2,
  },
  emailCalloutAddress: {
    fontSize: tokens.font.lg,
    fontWeight: tokens.fontWeight.bold,
    color: colors.primary[700],
    marginBottom: tokens.spacing.sm2,
  },
  emailCalloutBody: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  sectionCard: {
    padding: tokens.padding.lg,
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: tokens.font.lg,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  sectionBody: {},
  p: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    lineHeight: 20,
    marginBottom: tokens.spacing.xs2,
  },
  ol: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    lineHeight: 20,
    marginBottom: tokens.spacing.xs2,
    paddingLeft: tokens.spacing.xs,
  },
  bullet: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    lineHeight: 20,
    marginBottom: tokens.spacing.xs2,
  },
  subheading: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
    lineHeight: 20,
    marginTop: tokens.spacing.xs2,
    marginBottom: tokens.spacing.xs2,
  },
  bold: {
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  note: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    lineHeight: 18,
    marginTop: tokens.spacing.xs2,
  },
  secondaryLink: {
    alignSelf: 'flex-start',
    paddingVertical: tokens.spacing.xs2,
  },
  secondaryLinkPressed: {
    opacity: 0.85,
  },
  secondaryLinkText: {
    color: colors.primary[700],
    fontSize: tokens.font.sm,
    textDecorationLine: 'underline',
  },
  linkSpacer: {
    height: tokens.spacing.xs2,
  },
});
