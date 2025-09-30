import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AdsPermissionService } from './ads-permision.service';

@Controller('ads-permission')
export class AdsPermissionController {
  constructor(private readonly adsPermissionService: AdsPermissionService) {}

  @Get()
  async checkPermission(@Query('countryCode') countryCode: string) {
    if (!countryCode) {
      throw new HttpException('Country code is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.adsPermissionService.checkPermission(countryCode);
    } catch (error) {
      throw new HttpException(
        'Failed to check ads permission',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
