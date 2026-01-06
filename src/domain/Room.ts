export interface Room {
    roomId: string; // ID should beroomId to match GraphQL
    tenantId: string;
    name: string;
    description?: string;
    capacity?: number;
    status: 'ACTIVE' | 'INACTIVE';
    metadata?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateRoomInput {
    name: string;
    description?: string;
    capacity?: number;
    status: 'ACTIVE' | 'INACTIVE';
    metadata?: string;
}

export interface UpdateRoomInput {
    roomId: string;
    name?: string;
    description?: string;
    capacity?: number;
    status?: 'ACTIVE' | 'INACTIVE';
    metadata?: string;
}
