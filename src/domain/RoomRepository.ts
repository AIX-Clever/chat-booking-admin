import { Room, CreateRoomInput, UpdateRoomInput } from './Room';

export interface RoomRepository {
    listRooms(): Promise<Room[]>;
    getRoom(roomId: string): Promise<Room | null>;
    createRoom(input: CreateRoomInput): Promise<Room>;
    updateRoom(input: UpdateRoomInput): Promise<Room>;
    deleteRoom(roomId: string): Promise<Room>; // Returns deleted room
}
