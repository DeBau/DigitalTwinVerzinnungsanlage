import { LOCALE } from './sprache.js';

export const fmt0 = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
export const fmt1 = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
