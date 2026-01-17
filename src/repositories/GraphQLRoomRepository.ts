import { generateClient } from 'aws-amplify/api';
import { RoomRepository } from '../domain/RoomRepository';
import { Room, CreateRoomInput, UpdateRoomInput } from '../domain/Room';
import { LIST_ROOMS, GET_ROOM, CREATE_ROOM, UPDATE_ROOM, DELETE_ROOM } from '../graphql/queries';

const client = generateClient();

export class GraphQLRoomRepository implements RoomRepository {
    async listRooms(): Promise<Room[]> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: LIST_ROOMS
            });
            return (response.data.listRooms || []).map((room: any) => ({
                ...room,
                operatingHours: room.operatingHours ? JSON.parse(room.operatingHours) : [],
                metadata: room.metadata ? JSON.parse(room.metadata) : undefined
            }));
        } catch (error) {
            console.error('Error listing rooms:', error);
            throw error;
        }
    }

    async getRoom(roomId: string): Promise<Room | null> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GET_ROOM,
                variables: { roomId }
            });
            const room = response.data.getRoom;
            if (!room) return null;
            return {
                ...room,
                operatingHours: room.operatingHours ? JSON.parse(room.operatingHours) : [],
                metadata: room.metadata ? JSON.parse(room.metadata) : undefined
            };
        } catch (error) {
            console.error('Error getting room:', error);
            throw error;
        }
    }

    async createRoom(input: CreateRoomInput): Promise<Room> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: CREATE_ROOM,
                variables: {
                    input: {
                        ...input,
                        operatingHours: input.operatingHours ? JSON.stringify(input.operatingHours) : null,
                        metadata: input.metadata ? JSON.stringify(input.metadata) : null
                    }
                }
            });
            return response.data.createRoom;
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    }

    async updateRoom(input: UpdateRoomInput): Promise<Room> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: UPDATE_ROOM,
                variables: {
                    input: {
                        ...input,
                        operatingHours: input.operatingHours ? JSON.stringify(input.operatingHours) : null,
                        metadata: input.metadata ? JSON.stringify(input.metadata) : null
                    }
                }
            });
            return response.data.updateRoom;
        } catch (error) {
            console.error('Error updating room:', error);
            throw error;
        }
    }

    async deleteRoom(roomId: string): Promise<Room> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: DELETE_ROOM,
                variables: { roomId }
            });
            return response.data.deleteRoom;
        } catch (error) {
            console.error('Error deleting room:', error);
            throw error;
        }
    }
}
