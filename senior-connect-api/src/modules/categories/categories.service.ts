import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CategoryStatus } from '../../common/enums';
import { ServiceResponse } from '../../common/interfaces/api-response.interface';
import { buildMeta, getPagination } from '../../common/utils/pagination.util';
import { Activity } from '../activities/entities';
import {
  AdminCategoryRow,
  AdminCategoryStats,
  CategoryItem,
} from './interfaces/categories.interface';
import { Category } from './entities';
import {
  AdminListCategoriesDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  /** Mobile — category chips & "Choose Interests" */
  async listActive(): Promise<ServiceResponse<CategoryItem[]>> {
    const categories = await this.categoryRepository.find({
      where: { status: CategoryStatus.Active },
      order: { categoryName: 'ASC' },
    });
    return { message: 'Categories retrieved successfully', data: categories };
  }

  /** Admin — "Add Category" */
  async create(dto: CreateCategoryDto): Promise<ServiceResponse<CategoryItem>> {
    const existing = await this.categoryRepository.findOne({
      where: { categoryName: ILike(dto.categoryName) },
    });
    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }
    const category = await this.categoryRepository.save(
      this.categoryRepository.create({
        categoryName: dto.categoryName,
      }),
    );
    return { message: 'Category created successfully', data: category };
  }

  /** Admin — categories table with activityCount + header stats */
  async adminList(
    query: AdminListCategoriesDto,
  ): Promise<ServiceResponse<{ stats: AdminCategoryStats; categories: AdminCategoryRow[] }>> {
    const { page, limit, skip } = getPagination(query);
    const where = {
      ...(query.search ? { categoryName: ILike(`%${query.search}%`) } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [categories, total] = await this.categoryRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const rows: AdminCategoryRow[] = await Promise.all(
      categories.map(async (category) => ({
        id: category.id,
        categoryName: category.categoryName,
        status: category.status,
        activityCount: await this.activityRepository.count({
          where: { categoryId: category.id },
        }),
      })),
    );

    const stats: AdminCategoryStats = {
      totalCategories: await this.categoryRepository.count(),
      activeNow: await this.categoryRepository.count({
        where: { status: CategoryStatus.Active },
      }),
    };

    return {
      message: 'Categories retrieved successfully',
      data: { stats, categories: rows },
      meta: buildMeta(page, limit, total),
    };
  }

  /** Admin — update name/status (Active | Disabled) */
  async update(id: string, dto: UpdateCategoryDto): Promise<ServiceResponse<CategoryItem>> {
    const category = await this.findById(id);
    if (dto.categoryName && dto.categoryName !== category.categoryName) {
      const duplicate = await this.categoryRepository.findOne({
        where: { categoryName: ILike(dto.categoryName) },
      });
      if (duplicate) throw new ConflictException('Category with this name already exists');
    }
    Object.assign(category, dto);
    const saved = await this.categoryRepository.save(category);
    return { message: 'Category updated successfully', data: saved };
  }

  /** Admin — delete category */
  async remove(id: string): Promise<ServiceResponse<null>> {
    const category = await this.findById(id);
    const activityCount = await this.activityRepository.count({
      where: { categoryId: id },
    });
    if (activityCount > 0) {
      throw new ConflictException(
        'Category has activities. Disable it instead of deleting.',
      );
    }
    await this.categoryRepository.remove(category);
    return { message: 'Category deleted successfully', data: null };
  }

  private async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}
