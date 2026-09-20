export interface ValidatedKPI<T> {
  key: string;
  value: T;
  source: string;
  valid: boolean;
  retrievedAt: string;
  methodology?: string;
  previousValue?: T;
  delta?: number;
}

export function createValidatedKPI<T>(
  key: string,
  value: T,
  source: string,
  validator: (val: T) => boolean = (v) => v !== null && v !== undefined && !Number.isNaN(v),
  methodology?: string
): ValidatedKPI<T> {
  const isValid = validator(value);
  const kpi: ValidatedKPI<T> = {
    key,
    value,
    source,
    valid: isValid,
    retrievedAt: new Date().toISOString(),
    ...(methodology !== undefined ? { methodology } : {}),
  };

  if (process.env['DEBUG_GITHUB_DATA'] === 'true') {
    console.log(`  [DATA] ${key} ← ${source} (value: ${JSON.stringify(value)}, valid: ${isValid})`);
  }

  return kpi;
}

export function validateNumber(value: number, min = 0): boolean {
  return typeof value === 'number' && !Number.isNaN(value) && value >= min;
}

export function validateString(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}
