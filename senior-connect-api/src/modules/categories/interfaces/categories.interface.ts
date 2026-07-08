import { CategoryStatus } from '../../../common/enums';

export interface CategoryItem {
  id: string;
  categoryName: string;
  status: CategoryStatus;
}

export interface AdminCategoryRow extends CategoryItem {
  activityCount: number;
}

export interface AdminCategoryStats {
  totalCategories: number;
  activeNow: number;
}
