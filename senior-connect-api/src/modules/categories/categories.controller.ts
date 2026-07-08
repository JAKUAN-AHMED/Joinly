import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { CategoriesService } from './categories.service';
import { CATEGORIES_ROUTES } from './categories.routes';
import {
  AdminListCategoriesDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto';

@Controller(CATEGORIES_ROUTES.ROOT)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /** Mobile — active categories (chips, interests picker, create-activity picker) */
  @Get(CATEGORIES_ROUTES.LIST)
  listActive() {
    return this.categoriesService.listActive();
  }

  /** Admin — Add Category */
  @Roles(UserRole.Admin)
  @Post(CATEGORIES_ROUTES.ADMIN_CATEGORIES)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  /** Admin — categories table (Category Name, Activity Count, Status) */
  @Roles(UserRole.Admin)
  @Get(CATEGORIES_ROUTES.ADMIN_CATEGORIES)
  adminList(@Query() query: AdminListCategoriesDto) {
    return this.categoriesService.adminList(query);
  }

  /** Admin — edit / enable / disable */
  @Roles(UserRole.Admin)
  @Patch(CATEGORIES_ROUTES.ADMIN_CATEGORY)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  /** Admin — delete */
  @Roles(UserRole.Admin)
  @Delete(CATEGORIES_ROUTES.ADMIN_CATEGORY)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
