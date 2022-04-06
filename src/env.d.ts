declare namespace NodeJS {
  interface ProcessEnv {
    SOURCE_URL?: string;
    /**
     * APP or DEV
     */
    ENMON_APP_ENV?: string;
    ENMON_CUSTOMER_ID?: string;
    ENMON_METER_AUTH_TOKEN?: string;
  }
}
