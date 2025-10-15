import { loginUser, retrieveUser, retrieveUsers, addUser, updateUser, deleteUser } from '../../services/user.service';
import { db } from '../../db/client';
import { users } from '../../models/user.model';
import * as passwordUtils from '../../utils/password';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../utils/password');
jest.mock('jsonwebtoken');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginUser', () => {
    it('should successfully login user with correct credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        admin: false,
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await loginUser({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.id).toBe('user-1');
    });

    it('should throw error when email is missing', async () => {
      await expect(
        loginUser({ email: '', password: 'password' })
      ).rejects.toThrow('Missing required fields: email, password');
    });

    it('should throw error when password is missing', async () => {
      await expect(
        loginUser({ email: 'test@example.com', password: '' })
      ).rejects.toThrow('Missing required fields: email, password');
    });

    it('should throw error when user not found', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        loginUser({ email: 'notfound@example.com', password: 'password' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error when password is incorrect', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        admin: false,
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(
        loginUser({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('retrieveUser', () => {
    it('should retrieve user by id', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const result = await retrieveUser('user-1');

      expect(result).toEqual(mockUser);
    });
  });

  describe('retrieveUsers', () => {
    it('should retrieve all users', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await retrieveUsers();

      expect(result).toEqual(mockUsers);
    });
  });

  describe('addUser', () => {
    it('should successfully add a new user', async () => {
      const newUser = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
      };

      const mockCreatedUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-password');

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreatedUser]),
        }),
      });

      const result = await addUser(newUser);

      expect(result).toEqual(mockCreatedUser);
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('password123');
    });

    it('should throw error when required fields are missing', async () => {
      await expect(
        addUser({
          first_name: '',
          last_name: 'Doe',
          email: 'john@example.com',
          password: 'password',
        })
      ).rejects.toThrow('Missing required fields: first_name, last_name, email, password');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        first_name: 'Jane',
        email: 'jane@example.com',
      };

      const mockUpdatedUser = {
        id: 'user-1',
        firstName: 'Jane',
        email: 'jane@example.com',
      };

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdatedUser]),
          }),
        }),
      });

      const result = await updateUser('user-1', updateData);

      expect(result).toEqual(mockUpdatedUser);
    });

    it('should hash password when updating password', async () => {
      const updateData = {
        password: 'newpassword',
      };

      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('new-hashed-password');

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ id: 'user-1' }]),
          }),
        }),
      });

      await updateUser('user-1', updateData);

      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('newpassword');
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return true', async () => {
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'user-1' }]),
        }),
      });

      const result = await deleteUser('user-1');

      expect(result).toBe(true);
    });
  });
});
