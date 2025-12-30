/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true,
    },
};

module.exports = withNextIntl(nextConfig);
