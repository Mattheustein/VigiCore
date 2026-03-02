import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Minimal translations for the Dashboard navigation and error messages
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

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // react already safes from xss
        }
    });

export default i18n;
