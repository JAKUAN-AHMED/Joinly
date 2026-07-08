import 'dotenv/config';
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { UserRole, UserStatus } from './common/enums';
import { typeOrmConfig } from './config/typeorm.config';
import { Category } from './modules/categories/entities';
import { User } from './modules/users/entities';

/** Category chips exactly as they appear in the Figma mobile designs. */
const FIGMA_CATEGORIES: { categoryName: string }[] = [
  { categoryName: 'Football' },
  { categoryName: 'Cycling' },
  { categoryName: 'Swimming' },
  { categoryName: 'Basketball' },
  { categoryName: 'Skiing' },
  { categoryName: 'Climbing' },
  { categoryName: 'Tennis' },
  { categoryName: 'Table Tennis' },
  { categoryName: 'Badminton' },
  { categoryName: 'Handball' },
  { categoryName: 'Golf' },
  { categoryName: 'Boxing' },
  { categoryName: 'Rowing' },
];

async function seed(): Promise<void> {
  const dataSource = new DataSource({
    ...(typeOrmConfig() as import('typeorm').DataSourceOptions),
  });
  await dataSource.initialize();

  const categoryRepository = dataSource.getRepository(Category);
  for (const item of FIGMA_CATEGORIES) {
    const exists = await categoryRepository.findOne({
      where: { categoryName: item.categoryName },
    });
    if (!exists) await categoryRepository.save(categoryRepository.create(item));
  }
  console.log(`Seeded ${FIGMA_CATEGORIES.length} categories`);

  const userRepository = dataSource.getRepository(User);
  const adminEmail = 'admin@contenthub.io'; // Figma Admin Login placeholder
  const admin = await userRepository.findOne({ where: { email: adminEmail } });
  if (!admin) {
    await userRepository.save(
      userRepository.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: await bcrypt.hash('admin123', 10),
        role: UserRole.Admin,
        status: UserStatus.Active,
        isEmailVerified: true,
      }),
    );
    console.log(`Seeded admin: ${adminEmail} / admin123`);
  } else {
    console.log('Admin already exists');
  }

  await dataSource.destroy();
}

void seed();
