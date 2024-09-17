import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import * as tunnel from 'tunnel';
import { XCountryDto } from './dto/xcountry.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { XCityDto } from './dto/xcity.dto';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class HotelsService {
  constructor(
    protected readonly conf: ConfigService,
    protected readonly httpService: HttpService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Cron('0 0 */1 * * *')
  async handleCron() {
    console.log('5K Hotel Cron', new Date());
    const xcounties = await this.getCountries();
    await this.setCountryXConnectId(xcounties);
    for (const xcountry of xcounties) {
      const cities = await this.getCities(xcountry.CountryId);
      await this.setCityXConnectId(cities);
    }
  }

  async getCountries(): Promise<XCountryDto[]> {
    const agent = tunnel.httpsOverHttp({
      proxy: {
        host: this.conf.get('FIVEK_HOTEL_PROXY_HOST'),
        port: this.conf.get<number>('FIVEK_HOTEL_PROXY_PORT'),
      },
    });
    const { data } = await lastValueFrom(
      this.httpService.post<XCountryDto[]>(
        `${this.conf.get('FIVEK_HOTEL_BASEURL')}/api/xconnect/Countries/`,
        {
          token: this.conf.get('FIVEK_HOTEL_TOKEN'),
        },
        {
          httpsAgent: agent,
        },
      ),
    );
    return data;
  }

  setCountryXConnectId(xcountries: XCountryDto[]) {
    const promises = xcountries.map((x) =>
      this.dataSource.query(
        `UPDATE countries SET xconnect_id = ${x.CountryId} WHERE LOWER(name) = LOWER('${x.Name}')`,
      ),
    );

    return Promise.allSettled(promises);
  }

  async getCities(CountryId: string): Promise<XCityDto[]> {
    const agent = tunnel.httpsOverHttp({
      proxy: {
        host: this.conf.get('FIVEK_HOTEL_PROXY_HOST'),
        port: this.conf.get<number>('FIVEK_HOTEL_PROXY_PORT'),
      },
    });
    const { data } = await lastValueFrom(
      this.httpService.post<XCityDto[]>(
        `${this.conf.get('FIVEK_HOTEL_BASEURL')}/api/xconnect/Cities/`,
        {
          token: this.conf.get('FIVEK_HOTEL_TOKEN'),
          Request: { CountryId },
        },
        {
          httpsAgent: agent,
        },
      ),
    );
    return data;
  }

  setCityXConnectId(xcities: XCityDto[]) {
    const promises = xcities.map((x) =>
      this.dataSource.query(
        `UPDATE cities SET xconnect_id = ${x.CityId} WHERE LOWER(name) = LOWER('${x.Name}')`,
      ),
    );

    return Promise.allSettled(promises);
  }

  async hotelsByCityId(CityId: number): Promise<unknown[]> {
    const agent = tunnel.httpsOverHttp({
      proxy: {
        host: this.conf.get('FIVEK_HOTEL_PROXY_HOST'),
        port: this.conf.get<number>('FIVEK_HOTEL_PROXY_PORT'),
      },
    });
    const { data } = await lastValueFrom(
      this.httpService.post<XCountryDto[]>(
        `${this.conf.get('FIVEK_HOTEL_BASEURL')}/api/xconnect/AllHotelsByCity/`,
        {
          token: this.conf.get('FIVEK_HOTEL_TOKEN'),
          Request: { CityId },
        },
        {
          httpsAgent: agent,
        },
      ),
    );
    return data;
  }
}
