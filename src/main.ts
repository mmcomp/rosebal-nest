import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
// import { HotelsService } from './hotels/hotels.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const conf = app.get(ConfigService);
  const port = +(conf.get('PORT') || 3000);
  await app.listen(port, '0.0.0.0');

  // const h = app.get(HotelsService);
  // console.log(await h.hotelsByCityId(316811));
}
bootstrap();
