// We use require for the repository to ensure it's loaded AFTER the mock
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GraphQLRoomRepository: any;
const mockGraphql = jest.fn();

// Mock aws-amplify/api
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        graphql: mockGraphql
    }))
}));

describe('GraphQLRoomRepository', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let repository: any;

    beforeAll(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        GraphQLRoomRepository = require('../GraphQLRoomRepository').GraphQLRoomRepository;
    });

    beforeEach(() => {
        repository = new GraphQLRoomRepository();
        jest.clearAllMocks();
    });

    describe('listRooms', () => {
        it('should list rooms and parse JSON fields', async () => {
            const mockRooms = [
                {
                    roomId: '1',
                    name: 'Room 1',
                    operatingHours: JSON.stringify([{ day: 'Monday' }]),
                    metadata: JSON.stringify({ key: 'value' })
                }
            ];
            mockGraphql.mockResolvedValue({ data: { listRooms: mockRooms } });

            const result = await repository.listRooms();

            expect(result).toHaveLength(1);
            expect(result[0].roomId).toBe('1');
            expect(result[0].operatingHours).toEqual([{ day: 'Monday' }]);
            expect(result[0].metadata).toEqual({ key: 'value' });
        });

        it('should handle missing JSON fields', async () => {
            const mockRooms = [{ roomId: '1', name: 'Room 1' }];
            mockGraphql.mockResolvedValue({ data: { listRooms: mockRooms } });

            const result = await repository.listRooms();

            expect(result[0].operatingHours).toEqual([]);
            expect(result[0].metadata).toBeUndefined();
        });

        it('should throw error on failure', async () => {
            mockGraphql.mockRejectedValue(new Error('GraphQL Error'));
            await expect(repository.listRooms()).rejects.toThrow('GraphQL Error');
        });
    });

    describe('getRoom', () => {
        it('should get a single room', async () => {
            const mockRoom = { roomId: '1', name: 'Room 1' };
            mockGraphql.mockResolvedValue({ data: { getRoom: mockRoom } });

            const result = await repository.getRoom('1');

            expect(result).not.toBeNull();
            expect(result?.roomId).toBe('1');
        });

        it('should return null if room not found', async () => {
            mockGraphql.mockResolvedValue({ data: { getRoom: null } });
            const result = await repository.getRoom('1');
            expect(result).toBeNull();
        });

        it('should throw error on failure', async () => {
            mockGraphql.mockRejectedValue(new Error('Get Error'));
            await expect(repository.getRoom('1')).rejects.toThrow('Get Error');
        });
    });

    describe('createRoom', () => {
        it('should create a room and stringify fields', async () => {
            const input = { name: 'New Room', operatingHours: [], metadata: { a: 1 } };
            const createdRoom = { roomId: '2', ...input };
            mockGraphql.mockResolvedValue({ data: { createRoom: createdRoom } });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await repository.createRoom(input as unknown as any);

            expect(mockGraphql).toHaveBeenCalledWith(expect.objectContaining({
                variables: {
                    input: expect.objectContaining({
                        metadata: JSON.stringify({ a: 1 })
                    })
                }
            }));
            expect(result.roomId).toBe('2');
        });

        it('should throw error on failure', async () => {
            mockGraphql.mockRejectedValue(new Error('Create Error'));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await expect(repository.createRoom({ name: 'fail' } as unknown as any)).rejects.toThrow('Create Error');
        });
    });

    describe('updateRoom', () => {
        it('should update a room', async () => {
            const input = { roomId: '1', name: 'Updated' };
            mockGraphql.mockResolvedValue({ data: { updateRoom: input } });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await repository.updateRoom(input as unknown as any);

            expect(result.name).toBe('Updated');
        });

        it('should throw error on failure', async () => {
            mockGraphql.mockRejectedValue(new Error('Update Error'));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await expect(repository.updateRoom({ roomId: '1' } as unknown as any)).rejects.toThrow('Update Error');
        });
    });

    describe('deleteRoom', () => {
        it('should delete a room', async () => {
            const mockRoom = { roomId: '1' };
            mockGraphql.mockResolvedValue({ data: { deleteRoom: mockRoom } });

            const result = await repository.deleteRoom('1');

            expect(result.roomId).toBe('1');
        });

        it('should throw error on failure', async () => {
            mockGraphql.mockRejectedValue(new Error('Delete Error'));
            await expect(repository.deleteRoom('1')).rejects.toThrow('Delete Error');
        });
    });
});
