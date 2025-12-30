// No middleware needed for static export with next-intl
// Language switching will be handled client-side
export { default } from 'next-intl/middleware';

export const config = {
    matcher: []  // Disable middleware for static export
};
