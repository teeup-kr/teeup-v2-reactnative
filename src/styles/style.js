/* ===========================
   DESIGN TOKENS
=========================== */
export const tokens = {
    colors: {
        bg: '#F9FAFB',
        white: '#FFFFFF',
        black: '#000000',
        border: '#E5E7EB',
        text: '#111827',
        textMuted: '#374151',
        textSubtle: '#6B7280',
        textStrong: '#404040',
        inputBorder: '#D1D5DB',
        errorBg: '#FEE2E2',
        primary: {
            50: '#E8F5E8',
            100: '#C8E6C9',
            200: '#A5D6A7',
            300: '#81C784',
            400: '#66BB6A',
            500: '#4CAF50',
            600: '#43A047',
            700: '#388E3C',
            800: '#2E7D32',
            900: '#1B5E20',
        },
        secondary: {
            50: '#FFF8E1',
            100: '#FFECB3',
            200: '#FFE082',
            300: '#FFD54F',
            400: '#FFCA28',
            500: '#FFC107',
            600: '#FFB300',
            700: '#FFA000',
            800: '#FF8F00',
            900: '#FF6F00',
        },
        accent: {
            50: '#E3F2FD',
            100: '#BBDEFB',
            200: '#90CAF9',
            300: '#64B5F6',
            400: '#42A5F5',
            500: '#2196F3',
            600: '#1E88E5',
            700: '#1976D2',
            800: '#1565C0',
            900: '#0D47A1',
        },
        neutral: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#EEEEEE',
            300: '#E0E0E0',
            400: '#BDBDBD',
            500: '#9E9E9E',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
        },
        success: {
            50: '#E8F5E8',
            500: '#4CAF50',
            600: '#43A047',
            700: '#388E3C',
        },
        warning: {
            50: '#FFF8E1',
            500: '#FFC107',
            600: '#FFB300',
            700: '#FFA000',
        },
        error: {
            50: '#FFEBEE',
            500: '#F44336',
            600: '#E53935',
            700: '#D32F2F',
        },
        info: {
            50: '#E3F2FD',
            500: '#2196F3',
            600: '#1E88E5',
            700: '#1976D2',
        },
        gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
        },
        red: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            500: '#EF4444',
            600: '#DC2626',
            700: '#B91C1C',
            800: '#991B1B',
        },
        green: {
            50: '#F0FDF4',
            100: '#DCFCE7',
            200: '#BBF7D0',
            600: '#16A34A',
            700: '#15803D',
            800: '#166534',
            900: '#14532D',
        },
        emerald: {
            100: '#D1FAE5',
            500: '#10B981',
            600: '#059669',
        },
        blue: {
            100: '#DBEAFE',
            300: '#93C5FD',
            600: '#2563EB',
            700: '#1D4ED8',
        },
        yellow: {
            600: '#CA8A04',
        },
        violet: {
            600: '#7C3AED',
        },
        teal: {
            700: '#0F766E',
        },
        zinc: {
            300: '#D4D4D8',
        },
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
    modalSheet: {
        backgroundColor: tokens.colors.white,
        borderTopLeftRadius: tokens.radius.xl,
        borderTopRightRadius: tokens.radius.xl,
        padding: tokens.padding.md,
    },
    card: {
        backgroundColor: tokens.colors.white,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.colors.border,
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
        borderColor: tokens.colors.red[500],
        backgroundColor: tokens.colors.red[100],
    },

    /* Buttons */
    btnPrimary: {
        backgroundColor: tokens.colors.primary[600],
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
        backgroundColor: tokens.colors.gray[100],
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
        color: tokens.colors.red[500],
        marginTop: tokens.spacing.xs,
    },
    successText: {
        fontSize: tokens.font.sm,
        color: tokens.colors.emerald[500],
        marginTop: tokens.spacing.xs,
    },

    /* States */
    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.padding.md,
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
