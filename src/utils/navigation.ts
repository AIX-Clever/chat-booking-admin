export const navigateTo = (url: string) => {
    if (typeof window !== 'undefined') {
        window.location.href = url;
    }
};

export const getCurrentUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.href;
    }
    return '';
};
