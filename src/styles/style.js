/* ===========================
   DESIGN TOKENS
=========================== */
const tokens = {
    colors: {
        bg: '#F9FAFB',
        white: '#fff',
        border: '#E5E7EB',
        text: '#111827',
        textMuted: '#374151',
        textSubtle: '#6B7280',
        inputBorder: '#D1D5DB',
        error: '#EF4444',
        errorBg: '#FEE2E2',
        primary: '#3B82F6',
        gray: '#F3F4F6',
        success: '#10B981',
    },
    padding: {
        xxs: 4,
        xs: 8,
        sm: 12,
        md: 16,
        lg: 20,
        xl: 24,
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        pill: 999,
    },
    spacing: {
        xs: 6,
        sm: 10,
        md: 16,
        lg: 24,
    },
    font: {
        xs: 11,
        sm: 12,
        md: 13,
        lg: 15,
        xl: 18,
    },
    fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },
};

/* ===========================
   BASE UI PRIMITIVES
=========================== */
export const base = {
    /* Layout */
    safeArea: {
        flex: 1,
        backgroundColor: tokens.colors.bg,
    },
    container: {
        padding: tokens.spacing.md,
        paddingBottom: tokens.spacing.lg,
    },
    card: {
        backgroundColor: tokens.colors.white,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.colors.border,
        padding: tokens.padding.md,
        marginBottom: tokens.spacing.md,
    },

    /* Text */
    h1: {
        fontSize: tokens.font.xl,
        fontWeight: tokens.fontWeight.extrabold,
        color: tokens.colors.text,
    },
    h2: {
        fontSize: tokens.font.lg,
        fontWeight: tokens.fontWeight.bold,
        color: tokens.colors.text,
    },
    label: {
        fontSize: tokens.font.md,
        fontWeight: tokens.fontWeight.semibold,
        color: tokens.colors.textMuted,
        marginBottom: tokens.spacing.xs,
    },
    body: {
        fontSize: tokens.font.md,
        color: tokens.colors.textMuted,
    },
    caption: {
        fontSize: tokens.font.xs,
        color: tokens.colors.textSubtle,
    },

    /* Inputs */
    input: {
        borderWidth: 1,
        borderColor: tokens.colors.inputBorder,
        borderRadius: tokens.radius.md,
        paddingHorizontal: tokens.padding.md,
        paddingVertical: tokens.padding.sm,
        fontSize: tokens.font.md,
        backgroundColor: tokens.colors.white,
        color: tokens.colors.text,
    },
    inputError: {
        borderColor: tokens.colors.error,
        backgroundColor: tokens.colors.errorBg,
    },

    /* Buttons */
    btnPrimary: {
        backgroundColor: tokens.colors.primary,
        borderRadius: tokens.radius.md,
        paddingVertical: tokens.padding.sm,
        paddingHorizontal: tokens.padding.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnPrimaryText: {
        color: tokens.colors.white,
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.extrabold,
    },

    btnGray: {
        backgroundColor: tokens.colors.gray,
        borderRadius: tokens.radius.md,
        paddingVertical: tokens.padding.sm,
        paddingHorizontal: tokens.padding.md,
        alignItems: 'center',
    },
    btnGrayText: {
        color: tokens.colors.textMuted,
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.bold,
    },

    /* Feedback */
    errorText: {
        fontSize: tokens.font.sm,
        color: tokens.colors.error,
        marginTop: tokens.spacing.xs,
    },
    successText: {
        fontSize: tokens.font.sm,
        color: tokens.colors.success,
        marginTop: tokens.spacing.xs,
    },

    /* States */
    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.padding.md,
    },
};

export const layouts = {
    safeArea: {
        flex: 1,
        backgroundColor: tokens.colors.bg,
    },

    container: {
        padding: tokens.padding.md,
    },

    modalSheet: {
        backgroundColor: tokens.colors.white,
        borderTopLeftRadius: tokens.radius.xl,
        borderTopRightRadius: tokens.radius.xl,
        padding: tokens.padding.md,
    },
};

export const components = {
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
