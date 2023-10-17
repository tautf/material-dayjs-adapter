import { Inject, Injectable, Optional, InjectionToken } from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

import dayjs, { Dayjs } from 'dayjs/esm';
import utc from 'dayjs/esm/plugin/utc';
import localeData from 'dayjs/esm/plugin/localeData';
import LocalizedFormat from 'dayjs/esm/plugin/localizedFormat';

/** Configurable options for {@see DayjsDateAdapter}. */
export interface MatDayjsDateAdapterOptions {
    /**
     * Turns the use of utc dates on or off.
     * Changing this will change how Angular Material components like DatePicker output dates.
     * {@default false}
     */
    useUtc?: boolean;
}

/** InjectionToken for dayjs date adapter to configure options. */
export const MAT_DAYJS_DATE_ADAPTER_OPTIONS = new InjectionToken<MatDayjsDateAdapterOptions>(
    'MAT_DAYJS_DATE_ADAPTER_OPTIONS',
    {
        providedIn: 'root',
        factory: MAT_DAYJS_DATE_ADAPTER_OPTIONS_FACTORY,
    },
);

/** @docs-private */
export function MAT_DAYJS_DATE_ADAPTER_OPTIONS_FACTORY(): MatDayjsDateAdapterOptions {
    return {
        useUtc: false,
    };
}

/** Creates an array and fills it with values. */
function range<T>(length: number, valueFunction: (index: number) => T): T[] {
    const valuesArray = Array(length);
    for (let i = 0; i < length; i++) {
        valuesArray[i] = valueFunction(i);
    }
    return valuesArray;
}

/** Adapts dayjs.js Dates for use with Angular Material. */
@Injectable()
export class DayjsDateAdapter extends DateAdapter<Dayjs> {
    localeData: Partial<{
        firstDayOfWeek: number;
        longMonths: string[];
        shortMonths: string[];
        dates: string[];
        longDaysOfWeek: string[];
        shortDaysOfWeek: string[];
        narrowDaysOfWeek: string[];
    }> = {};

    constructor(
        @Optional() @Inject(MAT_DATE_LOCALE) dateLocale: string,
        @Optional()
        @Inject(MAT_DAYJS_DATE_ADAPTER_OPTIONS)
        private _options?: MatDayjsDateAdapterOptions,
    ) {
        super();
        dayjs.extend(utc);
        dayjs.extend(localeData);
        dayjs.extend(LocalizedFormat);
        this.setLocale(dateLocale || dayjs.locale());
    }

    override setLocale(locale: string) {
        super.setLocale(locale);

        let dayjsLocaleData = dayjs.localeData();
        this.localeData = {
            firstDayOfWeek: dayjsLocaleData.firstDayOfWeek(),
            longMonths: dayjsLocaleData.months(),
            shortMonths: dayjsLocaleData.monthsShort(),
            dates: range(31, (i) => this.createDate(2017, 0, i + 1).format('D')),
            longDaysOfWeek: dayjsLocaleData.weekdays(),
            shortDaysOfWeek: dayjsLocaleData.weekdaysShort(),
            narrowDaysOfWeek: dayjsLocaleData.weekdaysMin(),
        };
    }

    getYear(date: Dayjs): number {
        return this.clone(date).year();
    }

    getMonth(date: Dayjs): number {
        return this.clone(date).month();
    }

    getDate(date: Dayjs): number {
        return this.clone(date).date();
    }

    getDayOfWeek(date: Dayjs): number {
        return this.clone(date).day();
    }

    getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
        return style == 'long' ? this.localeData.longMonths : this.locale.shortMonths;
    }

    getDateNames(): string[] {
        return this.localeData.dates!;
    }

    getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
        if (style == 'long') {
            return this.localeData.longDaysOfWeek!;
        }
        if (style == 'short') {
            return this.localeData.shortDaysOfWeek!;
        }
        return this.localeData.narrowDaysOfWeek!;
    }

    getYearName(date: Dayjs): string {
        return this.clone(date).format('YYYY');
    }

    getFirstDayOfWeek(): number {
        return this.localeData.firstDayOfWeek!;
    }

    getNumDaysInMonth(date: Dayjs): number {
        return this.clone(date).daysInMonth();
    }

    clone(date: Dayjs): Dayjs {
        return date.clone().locale(this.locale);
    }

    createDate(year: number, month: number, date: number): Dayjs {
        if (month < 0 || month > 11) {
            throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
        }

        if (date < 1) {
            throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
        }

        const result = this._createInstance(dayjs().year(year).month(month).date(date)).locale(this.locale);

        // If the result isn't valid, the date must have been out of bounds for this month.
        if (!result.isValid()) {
            throw Error(`Invalid date "${date}" for month with index "${month}".`);
        }

        return result;
    }

    today(): Dayjs {
        return dayjs().locale(this.locale);
    }

    parse(value: any, parseFormat: string): Dayjs | null {
        if (value && typeof value == 'string') {
            return this._createInstance(value, parseFormat).locale(this.locale);
        }
        return value ? this._createInstance(value).locale(this.locale) : null;
    }

    format(date: Dayjs, displayFormat: string): string {
        if (!date.isValid()) {
            throw Error('DayjsDateAdapter: Cannot format invalid date.');
        }
        return date.format(displayFormat);
    }

    addCalendarYears(date: Dayjs, years: number): Dayjs {
        return date.add(years, 'year');
    }

    addCalendarMonths(date: Dayjs, months: number): Dayjs {
        return date.add(months, 'month');
    }

    addCalendarDays(date: Dayjs, days: number): Dayjs {
        return date.add(days, 'day');
    }

    toIso8601(date: Dayjs): string {
        return date.toISOString();
    }

    /**
     * Returns the given value if given a valid dayjs or null. Deserializes valid ISO 8601 strings
     * (https://www.ietf.org/rfc/rfc3339.txt) and valid Date objects into valid dayjss and empty
     * string into null. Returns an invalid date for all other values.
     */
    override deserialize(value: any): Dayjs | null {
        let date;
        if (value instanceof Date) {
            date = this._createInstance(value).locale(this.locale);
        } else if (this.isDateInstance(value)) {
            // Note: assumes that cloning also sets the correct locale.
            return this.clone(value);
        }
        if (typeof value === 'string') {
            if (!value) {
                return null;
            }
            date = this._createInstance(value).locale(this.locale);
        }
        if (date && this.isValid(date)) {
            return this._createInstance(date).locale(this.locale);
        }
        return super.deserialize(value);
    }

    isDateInstance(obj: any): boolean {
        return dayjs.isDayjs(obj);
    }

    isValid(date: Dayjs): boolean {
        return this.clone(date).isValid();
    }

    invalid(): Dayjs {
        return dayjs(null);
    }

    private _createInstance(date?: string | number | Date | Dayjs, format?: string): Dayjs {
        const { useUtc }: MatDayjsDateAdapterOptions = this._options || {};
        return useUtc ? dayjs.utc(date, format) : dayjs(date, format);
    }
}
