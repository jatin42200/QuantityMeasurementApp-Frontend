import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../app.constants';
import { CalculatorOperation, MeasurementRecord, QuantityInputPayload, QuantityPayload } from '../measurement-data';

type ConvertResponse = {
  success: boolean;
  operation: string;
  input: QuantityPayload;
  targetUnit: string;
  result: QuantityPayload;
  error?: string;
};

type CompareResponse = {
  success: boolean;
  operation: string;
  quantity1: QuantityPayload;
  quantity2: QuantityPayload;
  isEqual: boolean;
  error?: string;
};

type QuantityResultResponse = {
  success: boolean;
  operation: string;
  quantity1: QuantityPayload;
  quantity2: QuantityPayload;
  result: QuantityPayload | number;
  error?: string;
};

type MeasurementHistoryResponse = {
  success: boolean;
  total: number;
  measurements: MeasurementRecord[];
};

@Injectable({ providedIn: 'root' })
export class QuantityApiService {
  private readonly http = inject(HttpClient);

  convert(input: QuantityPayload, targetUnit: string): Promise<ConvertResponse> {
    return firstValueFrom(
      this.http.post<ConvertResponse>(`${API_BASE_URL}/api/v1/quantities/convert`, input, {
        params: { targetUnit }
      })
    );
  }

  compare(request: QuantityInputPayload): Promise<CompareResponse> {
    return firstValueFrom(
      this.http.post<CompareResponse>(`${API_BASE_URL}/api/v1/quantities/compare`, request)
    );
  }

  calculate(
    operation: Exclude<CalculatorOperation, 'convert' | 'compare'>,
    request: QuantityInputPayload
  ): Promise<QuantityResultResponse> {
    return firstValueFrom(
      this.http.post<QuantityResultResponse>(`${API_BASE_URL}/api/v1/quantities/${operation}`, request)
    );
  }

  getMeasurements(operation?: string, measurementType?: string): Promise<MeasurementHistoryResponse> {
    if (operation && !measurementType) {
      return firstValueFrom(
        this.http.get<MeasurementHistoryResponse>(
          `${API_BASE_URL}/api/v1/measurements/operation/${operation}`
        )
      );
    }

    if (measurementType && !operation) {
      return firstValueFrom(
        this.http.get<MeasurementHistoryResponse>(
          `${API_BASE_URL}/api/v1/measurements/type/${measurementType}`
        )
      );
    }

    return firstValueFrom(
      this.http.get<MeasurementHistoryResponse>(`${API_BASE_URL}/api/v1/measurements`)
    );
  }
}
