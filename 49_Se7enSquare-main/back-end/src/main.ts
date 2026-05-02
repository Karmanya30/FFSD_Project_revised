import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Se7enSquare Backend API')
    .setDescription('In-memory NestJS backend for frontend integration and academic evaluation')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-role',
        description: 'RBAC role header: admin | moderator | user',
      },
      'x-role',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const docsPath = join(process.cwd(), 'docs');
  mkdirSync(docsPath, { recursive: true });
  writeFileSync(join(docsPath, 'swagger.json'), JSON.stringify(document, null, 2), 'utf8');

  app.setGlobalPrefix('api');
  app.enableCors();

  await app.listen(3000);
}

void bootstrap();
