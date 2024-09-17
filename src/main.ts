import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const conf = app.get(ConfigService);
  const port = +(conf.get('PORT') || 3000);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
