import WorkflowPageClient from './WorkflowPageClient';

// Required for static export with dynamic routes
export function generateStaticParams() {
    return [
        { id: '1' },
        { id: '2' },
        { id: 'sample-1' },
    ];
}

export default function WorkflowPage({ params }: { params: { id: string } }) {
    return <WorkflowPageClient id={params.id} />;
}
