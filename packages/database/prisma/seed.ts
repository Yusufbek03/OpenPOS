import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();
const bcrypt = bcryptjs;

async function main() {
  console.log('Seeding database...');

  // Roles
  const roles = await Promise.all([
    prisma.role.create({ data: { name: 'OWNER', description: 'Владелец системы' } }),
    prisma.role.create({ data: { name: 'ADMINISTRATOR', description: 'Администратор' } }),
    prisma.role.create({ data: { name: 'CASHIER', description: 'Кассир' } }),
    prisma.role.create({ data: { name: 'WAITER', description: 'Официант' } }),
    prisma.role.create({ data: { name: 'COOK', description: 'Повар' } }),
    prisma.role.create({ data: { name: 'WAREHOUSE_MANAGER', description: 'Менеджер склада' } }),
    prisma.role.create({ data: { name: 'ACCOUNTANT', description: 'Бухгалтер' } }),
  ]);
  console.log(`Created ${roles.length} roles`);

  // Permissions
  const permissions = await Promise.all([
    prisma.permission.create({ data: { code: 'users.view', name: 'Просмотр пользователей' } }),
    prisma.permission.create({ data: { code: 'users.manage', name: 'Управление пользователями' } }),
    prisma.permission.create({ data: { code: 'products.view', name: 'Просмотр товаров' } }),
    prisma.permission.create({ data: { code: 'products.manage', name: 'Управление товарами' } }),
    prisma.permission.create({ data: { code: 'orders.view', name: 'Просмотр заказов' } }),
    prisma.permission.create({ data: { code: 'orders.manage', name: 'Управление заказами' } }),
    prisma.permission.create({ data: { code: 'inventory.view', name: 'Просмотр склада' } }),
    prisma.permission.create({ data: { code: 'inventory.manage', name: 'Управление складом' } }),
    prisma.permission.create({ data: { code: 'reports.view', name: 'Просмотр отчётов' } }),
    prisma.permission.create({ data: { code: 'settings.manage', name: 'Управление настройками' } }),
  ]);
  console.log(`Created ${permissions.length} permissions`);

  // Assign all permissions to OWNER
  for (const perm of permissions) {
    await prisma.rolePermission.create({
      data: { roleId: roles[0].id, permissionId: perm.id },
    });
  }

  // Company
  const company = await prisma.company.create({
    data: {
      name: 'OpenPOS Demo',
      inn: '123456789',
      address: 'Ташкент, ул. Амира Темура, 1',
      phone: '+998 90 123 45 67',
      defaultCurrency: 'UZS',
      defaultLocale: 'ru',
    },
  });
  console.log(`Created company: ${company.name}`);

  // Branches
  const branch1 = await prisma.branch.create({
    data: { name: 'Главный офис', companyId: company.id, address: 'Ташкент, пр. Мирзо Улугбека, 10', phone: '+998 90 111 11 11' },
  });
  const branch2 = await prisma.branch.create({
    data: { name: 'Филиал Чиланзар', companyId: company.id, address: 'Ташкент, Чиланзар, ул. Беруни, 5', phone: '+998 90 222 22 22' },
  });
  console.log(`Created ${2} branches`);

  // Users
  const passwordHash = await bcrypt.hash('admin123', 12);
  const cashierHash = await bcrypt.hash('cashier123', 12);

  const owner = await prisma.user.create({
    data: { fullName: 'Иванов Иван', username: 'admin', passwordHash, roleId: roles[0].id, branchId: branch1.id },
  });
  const cashier = await prisma.user.create({
    data: { fullName: 'Кассир Алишер', username: 'cashier', passwordHash: cashierHash, roleId: roles[2].id, branchId: branch1.id },
  });
  const waiter = await prisma.user.create({
    data: { fullName: 'Официант Бекзод', username: 'waiter', passwordHash: cashierHash, roleId: roles[3].id, branchId: branch1.id },
  });
  const cook = await prisma.user.create({
    data: { fullName: 'Повар Нодир', username: 'cook', passwordHash: cashierHash, roleId: roles[4].id, branchId: branch1.id },
  });
  console.log(`Created ${4} users (admin/cashier/waiter/cook)`);

  // Categories
  const catFood = await prisma.category.create({
    data: { name: 'Еда', nameRu: 'Еда', nameEn: 'Food', nameUz: 'Ovqat', sortOrder: 1, icon: '🍽️', color: '#F97316' },
  });
  const catDrinks = await prisma.category.create({
    data: { name: 'Напитки', nameRu: 'Напитки', nameEn: 'Drinks', nameUz: 'Ichimliklar', sortOrder: 2, icon: '☕', color: '#3B82F6' },
  });
  const catDesserts = await prisma.category.create({
    data: { name: 'Десерты', nameRu: 'Десерты', nameEn: 'Desserts', nameUz: 'Shirinliklar', sortOrder: 3, icon: '🍰', color: '#EC4899' },
  });
  const catSnacks = await prisma.category.create({
    data: { name: 'Закуски', nameRu: 'Закуски', nameEn: 'Snacks', nameUz: 'Gazaklar', sortOrder: 4, icon: '🍟', color: '#EAB308' },
  });
  console.log(`Created ${4} categories`);

  // Kitchen stations
  const stationMain = await prisma.kitchenStation.create({
    data: { name: 'Основная кухня', sortOrder: 1 },
  });
  const stationBar = await prisma.kitchenStation.create({
    data: { name: 'Бар', sortOrder: 2 },
  });
  console.log(`Created ${2} kitchen stations`);

  // Printers
  const printerReceipt = await prisma.printer.create({
    data: { name: 'Кассовый принтер', type: 'LAN', ipAddress: '192.168.1.100', port: 9100, department: 'CAFE', paperWidth: 80 },
  });
  const printerKitchen = await prisma.printer.create({
    data: { name: 'Кухонный принтер', type: 'LAN', ipAddress: '192.168.1.101', port: 9100, department: 'KITCHEN', paperWidth: 80 },
  });
  console.log(`Created ${2} printers`);

  // Products — Еда
  const products = await Promise.all([
    prisma.product.create({
      data: {
        categoryId: catFood.id, sku: 'FOOD-001', name: 'Плов', nameRu: 'Плов', nameEn: 'Plov', nameUz: 'Palov',
        price: 35000, cost: 12000, taxRate: 12, kitchenStationId: stationMain.id,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: catFood.id, sku: 'FOOD-002', name: 'Шашлык', nameRu: 'Шашлык', nameEn: 'Shashlik', nameUz: 'Shashlik',
        price: 45000, cost: 18000, taxRate: 12, kitchenStationId: stationMain.id,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: catFood.id, sku: 'FOOD-003', name: 'Лагман', nameRu: 'Лагман', nameEn: 'Lagman', nameUz: 'Lagmon',
        price: 30000, cost: 10000, taxRate: 12, kitchenStationId: stationMain.id,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: catFood.id, sku: 'FOOD-004', name: 'Манты', nameRu: 'Манты', nameEn: 'Manti', nameUz: 'Manti',
        price: 28000, cost: 9000, taxRate: 12, kitchenStationId: stationMain.id,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: catFood.id, sku: 'FOOD-005', name: 'Самса', nameRu: 'Самса', nameEn: 'Samsa', nameUz: 'Samsa',
        price: 8000, cost: 3000, taxRate: 12, kitchenStationId: stationMain.id,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: catFood.id, sku: 'FOOD-006', name: 'Бургер', nameRu: 'Бургер', nameEn: 'Burger', nameUz: 'Burger',
        price: 38000, cost: 14000, taxRate: 12, kitchenStationId: stationMain.id,
      },
    }),
    // Напитки
    prisma.product.create({
      data: {
        categoryId: catDrinks.id, sku: 'DRINK-001', name: 'Чай', nameRu: 'Чай', nameEn: 'Tea', nameUz: 'Choy',
        price: 5000, cost: 1000, taxRate: 12, kitchenStationId: stationBar.id,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: catDrinks.id, sku: 'DRINK-002', name: 'Кофе', nameRu: 'Кофе', nameEn: 'Coffee', nameUz: 'Kofe',
        price: 15000, cost: 4000, taxRate: 12, kitchenStationId: stationBar.id,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: catDrinks.id, sku: 'DRINK-003', name: 'Сок', nameRu: 'Сок', nameEn: 'Juice', nameUz: 'Sharbat',
        price: 12000, cost: 5000, taxRate: 12, kitchenStationId: stationBar.id,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: catDrinks.id, sku: 'DRINK-004', name: 'Вода', nameRu: 'Вода', nameEn: 'Water', nameUz: 'Suv',
        price: 3000, cost: 1000, taxRate: 12, kitchenStationId: stationBar.id,
      },
    }),
    // Десерты
    prisma.product.create({
      data: {
        categoryId: catDesserts.id, sku: 'DESSERT-001', name: 'Чак-чак', nameRu: 'Чак-чак', nameEn: 'Chak-chak', nameUz: 'Chak-chak',
        price: 18000, cost: 7000, taxRate: 12, kitchenStationId: stationMain.id,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: catDesserts.id, sku: 'DESSERT-002', name: 'Торт', nameRu: 'Торт', nameEn: 'Cake', nameUz: 'Tort',
        price: 25000, cost: 10000, taxRate: 12, kitchenStationId: stationMain.id,
      },
    }),
    // Закуски
    prisma.product.create({
      data: {
        categoryId: catSnacks.id, sku: 'SNACK-001', name: 'Картошка фри', nameRu: 'Картошка фри', nameEn: 'French Fries', nameUz: 'Kartoshka fri',
        price: 15000, cost: 4000, taxRate: 12, kitchenStationId: stationMain.id,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: catSnacks.id, sku: 'SNACK-002', name: 'Салат Цезарь', nameRu: 'Салат Цезарь', nameEn: 'Caesar Salad', nameUz: 'Tsezar salati',
        price: 32000, cost: 12000, taxRate: 12, kitchenStationId: stationMain.id,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: catSnacks.id, sku: 'SNACK-003', name: 'Хумус', nameRu: 'Хумус', nameEn: 'Hummus', nameUz: 'Xumus',
        price: 18000, cost: 6000, taxRate: 12, kitchenStationId: stationMain.id,
      },
    }),
  ]);
  console.log(`Created ${products.length} products`);

  // Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: { fullName: 'Раҳимов Жамшид', phone: '+998901112233', status: 'REGULAR', bonusBalance: 50000 },
    }),
    prisma.customer.create({
      data: { fullName: 'Каримова Дилноза', phone: '+998903334455', status: 'VIP', bonusBalance: 120000 },
    }),
    prisma.customer.create({
      data: { fullName: 'Тўраев Акбар', phone: '+998905556677', status: 'NEW' },
    }),
  ]);
  console.log(`Created ${customers.length} customers`);

  // Devices
  await Promise.all([
    prisma.device.create({ data: { name: 'Кассовый терминал 1', code: 'POS-001', type: 'POS', branchId: branch1.id } }),
    prisma.device.create({ data: { name: 'Кассовый терминал 2', code: 'POS-002', type: 'POS', branchId: branch1.id } }),
    prisma.device.create({ data: { name: 'Кухонный дисплей', code: 'KITCHEN-001', type: 'KITCHEN', branchId: branch1.id } }),
  ]);
  console.log(`Created ${3} devices`);

  // Suppliers
  await Promise.all([
    prisma.supplier.create({ data: { name: 'МясоПром', phone: '+998901110000', contactPerson: 'Абдуллаев А.' } }),
    prisma.supplier.create({ data: { name: 'ОвощБазар', phone: '+998902220000', contactPerson: 'Исмоилов Б.' } }),
    prisma.supplier.create({ data: { name: 'НапиткиМастер', phone: '+998903330000', contactPerson: 'Каримов В.' } }),
  ]);
  console.log(`Created ${3} suppliers`);

  // Inventory for all products
  for (const product of products) {
    const qty = Math.floor(Math.random() * 90) + 10;
    const minQty = Math.floor(Math.random() * 5) + 2;
    await prisma.inventory.create({
      data: { productId: product.id, quantity: qty, minQuantity: minQty },
    });
  }
  console.log(`Created inventory for ${products.length} products`);

  console.log('\n✅ Seed completed successfully!');
  console.log('Login credentials:');
  console.log('  admin / admin123   (OWNER)');
  console.log('  cashier / cashier123 (CASHIER)');
  console.log('  waiter / cashier123  (WAITER)');
  console.log('  cook / cashier123    (COOK)');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
