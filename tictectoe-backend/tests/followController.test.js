// followController.test.js

// -----------------------------
// Mock @supabase/supabase-js inside jest.mock
// -----------------------------
jest.mock('@supabase/supabase-js', () => {
  const mockEq = jest.fn().mockReturnThis();
  const mockMaybeSingle = jest.fn().mockReturnThis();
  const mockSingle = jest.fn().mockReturnThis();
  const mockSelect = jest.fn().mockReturnThis();
  const mockIn = jest.fn().mockReturnThis();
  const mockInsert = jest.fn();
  const mockDelete = jest.fn();

  const mockFrom = jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
    single: mockSingle,
    in: mockIn,
  }));

  return {
    createClient: jest.fn(() => ({
      from: mockFrom,
      // expose the mocks so we can manipulate them in tests
      __mocks: { mockFrom, mockSelect, mockInsert, mockDelete, mockEq, mockMaybeSingle, mockSingle, mockIn },
    })),
  };
});

// -----------------------------
// Import after mocking
// -----------------------------
const { 
  followUser, 
  unfollowUser, 
  checkIfFollowing, 
  getUserFollowers, 
  getUserFollowing, 
  getUserById 
} = require('../controllers/followController');

const { createClient } = require('@supabase/supabase-js');
const { __mocks } = createClient();

// -----------------------------
// Tests
// -----------------------------
describe('Follow Controller', () => {
  let res;

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('followUser', () => {
    it('should return 400 if followerId missing', async () => {
      const req = { body: { followingId: '1' }, user: {} };
      await followUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Follower ID is required' });
    });

    it('should follow user successfully', async () => {
      const req = { body: { followingId: '2' }, user: { id: '1' } };
      __mocks.mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      __mocks.mockInsert.mockResolvedValueOnce({ data: [{ follower_id: '1', following_id: '2' }], error: null });

      await followUser(req, res);

      expect(__mocks.mockInsert).toHaveBeenCalledWith([{ follower_id: '1', following_id: '2' }]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Followed successfully',
        data: [{ follower_id: '1', following_id: '2' }],
      });
    });
  });

  describe('checkIfFollowing', () => {
    it('should return true if following', async () => {
      const req = { params: { userId: '2' }, user: { id: '1' } };
      __mocks.mockMaybeSingle.mockResolvedValueOnce({ data: { follower_id: '1', following_id: '2' }, error: null });

      await checkIfFollowing(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ isFollowing: true });
    });

    it('should return false if not following', async () => {
      const req = { params: { userId: '2' }, user: { id: '1' } };
      __mocks.mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      await checkIfFollowing(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ isFollowing: false });
    });
  });


  describe('getUserById', () => {
    it('should return user by id', async () => {
      const req = { params: { id: '1' } };
      __mocks.mockSingle.mockResolvedValueOnce({ data: { id: '1', username: 'alice', name: 'Alice' }, error: null });

      await getUserById(req, res);

      expect(res.json).toHaveBeenCalledWith({ id: '1', username: 'alice', name: 'Alice' });
    });
  });
});
