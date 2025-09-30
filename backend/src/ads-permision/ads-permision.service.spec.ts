import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { AdsPermissionService } from './ads-permision.service';

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());
import fetch from 'node-fetch';
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AdsPermissionService', () => {
  let service: AdsPermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdsPermissionService],
    }).compile();

    service = module.get<AdsPermissionService>(AdsPermissionService);

    // Set up environment variables for testing
    process.env.ADS_API_URL = 'https://test-api.example.com/ads';
    process.env.ADS_API_USER = 'testuser';
    process.env.ADS_API_PASS = 'testpass';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkPermission', () => {
    const mockSuccessResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ ads: 'enabled' }),
    };

    it('should return ads permission data for valid country code', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse as any);

      const result = await service.checkPermission('US');

      expect(result).toEqual({ ads: 'enabled' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.example.com/ads?countryCode=US',
        {
          headers: {
            'Authorization': 'Basic ' + Buffer.from('testuser:testpass').toString('base64')
          }
        }
      );
    });

    it('should return ads disabled for restricted country', async () => {
      const restrictedResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ ads: 'disabled' }),
      };
      mockFetch.mockResolvedValueOnce(restrictedResponse as any);

      const result = await service.checkPermission('CN');

      expect(result).toEqual({ ads: 'disabled' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.example.com/ads?countryCode=CN',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic ')
          })
        })
      );
    });

    it('should handle different country codes correctly', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse as any);

      await service.checkPermission('DE');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.example.com/ads?countryCode=DE',
        expect.any(Object)
      );
    });

    it('should throw HttpException with status 400 for missing parameters', async () => {
      const badRequestResponse = {
        ok: false,
        status: 400,
      };
      mockFetch.mockResolvedValueOnce(badRequestResponse as any);

      await expect(service.checkPermission('INVALID')).rejects.toThrow(
        new HttpException('Missing mandatory parameters', 400)
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpException with status 401 for invalid credentials', async () => {
      const unauthorizedResponse = {
        ok: false,
        status: 401,
      };
      mockFetch.mockResolvedValueOnce(unauthorizedResponse as any);

      await expect(service.checkPermission('US')).rejects.toThrow(
        new HttpException('Invalid credentials', 401)
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpException with status 500 for server errors', async () => {
      const serverErrorResponse = {
        ok: false,
        status: 500,
      };
      mockFetch.mockResolvedValueOnce(serverErrorResponse as any);

      await expect(service.checkPermission('US')).rejects.toThrow(
        new HttpException('Server temporarily unavailable', 500)
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw generic HttpException for other HTTP error codes', async () => {
      const otherErrorResponse = {
        ok: false,
        status: 404,
      };
      mockFetch.mockResolvedValueOnce(otherErrorResponse as any);

      await expect(service.checkPermission('US')).rejects.toThrow(
        new HttpException('External API error', 404)
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors and throw service unavailable exception', async () => {
      const networkError = new Error('Network connection failed');
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(service.checkPermission('US')).rejects.toThrow(
        new HttpException('External service unavailable', 500)
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle JSON parsing errors', async () => {
      const invalidJsonResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      mockFetch.mockResolvedValueOnce(invalidJsonResponse as any);

      await expect(service.checkPermission('US')).rejects.toThrow(
        new HttpException('External service unavailable', 500)
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should preserve HttpException when thrown by nested code', async () => {
      const customHttpException = new HttpException('Custom API error', 422);
      mockFetch.mockRejectedValueOnce(customHttpException);

      await expect(service.checkPermission('US')).rejects.toThrow(
        new HttpException('Custom API error', 422)
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle empty country code', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse as any);

      await service.checkPermission('');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.example.com/ads?countryCode=',
        expect.any(Object)
      );
    });

    it('should handle special characters in country code', async () => {
      mockFetch.mockResolvedValueOnce(mockSuccessResponse as any);

      await service.checkPermission('US%20');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.example.com/ads?countryCode=US%20',
        expect.any(Object)
      );
    });
  });

  describe('authorization header generation', () => {
    it('should generate correct Basic auth header', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ ads: 'enabled' }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await service.checkPermission('US');

      const expectedAuth = 'Basic ' + Buffer.from('testuser:testpass').toString('base64');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expectedAuth
          })
        })
      );
    });

    it('should handle different credentials from environment', async () => {
      // Temporarily change env vars
      const originalUser = process.env.ADS_API_USER;
      const originalPass = process.env.ADS_API_PASS;
      
      process.env.ADS_API_USER = 'newuser';
      process.env.ADS_API_PASS = 'newpass';

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ ads: 'enabled' }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await service.checkPermission('US');

      const expectedAuth = 'Basic ' + Buffer.from('newuser:newpass').toString('base64');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expectedAuth
          })
        })
      );

      // Restore original env vars
      process.env.ADS_API_USER = originalUser;
      process.env.ADS_API_PASS = originalPass;
    });
  });
});