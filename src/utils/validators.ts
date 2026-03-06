export const isValidEmail = (email: string | undefined): boolean => {
    if (!email || email.trim() === '') return true; // Leave required validation to other logic
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
};
