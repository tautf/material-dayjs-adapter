# Day.js DateAdapter for Angular Material

## Intention

If you wan't to use Day.js instead of Moment, Luxon or Date-FNS in combination with Angular Material, things can get tricky.

This library works the exact same as `@angular/material-moment-adapter` just like `Day.js` is a drop-in replacement for `Moment.js`

## Usage

```ts
import {
    MAT_DAYJS_DATE_FORMATS,
    DayjsDateAdapter,
    MAT_DAYJS_DATE_ADAPTER_OPTIONS,
} from '@tautf/material-dayjs-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
```
