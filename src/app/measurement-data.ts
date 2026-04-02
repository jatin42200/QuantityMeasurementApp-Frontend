export type MeasurementType = 'LENGTHUNIT' | 'WEIGHTUNIT' | 'VOLUMEUNIT' | 'TEMPERATUREUNIT';
export type CalculatorOperation = 'convert' | 'compare' | 'add' | 'subtract' | 'multiply' | 'divide';
export type SupportedRole = 'ROLE_USER' | 'ROLE_ADMIN';

export type QuantityPayload = {
  value: number;
  unit: string;
  measurementType: MeasurementType;
};

export type QuantityInputPayload = {
  thisQuantityDTO: QuantityPayload;
  thatQuantityDTO: QuantityPayload;
};

export type MeasurementRecord = {
  id: number;
  operation: string;
  operand1: string | null;
  operand2: string | null;
  result: string | null;
  error: string | null;
  measurementType: MeasurementType | string | null;
  operationType: string | null;
  isError: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AuthUser = {
  email: string;
  role: SupportedRole | string;
  token: string;
  expiresAt: number;
};

export type UnitOption = {
  label: string;
  value: string;
};

export type MeasurementDefinition = {
  label: string;
  shortLabel: string;
  image: string;
  iconColor: string;
  accent: string;
  units: UnitOption[];
  supportsArithmetic: boolean;
};

export const measurementCatalog: Record<MeasurementType, MeasurementDefinition> = {
  LENGTHUNIT: {
    label: 'Length',
    shortLabel: 'L',
    image: 'assets/type-length.svg',
    iconColor: '#f6b21a',
    accent: '#ff9f43',
    units: [
      { label: 'Millimetre', value: 'MILLIMETRE' },
      { label: 'Centimetre', value: 'CENTIMETERS' },
      { label: 'Inch', value: 'INCHES' },
      { label: 'Feet', value: 'FEET' },
      { label: 'Yard', value: 'YARDS' }
    ],
    supportsArithmetic: true
  },
  WEIGHTUNIT: {
    label: 'Weight',
    shortLabel: 'W',
    image: 'assets/type-weight.svg',
    iconColor: '#f6b21a',
    accent: '#fd5d5d',
    units: [
      { label: 'Milligram', value: 'MILLIGRAM' },
      { label: 'Gram', value: 'GRAM' },
      { label: 'Kilogram', value: 'KILOGRAM' },
      { label: 'Ounce', value: 'OUNCE' },
      { label: 'Pound', value: 'POUND' },
      { label: 'Tonne', value: 'TONNE' }
    ],
    supportsArithmetic: true
  },
  VOLUMEUNIT: {
    label: 'Volume',
    shortLabel: 'V',
    image: 'assets/type-volume.svg',
    iconColor: '#67d1d4',
    accent: '#3ab8a3',
    units: [
      { label: 'Millilitre', value: 'MILLILITRE' },
      { label: 'Litre', value: 'LITRE' },
      { label: 'Gallon', value: 'GALLON' },
      { label: 'Cubic metre', value: 'CUBIC_METRE' }
    ],
    supportsArithmetic: true
  },
  TEMPERATUREUNIT: {
    label: 'Temperature',
    shortLabel: 'T',
    image: 'assets/type-temperature.svg',
    iconColor: '#ff5a1f',
    accent: '#4f7cff',
    units: [
      { label: 'Celsius', value: 'CELSIUS' },
      { label: 'Fahrenheit', value: 'FAHRENHEIT' },
      { label: 'Kelvin', value: 'KELVIN' }
    ],
    supportsArithmetic: false
  }
};

export const historyOperationOptions = ['CONVERT', 'COMPARE', 'ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE'];

export function unitOptions(type: MeasurementType): UnitOption[] {
  return measurementCatalog[type].units;
}

export function formatMeasurementType(type: MeasurementType | string | null | undefined): string {
  if (!type) return 'Unknown';
  return measurementCatalog[type as MeasurementType]?.label ?? type;
}

export function formatUnit(type: MeasurementType, value: string): string {
  return measurementCatalog[type].units.find((unit) => unit.value === value)?.label ?? value;
}

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '-';
  return value.replace('T', ' ');
}

export function formatApiValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object') {
    const quantity = value as Partial<QuantityPayload>;
    if (
      typeof quantity.value === 'number' &&
      typeof quantity.unit === 'string' &&
      typeof quantity.measurementType === 'string'
    ) {
      return `${quantity.value} ${quantity.unit} (${formatMeasurementType(quantity.measurementType)})`;
    }
    return JSON.stringify(value, null, 2);
  }
  return '-';
}

export function getTypeIcon(type: MeasurementType, color: string): string {
  if (type === 'LENGTHUNIT') {
    return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M11 30.5 30.5 11c1.2-1.2 3.1-1.2 4.3 0l4.2 4.2c1.2 1.2 1.2 3.1 0 4.3L19.5 39c-.8.8-1.9 1.1-3 .9l-6.5-1.4-1.4-6.5c-.2-1.1.1-2.2.9-3Z" stroke="${color}" stroke-width="3.6" stroke-linejoin="round"/><path d="m20 18 4 4m2-8 4 4" stroke="${color}" stroke-width="3.6" stroke-linecap="round"/></svg>`;
  }
  if (type === 'WEIGHTUNIT') {
    return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 11v27m-10-18 10-9 10 9M12 20h24" stroke="${color}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 22h11l-3 12m24-12H29l3 12" stroke="${color}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  if (type === 'TEMPERATUREUNIT') {
    return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 12a4 4 0 0 1 4 4v12.7a8 8 0 1 1-8 0V16a4 4 0 0 1 4-4Z" stroke="${color}" stroke-width="3.6"/><path d="M24 31v-9" stroke="${color}" stroke-width="3.6" stroke-linecap="round"/></svg>`;
  }
  return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="10" y="12" width="28" height="26" rx="4" stroke="${color}" stroke-width="3.6"/><path d="M17 9v8m14-8v8M10 21h28" stroke="${color}" stroke-width="3.6" stroke-linecap="round"/></svg>`;
}
