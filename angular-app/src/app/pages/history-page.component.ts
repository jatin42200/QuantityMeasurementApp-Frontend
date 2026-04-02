import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { THEME_STORAGE_KEY } from '../app.constants';
import {
  MeasurementRecord,
  MeasurementType,
  formatMeasurementType,
  formatTimestamp,
  historyOperationOptions,
  measurementCatalog
} from '../measurement-data';
import { AuthService } from '../services/auth.service';
import { QuantityApiService } from '../services/quantity-api.service';
import { getApiErrorMessage } from '../utils/api-error';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './history-page.component.html'
})
export class HistoryPageComponent {
  private readonly authService = inject(AuthService);
  private readonly quantityApi = inject(QuantityApiService);

  readonly darkMode = signal(localStorage.getItem(THEME_STORAGE_KEY) === 'dark');
  readonly user = this.authService.user;
  readonly operationOptions = historyOperationOptions;
  readonly typeOptions = Object.keys(measurementCatalog) as MeasurementType[];

  loading = false;
  errorMessage = '';
  selectedOperation = '';
  selectedType = '';
  records: MeasurementRecord[] = [];

  constructor() {
    void this.loadMeasurements();
  }

  toggleTheme(): void {
    const next = !this.darkMode();
    this.darkMode.set(next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
  }

  logout(): void {
    this.authService.logout();
  }

  async loadMeasurements(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const response = await this.quantityApi.getMeasurements(
        this.selectedOperation || undefined,
        this.selectedType || undefined
      );

      this.records =
        this.selectedOperation && this.selectedType
          ? response.measurements.filter(
              (record) =>
                record.operation === this.selectedOperation &&
                record.measurementType === this.selectedType
            )
          : response.measurements;
    } catch (error) {
      this.errorMessage = getApiErrorMessage(error, 'Failed to load measurement history.');
      this.records = [];
    } finally {
      this.loading = false;
    }
  }

  formatType(type: string | null): string {
    return formatMeasurementType(type);
  }

  formatWhen(timestamp: string | null): string {
    return formatTimestamp(timestamp);
  }
}
