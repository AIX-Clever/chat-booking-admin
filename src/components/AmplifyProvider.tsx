'use client';

import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import React, { ReactNode } from 'react';

// Configure using environment variables injected at build time
Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
            userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
        },
    },
    API: {
        GraphQL: {
            endpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '',
            region: 'us-east-1',
            defaultAuthMode: 'userPool',
        }
    }
});

export default function AmplifyProvider({ children }: { children: ReactNode }) {
    return (
        <>{children}</>
    );
}
