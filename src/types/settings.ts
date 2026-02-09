export interface WelcomeMessages {
    es?: string;
    en?: string;
    pt?: string;
    [key: string]: string | undefined;
}

export interface WidgetConfig {
    primaryColor: string;
    position: 'bottom-right' | 'bottom-left' | string;
    language: 'es' | 'en' | 'pt' | string;
    welcomeMessages: WelcomeMessages;
    // Legacy support
    welcomeMessage?: string;
}

export interface BusinessProfile {
    centerName: string;
    bio: string;
    profession: string;
    specializations: string[];
    operatingHours: string;
    phone1: string;
    phone2: string;
    email: string;
    website: string;
    logoUrl?: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    timezone: string;
}
