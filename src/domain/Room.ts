export interface Room {
    roomId: string;
    tenantId: string;
    name: string;
    description?: string;
    capacity?: number;
    status: 'ACTIVE' | 'INACTIVE';
    isVirtual: boolean;
    minDuration?: number;
    maxDuration?: number;
    operatingHours?: any; // strict type would be nice but any for now
    metadata?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateRoomInput {
    name: string;
    description?: string;
    capacity?: number;
    status: 'ACTIVE' | 'INACTIVE';
    isVirtual?: boolean;
    minDuration?: number;
    maxDuration?: number;
    operatingHours?: any;
    metadata?: string;
}

export interface UpdateRoomInput {
    roomId: string;
    name?: string;
    description?: string;
    capacity?: number;
    status?: 'ACTIVE' | 'INACTIVE';
    isVirtual?: boolean;
    minDuration?: number;
    maxDuration?: number;
    operatingHours?: any;
    metadata?: string;
}
