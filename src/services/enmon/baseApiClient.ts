import axios, { AxiosInstance } from 'axios';

export enum EnmonEnv {
  App = 'app',
  Dev = 'dev',
}

export const isEnmonEnv = (value: unknown): value is EnmonEnv =>
  typeof value === 'string' && Object.values(EnmonEnv).some(env => env === value);

export class BaseEnmonApiClient {
  protected readonly http: AxiosInstance;

  constructor(env: EnmonEnv) {
    this.http = axios.create({
      baseURL: `https://${env}.enmon.tech`,
    });
  }
}
