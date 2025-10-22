import { NgModule, LOCALE_ID, Injectable, Inject, Optional } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MaterialModule } from './material-module';
import { LoginService } from './core/login.service';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService } from './in-memory-data.service';
import { PopupModule } from './shared/popup/popup.module';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { Platform } from '@angular/cdk/platform';

// Registrar localização em português
registerLocaleData(localePt);

// Classe personalizada para o DateAdapter brasileiro
@Injectable()
export class BrazilianDateAdapter extends NativeDateAdapter {

  constructor(@Optional() @Inject(MAT_DATE_LOCALE) matDateLocale: string) {
    super(matDateLocale || 'pt-BR');
  }

  override parse(value: any): Date | null {
    // Primeiro, tentar parse com valor original se for Date
    if (value instanceof Date) {
      return this.isValid(value) ? value : null;
    }

    if (typeof value === 'string' && value.trim()) {
      const cleanValue = value.trim();

      // Verificar se está no formato brasileiro dd/mm/yyyy ou dd/mm/yy
      const brazilianDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
      const match = cleanValue.match(brazilianDateRegex);

      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        let year = parseInt(match[3], 10);

        // Se o ano tem 2 dígitos, assumir século 21 para anos <= 30, século 20 para anos > 30
        if (year < 100) {
          if (year <= 30) {
            year += 2000;
          } else {
            year += 1900;
          }
        }

        // Verificar se os valores estão em ranges válidos
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
          // Criar a data
          const date = new Date(year, month - 1, day);

          // Verificar se a data criada corresponde aos valores fornecidos
          // Isso evita datas inválidas como 31/02
          if (date.getFullYear() === year &&
              date.getMonth() === month - 1 &&
              date.getDate() === day) {
            return date;
          }
        }
      }

      // Se não conseguiu parse brasileiro, tentar outros formatos
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (isoDateRegex.test(cleanValue)) {
        const date = new Date(cleanValue + 'T00:00:00');
        return this.isValid(date) ? date : null;
      }
    }

    return null;
  }

  override format(date: Date, displayFormat: Object): string {
    if (!this.isValid(date)) {
      return '';
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  override isValid(date: Date | null): boolean {
    if (!date || !(date instanceof Date)) {
      return false;
    }
    return !isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100;
  }

  override isDateInstance(obj: any): boolean {
    return obj instanceof Date;
  }

  override invalid(): Date {
    return new Date(NaN);
  }

  override today(): Date {
    return new Date();
  }
}

// Formatos de data brasileiros
export const BRAZILIAN_DATE_FORMATS = {
  parse: {
    dateInput: ['DD/MM/YYYY', 'DD/MM/YY', 'D/M/YYYY', 'D/M/YY'],
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialModule,
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, { delay: 500, passThruUnknownUrl: true }),
    PopupModule,
  ],
  providers: [
    LoginService,
    provideAnimationsAsync('noop'),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: DateAdapter, useClass: BrazilianDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: BRAZILIAN_DATE_FORMATS },
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
