module.exports = {
  thermometer: {
    dataSourceUrl: process.env.SOURCE_URL ?? 'http://192.168.3.6',
    enmon: {
      env: process.env.ENMON_APP_ENV ?? 'dev',
      customerId: process.env.ENMON_CUSTOMER_ID ?? '',
      devEUI: '',
      token: process.env.ENMON_METER_AUTH_TOKEN ?? '',
    },
  },
};
