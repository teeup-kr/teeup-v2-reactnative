import { colors } from '@/styles/colors';
/* ===========================
   DESIGN TOKENS
=========================== */
export const tokens = {
    colors,
    padding: {
        hairline: 2,
        micro: 3,
        xxs: 4,
        xs2: 6,
        xs: 8,
        base: 10,
        sm: 12,
        baseLg: 14,
        md: 16,
        lg2: 18,
        lg: 20,
        lg3: 22,
        xl: 24,
        xl3: 26,
        xl2: 28,
        xxl: 32,
        xxxl: 48,
        mega: 60,
    },
    radius: {
        xxs: 4,
        xs: 6,
        sm: 8,
        base: 10,
        md: 12,
        baseLg: 14,
        lg: 16,
        lg2: 18,
        xl: 20,
        xxl: 28,
        pill: 999,
    },
    spacing: {
        hairline: 2,
        micro: 3,
        xxs: 4,
        xs: 6,
        xs2: 8,
        sm: 10,
        sm2: 12,
        md2: 14,
        md: 16,
        md3: 18,
        lg2: 20,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    font: {
        xxs: 10,
        xs: 11,
        sm: 12,
        md: 13,
        base: 14,
        lg: 15,
        xl: 18,
        title: 16,
        display: 20,
        xxl: 22,
    },
    fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
    },
};

export const base = {
    /* Layout */
    safeArea: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    safeAreaNeutral: {
        flex: 1,
        backgroundColor: colors.neutral[50],
    },
    safeAreaPrimary: {
        flex: 1,
        backgroundColor: colors.primary[50],
    },
    safeAreaWhite: {
        flex: 1,
        backgroundColor: colors.white,
    },
    container: {
        padding: tokens.spacing.md,
        paddingBottom: tokens.spacing.lg,
    },
    containerLg: {
        padding: tokens.spacing.md,
        paddingBottom: tokens.spacing.xl,
    },
    modalSheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: tokens.radius.xl,
        borderTopRightRadius: tokens.radius.xl,
        padding: tokens.padding.md,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: tokens.padding.md,
        marginBottom: tokens.spacing.md,
    },

    /* Rows */
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    /* Text */
    h1: {
        fontSize: tokens.font.xl,
        fontWeight: tokens.fontWeight.extrabold,
        color: colors.text,
    },
    h2: {
        fontSize: tokens.font.lg,
        fontWeight: tokens.fontWeight.bold,
        color: colors.text,
    },
    label: {
        fontSize: tokens.font.md,
        fontWeight: tokens.fontWeight.semibold,
        color: colors.textMuted,
        marginBottom: tokens.spacing.xs,
    },
    body: {
        fontSize: tokens.font.md,
        color: colors.textMuted,
    },
    caption: {
        fontSize: tokens.font.xs,
        color: colors.textSubtle,
    },
    sectionTitle: {
        fontSize: tokens.font.title,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[900],
    },
    sectionTitleMd: {
        fontSize: tokens.font.base,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[900],
    },
    sectionTitleSm: {
        fontSize: tokens.font.md,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[800],
    },
    sectionSubtitle: {
        fontSize: tokens.font.sm,
        color: colors.neutral[500],
    },
    cardTitleSm: {
        fontSize: tokens.font.lg,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[900],
    },
    textSmMuted: {
        fontSize: tokens.font.sm,
        color: colors.neutral[600],
    },
    textSmSubtle: {
        fontSize: tokens.font.sm,
        color: colors.neutral[500],
    },
    textSmError: {
        fontSize: tokens.font.sm,
        color: colors.error[600],
    },
    textSmSuccess: {
        fontSize: tokens.font.sm,
        color: colors.success[600],
    },
    labelSm: {
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.semibold,
        color: colors.neutral[700],
        marginBottom: tokens.spacing.xs,
    },
    cardTitle: {
        fontSize: tokens.font.title,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[900],
    },

    /* Inputs */
    input: {
        borderWidth: 1,
        borderColor: colors.inputBorder,
        borderRadius: tokens.radius.md,
        paddingHorizontal: tokens.padding.md,
        paddingVertical: tokens.padding.sm,
        fontSize: tokens.font.md,
        backgroundColor: colors.white,
        color: colors.text,
    },
    inputError: {
        borderColor: colors.red[500],
        backgroundColor: colors.red[100],
    },

    /* Buttons */
    btnPrimary: {
        backgroundColor: colors.primary[600],
        borderRadius: tokens.radius.md,
        paddingVertical: tokens.padding.sm,
        paddingHorizontal: tokens.padding.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnPrimaryText: {
        color: colors.white,
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.extrabold,
    },
    btnGray: {
        backgroundColor: colors.gray[100],
        borderRadius: tokens.radius.md,
        paddingVertical: tokens.padding.sm,
        paddingHorizontal: tokens.padding.md,
        alignItems: 'center',
    },
    btnGrayText: {
        color: colors.textMuted,
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.bold,
    },
    btnOutline: {
        backgroundColor: colors.white,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: colors.neutral[200],
        paddingVertical: tokens.padding.sm,
        paddingHorizontal: tokens.padding.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnOutlineText: {
        color: colors.neutral[700],
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.semibold,
    },

    /* Feedback */
    errorText: {
        fontSize: tokens.font.sm,
        color: colors.error[600],
        marginTop: tokens.spacing.xs,
    },
    successText: {
        fontSize: tokens.font.sm,
        color: colors.success[600],
        marginTop: tokens.spacing.xs,
    },

    /* States */
    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.padding.md,
    },
    stateRow: {
        paddingVertical: tokens.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stateText: {
        marginTop: tokens.spacing.xs,
        fontSize: tokens.font.sm,
        color: colors.neutral[500],
    },

    /* Components */
    badge: {
        paddingHorizontal: tokens.padding.xs,
        paddingVertical: tokens.padding.xxs,
        borderRadius: tokens.radius.pill,
    },
    chip: {
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.xs,
        borderRadius: tokens.radius.lg,
        borderWidth: 1,
    },
    stateBox: {
        alignItems: 'center',
        padding: tokens.padding.xl,
    },
};
