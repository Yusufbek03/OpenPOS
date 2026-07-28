import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  (app as any).useStaticAssets(join(__dirname, 'uploads'), { prefix: '/uploads' });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: [
      process.env['ADMIN_URL'] ?? 'http://localhost:5173',
      process.env['POS_URL'] ?? 'http://localhost:5174',
      process.env['KITCHEN_URL'] ?? 'http://localhost:5175',
      process.env['CUSTOMER_DISPLAY_URL'] ?? 'http://localhost:5176',
    ],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('OpenPOS API')
    .setDescription('OpenPOS — Free, modern POS system for restaurants, cafés and retail stores')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & Authorization')
    .addTag('users', 'User Management')
    .addTag('products', 'Product Management')
    .addTag('categories', 'Category Management')
    .addTag('orders', 'Order Management')
    .addTag('payments', 'Payment Processing')
    .addTag('customers', 'Customer Management')
    .addTag('inventory', 'Inventory Management')
    .addTag('reports', 'Reports & Analytics')
    .addTag('printers', 'Printer Management')
    .addTag('kitchen', 'Kitchen Display')
    .addTag('tables', 'Restaurant Table Management')
    .addTag('audit', 'Audit Logs')
    .addTag('suppliers', 'Supplier Management')
    .addTag('inventory-counts', 'Inventory Counts')
    .addTag('stock-transfers', 'Stock Transfers')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const httpApp = app.getHttpAdapter();
  httpApp.get('/', (_req: any, res: any) => {
    res.json({
      name: 'OpenPOS API',
      version: '1.0',
      docs: '/api/docs',
      status: 'running',
    });
  });

  httpApp.get('/health', (_req: any, res: any) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  await app.listen(port);

  console.log(`🚀 OpenPOS API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
