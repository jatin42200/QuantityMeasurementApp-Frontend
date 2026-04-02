import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { THEME_STORAGE_KEY } from '../app.constants';
import {
  CalculatorOperation,
  MeasurementType,
  calculatorOperations,
  formatApiValue,
  formatMeasurementType,
  getTypeIcon,
  measurementCatalog,
  unitNames
} from '../measurement-data';
import { AuthService } from '../services/auth.service';
import { QuantityApiService } from '../services/quantity-api.service';
import { getApiErrorMessage } from '../utils/api-error';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard-page.component.html'
})
export class DashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly quantityApi = inject(QuantityApiService);
  private readonly route = inject(ActivatedRoute);

  readonly darkMode = signal(localStorage.getItem(THEME_STORAGE_KEY) === 'dark');
  readonly selectedType = signal<MeasurementType>('LENGTHUNIT');
  readonly selectedOperation = signal<CalculatorOperation>('convert');
  readonly operations = calculatorOperations;
  readonly measurementCatalog = measurementCatalog;
  readonly types = Object.entries(measurementCatalog) as Array<
    [MeasurementType, (typeof measurementCatalog)[MeasurementType]]
  >;
  readonly user = this.authService.user;
  readonly isAdmin = this.authService.isAdmin;
  readonly routeMessage = this.route.snapshot.queryParamMap.get('error') ?? '';
  readonly availableUnits = computed(() => unitNames(this.selectedType()));

  firstValue = 1;
  firstUnit = unitNames('LENGTHUNIT')[0];
  secondValue = 1;
  secondUnit = unitNames('LENGTHUNIT')[1];
  targetUnit = unitNames('LENGTHUNIT')[1];

  submitting = false;
  formError = '';
  resultTitle = 'Waiting for backend response';
  resultSummary = 'Choose a measurement type, enter values, and submit an operation.';
  rawResponse = '';

  toggleTheme(): void {
    const next = !this.darkMode();
    this.darkMode.set(next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
  }

  logout(): void {
    this.authService.logout();
  }

  setType(type: MeasurementType): void {
    this.selectedType.set(type);
    const units = unitNames(type);
    this.firstUnit = units[0];
    this.secondUnit = units[1] ?? units[0];
    this.targetUnit = units[1] ?? units[0];

    if (!measurementCatalog[type].supportsArithmetic && this.selectedOperation() !== 'convert' && this.selectedOperation() !== 'compare') {
      this.selectedOperation.set('convert');
    }

    this.clearMessages();
  }

  setOperation(operation: CalculatorOperation): void {
    if (
      !measurementCatalog[this.selectedType()].supportsArithmetic &&
      operation !== 'convert' &&
      operation !== 'compare'
    ) {
      this.formError = 'Temperature supports convert and compare only in this frontend.';
      return;
    }

    this.selectedOperation.set(operation);
    this.clearMessages();
  }

  async submit(): Promise<void> {
    this.submitting = true;
    this.formError = '';

    try {
      const payload = {
        value: Number(this.firstValue),
        unit: this.firstUnit,
        measurementType: this.selectedType()
      };

      if (this.selectedOperation() === 'convert') {
        const response = await this.quantityApi.convert(payload, this.targetUnit);
        this.resultTitle = 'Convert Result';
        this.resultSummary = `${formatApiValue(response.input)} -> ${formatApiValue(response.result)}`;
        this.rawResponse = JSON.stringify(response, null, 2);
        return;
      }

      const comparisonPayload = {
        thisQuantityDTO: payload,
        thatQuantityDTO: {
          value: Number(this.secondValue),
          unit: this.secondUnit,
          measurementType: this.selectedType()
        }
      };

      if (this.selectedOperation() === 'compare') {
        const response = await this.quantityApi.compare(comparisonPayload);
        this.resultTitle = 'Compare Result';
        this.resultSummary = response.isEqual
          ? 'The backend marked both quantities as equal.'
          : 'The backend marked both quantities as not equal.';
        this.rawResponse = JSON.stringify(response, null, 2);
        return;
      }

      const operation = this.selectedOperation();
      if (operation === 'convert' || operation === 'compare') {
        throw new Error('Unsupported operation branch');
      }

      const response = await this.quantityApi.calculate(operation, comparisonPayload);
      this.resultTitle = `${operation.toUpperCase()} Result`;
      this.resultSummary = `Ans = ${formatApiValue(response.result)}`;
      this.rawResponse = JSON.stringify(response, null, 2);
    } catch (error) {
      this.formError = getApiErrorMessage(error, 'Operation failed.');
      this.rawResponse = '';
    } finally {
      this.submitting = false;
    }
  }

  typeLabel(type: MeasurementType): string {
    return formatMeasurementType(type);
  }

  typeIcon(type: MeasurementType, color: string): string {
    return getTypeIcon(type, color);
  }

  operationLabel(operation: CalculatorOperation): string {
    return calculatorOperations.find((item) => item.value === operation)?.label ?? operation;
  }

  isOperationDisabled(operation: CalculatorOperation): boolean {
    return (
      !measurementCatalog[this.selectedType()].supportsArithmetic &&
      operation !== 'convert' &&
      operation !== 'compare'
    );
  }

  private clearMessages(): void {
    this.formError = '';
    this.resultTitle = 'Waiting for backend response';
    this.resultSummary = `Current type: ${formatMeasurementType(this.selectedType())}`;
    this.rawResponse = '';
  }
}
