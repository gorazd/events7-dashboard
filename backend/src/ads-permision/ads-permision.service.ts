import { Injectable, HttpException } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class AdsPermissionService {
  async checkPermission(countryCode: string): Promise<{ ads: string }> {
    try {
      const response = await fetch(
        `${process.env.ADS_API_URL}?countryCode=${countryCode}`,
        {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${process.env.ADS_API_USER}:${process.env.ADS_API_PASS}`).toString('base64')
          }
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          throw new HttpException('Missing mandatory parameters', 400);
        } else if (response.status === 401) {
          throw new HttpException('Invalid credentials', 401);
        } else if (response.status === 500) {
          throw new HttpException('Server temporarily unavailable', 500);
        }
        throw new HttpException('External API error', response.status);
      }

      return await response.json() as { ads: string };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('External service unavailable', 500);
    }
  }
}
