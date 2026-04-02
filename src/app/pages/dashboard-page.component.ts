import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { THEME_STORAGE_KEY } from '../app.constants';
import {
  MeasurementType,
  UnitOption,
  formatMeasurementType,
  formatUnit,
  measurementCatalog,
  unitOptions
} from '../measurement-data';
import { AuthService } from '../services/auth.service';
import { QuantityApiService } from '../services/quantity-api.service';
import { getApiErrorMessage } from '../utils/api-error';

type DashboardAction = 'compare' | 'convert' | 'calculate';
type CalculatorApiOperation = 'add' | 'subtract' | 'multiply' | 'divide';

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

  readonly darkMode = signal(localStorage.getItem(THEME_STORAGE_KEY) !== 'light');
  readonly selectedType = signal<MeasurementType>('LENGTHUNIT');
  readonly selectedAction = signal<DashboardAction>('convert');
  selectedCalculatorOperation: CalculatorApiOperation = 'add';
  readonly measurementCatalog = measurementCatalog;
  readonly types = Object.entries(measurementCatalog) as Array<
    [MeasurementType, (typeof measurementCatalog)[MeasurementType]]
  >;
  readonly user = this.authService.user;
  readonly isAdmin = this.authService.isAdmin;
  readonly routeMessage = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('error') ?? '')),
    { initialValue: '' }
  );

  readonly availableUnits = computed(() => unitOptions(this.selectedType()));

  firstValue = 1;
  firstUnit = unitOptions('LENGTHUNIT')[0].value;
  secondValue = 1;
  secondUnit = unitOptions('LENGTHUNIT')[1].value;
  targetUnit = unitOptions('LENGTHUNIT')[2].value;

  submitting = false;
  formError = '';

  conversionValue = '12';
  compareSummary = 'Value 1 = Value 2';
  calculationSummary = 'Ans = 2';

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
    const units = unitOptions(type);
    this.firstUnit = units[0].value;
    this.secondUnit = units[1]?.value ?? units[0].value;
    this.targetUnit = units[1]?.value ?? units[0].value;

    if (!measurementCatalog[type].supportsArithmetic && this.selectedAction() === 'calculate') {
      this.selectedAction.set('convert');
    }

    this.formError = '';
  }

  setAction(action: DashboardAction): void {
    if (!measurementCatalog[this.selectedType()].supportsArithmetic && action === 'calculate') {
      this.formError = 'Temperature supports comparison and conversion only.';
      return;
    }

    this.selectedAction.set(action);
    this.formError = '';
  }

  setCalculatorOperation(operation: CalculatorApiOperation): void {
    this.selectedCalculatorOperation = operation;
    this.formError = '';
  }

  async runOperation(): Promise<void> {
    this.submitting = true;
    this.formError = '';

    try {
      const quantity1 = {
        value: Number(this.firstValue),
        unit: this.firstUnit,
        measurementType: this.selectedType()
      };

      if (this.selectedAction() === 'convert') {
        const response = await this.quantityApi.convert(quantity1, this.targetUnit);
        this.conversionValue = `${response.result.value}`;
        return;
      }

      const payload = {
        thisQuantityDTO: quantity1,
        thatQuantityDTO: {
          value: Number(this.secondValue),
          unit: this.secondUnit,
          measurementType: this.selectedType()
        }
      };

      if (this.selectedAction() === 'compare') {
        const response = await this.quantityApi.compare(payload);
        this.compareSummary = response.isEqual ? 'Value 1 = Value 2' : 'Value 1 != Value 2';
        return;
      }

      const response = await this.quantityApi.calculate(this.selectedCalculatorOperation, payload);
      this.calculationSummary = `Ans = ${typeof response.result === 'number' ? response.result : response.result.value}`;
    } catch (error) {
      this.formError = getApiErrorMessage(error, 'Operation failed.');
    } finally {
      this.submitting = false;
    }
  }

  typeLabel(type: MeasurementType): string {
    return formatMeasurementType(type);
  }

  typeAccent(type: MeasurementType): string {
    return measurementCatalog[type].accent;
  }

  typeImage(type: MeasurementType): string {
    return measurementCatalog[type].image;
  }

  unitLabel(unitValue: string): string {
    return formatUnit(this.selectedType(), unitValue);
  }

  actionLabel(): string {
    return this.selectedAction() === 'compare'
      ? 'Comparison'
      : this.selectedAction() === 'convert'
        ? 'Conversion'
        : 'Calculator';
  }

  calculatorSymbol(operation: CalculatorApiOperation): string {
    if (operation === 'add') return '+';
    if (operation === 'subtract') return '-';
    if (operation === 'multiply') return '*';
    return '/';
  }

  isActionDisabled(action: DashboardAction): boolean {
    return action === 'calculate' && !measurementCatalog[this.selectedType()].supportsArithmetic;
  }

  unitTrack(_: number, unit: UnitOption): string {
    return unit.value;
  }
}
