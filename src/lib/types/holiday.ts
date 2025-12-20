/**
 * Holiday data from Nager.Date API
 * https://date.nager.at/Api
 */
export type NagerHoliday = {
	date: string; // "YYYY-MM-DD" format
	localName: string;
	name: string;
	countryCode: string;
	fixed: boolean;
	global: boolean;
	counties: string[] | null;
	launchYear: number | null;
	types: HolidayType[];
};

export type HolidayType = 'Public' | 'Bank' | 'School' | 'Authorities' | 'Optional' | 'Observance';

/**
 * Simplified holiday for frontend use
 */
export type Holiday = {
	date: string;
	name: string;
	localName: string;
	isPublic: boolean;
};

/**
 * Holiday cache entry stored in database
 */
export type HolidayCacheEntry = {
	id: string; // "countryCode-year" e.g., "US-2025"
	countryCode: string;
	year: number;
	holidays: Holiday[];
	fetchedAt: Date;
	expiresAt: Date;
};

/**
 * Result of checking for holiday conflicts
 */
export type HolidayConflict = {
	holiday: Holiday;
	habits: Array<{ id: string; title: string }>;
	suggestedDate: string;
};

/**
 * Supported country codes for Nager.Date API
 * Common ones listed for reference, but any ISO 3166-1 alpha-2 code works
 */
export const SUPPORTED_COUNTRIES = [
	'AD',
	'AL',
	'AR',
	'AT',
	'AU',
	'AX',
	'BA',
	'BB',
	'BE',
	'BG',
	'BJ',
	'BO',
	'BR',
	'BS',
	'BW',
	'BY',
	'BZ',
	'CA',
	'CH',
	'CL',
	'CN',
	'CO',
	'CR',
	'CU',
	'CY',
	'CZ',
	'DE',
	'DK',
	'DO',
	'EC',
	'EE',
	'EG',
	'ES',
	'FI',
	'FO',
	'FR',
	'GA',
	'GB',
	'GD',
	'GI',
	'GL',
	'GM',
	'GR',
	'GT',
	'GY',
	'HN',
	'HR',
	'HT',
	'HU',
	'ID',
	'IE',
	'IM',
	'IS',
	'IT',
	'JE',
	'JM',
	'JP',
	'KR',
	'LI',
	'LS',
	'LT',
	'LU',
	'LV',
	'MA',
	'MC',
	'MD',
	'ME',
	'MG',
	'MK',
	'MN',
	'MT',
	'MX',
	'MZ',
	'NA',
	'NE',
	'NG',
	'NI',
	'NL',
	'NO',
	'NZ',
	'PA',
	'PE',
	'PH',
	'PL',
	'PR',
	'PT',
	'PY',
	'RO',
	'RS',
	'RU',
	'SE',
	'SG',
	'SI',
	'SJ',
	'SK',
	'SM',
	'SR',
	'SV',
	'TN',
	'TR',
	'UA',
	'US',
	'UY',
	'VA',
	'VE',
	'VN',
	'ZA',
	'ZW'
] as const;

export type SupportedCountryCode = (typeof SUPPORTED_COUNTRIES)[number];

/**
 * Check if a country code is supported
 */
export function isValidCountryCode(code: string): code is SupportedCountryCode {
	return SUPPORTED_COUNTRIES.includes(code.toUpperCase() as SupportedCountryCode);
}
