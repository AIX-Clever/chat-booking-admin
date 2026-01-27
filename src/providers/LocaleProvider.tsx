'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useState, useEffect, ReactNode } from 'react';

interface LocaleProviderProps {
    children: ReactNode;
}

export default function LocaleProvider({ children }: LocaleProviderProps) {
    const [locale, setLocale] = useState('es');
    const [messages, setMessages] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Detect language from localStorage or browser
        const detectLanguage = () => {
            const saved = localStorage.getItem('lucia-language');
            if (saved && ['es', 'en', 'pt'].includes(saved)) {
                return saved;
            }

            const browserLang = navigator.language.toLowerCase();
            if (['es', 'en', 'pt'].includes(browserLang)) {
                return browserLang;
            }

            const langPrefix = browserLang.split('-')[0];
            if (['es', 'en', 'pt'].includes(langPrefix)) {
                return langPrefix;
            }

            return 'es';
        };

        const lang = detectLanguage();
        setLocale(lang);
        document.documentElement.lang = lang;

        // Load messages dynamically
        import(`../../messages/${lang}.json`)
            .then((module) => {
                setMessages(module.default);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Failed to load messages:', error);
                setIsLoading(false);
            });
    }, []);

    // Listen for language changes
    useEffect(() => {
        const handleLanguageChange = (event: Event) => {
            const customEvent = event as CustomEvent;
            const newLocale = customEvent.detail.locale;
            setLocale(newLocale);
            document.documentElement.lang = newLocale;
            localStorage.setItem('lucia-language', newLocale);

            import(`../../messages/${newLocale}.json`)
                .then((module) => {
                    setMessages(module.default);
                })
                .catch((error) => {
                    console.error('Failed to load messages:', error);
                });
        };

        window.addEventListener('languageChange', handleLanguageChange);
        return () => {
            window.removeEventListener('languageChange', handleLanguageChange);
        };
    }, []);

    if (isLoading) {
        return null; // Or a loading spinner
    }

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}
