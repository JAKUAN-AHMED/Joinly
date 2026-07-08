import { PaginationMeta } from '../interfaces/api-response.interface';

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export const getPagination = (
  input: PaginationInput,
): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, Number(input.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(input.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

export const buildMeta = (page: number, limit: number, total: number): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
});
