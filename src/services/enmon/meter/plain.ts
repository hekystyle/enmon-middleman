import { AxiosResponse } from 'axios';
import { BaseEnmonApiClient } from '../baseApiClient';

export class PlainMeterApiClient extends BaseEnmonApiClient {
  public async sendValue({
    customerId,
    token,
    date,
    devEUI,
    value,
  }: {
    customerId: string;
    token: string;
    devEUI: string;
    date: Date;
    value: number;
  }): Promise<AxiosResponse<unknown, unknown>> {
    return await this.http.post<unknown>(
      `/meter/plain/${customerId}/value`,
      {
        devEUI,
        date,
        value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
      },
    );
  }
}
