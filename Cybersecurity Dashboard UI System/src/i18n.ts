/**
 * Internationalization (i18n) Configuration
 * ==========================================
 * Configures i18next for multi-language support across the dashboard UI.
 *
 * Supported Languages:
 * - English (en) — default / fallback
 * - Spanish (es)
 * - Arabic (ar)
 * - French (fr)
 *
 * Uses browser language detection (`i18next-browser-languagedetector`) to
 * auto-select the user's preferred language on first visit. The language
 * can be changed at runtime via the top-bar Language dropdown in DashboardLayout.
 *
 * Translation Scope: Currently covers sidebar navigation labels, welcome
 * messages, and core UI action labels. Page-specific content remains
 * in English and would need additional translation keys for full coverage.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources — keyed by ISO 639-1 language codes
const resources = {
    en: {
        translation: {
            "Dashboard": "Dashboard",
            "Authentication Logs": "Authentication Logs",
            "Suspicious Activity": "Suspicious Activity",
            "IP Intelligence": "IP Intelligence",
            "Alerts": "Alerts",
            "System Health": "System Health",
            "Network Traffic": "Network Traffic",
            "Detection Rules": "Detection Rules",
            "Settings": "Settings",
            "Welcome": "Welcome back",
            "Language": "Language",
            "Logout": "Logout",
        }
    },
    es: {
        translation: {
            "Dashboard": "Panel de Control",
            "Authentication Logs": "Registros de Autenticación",
            "Suspicious Activity": "Actividad Sospechosa",
            "IP Intelligence": "Inteligencia de IP",
            "Alerts": "Alertas al Sistema",
            "System Health": "Salud del Sistema",
            "Network Traffic": "Tráfico de Red",
            "Detection Rules": "Reglas de Detección",
            "Settings": "Ajustes",
            "Welcome": "Bienvenido de nuevo",
            "Language": "Idioma",
            "Logout": "Cerrar sesión",
        }
    },
    ar: {
        translation: {
            "Dashboard": "لوحة القيادة",
            "Authentication Logs": "سجلات المصادقة",
            "Suspicious Activity": "النشاط المشبوه",
            "IP Intelligence": "ذكاء IP",
            "Alerts": "إنذارات",
            "System Health": "صحة النظام",
            "Network Traffic": "حركة مرور الشبكة",
            "Detection Rules": "قواعد الكشف",
            "Settings": "إعدادات",
            "Welcome": "مرحباً بعودتك",
            "Language": "لغة",
            "Logout": "تسجيل خروج",
        }
    },
    fr: {
        translation: {
            "Dashboard": "Tableau de Bord",
            "Authentication Logs": "Journaux d'Authentification",
            "Suspicious Activity": "Activité Suspecte",
            "IP Intelligence": "Intelligence IP",
            "Alerts": "Alertes",
            "System Health": "Santé du Système",
            "Network Traffic": "Trafic Réseau",
            "Detection Rules": "Règles de Détection",
            "Settings": "Paramètres",
            "Welcome": "Bienvenue",
            "Language": "Langue",
            "Logout": "Se déconnecter",
        }
    }
};

// Initialize i18next with browser language detection and React bindings
i18n
    .use(LanguageDetector)    // Auto-detects browser language preference
    .use(initReactI18next)    // Binds i18next to React's context system
    .init({
        resources,
        fallbackLng: 'en',    // Default to English if detected language has no translations
        interpolation: {
            escapeValue: false, // React already handles XSS protection via JSX escaping
        }
    });

export default i18n;
