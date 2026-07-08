import { ValueTransformer } from 'typeorm';

/** pg returns numeric/decimal columns as strings — expose them as numbers. */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null): number | null | undefined => value,
  from: (value?: string | null): number | null =>
    value === null || value === undefined ? null : Number(value),
};
