import 'dotenv/config';
import axios from 'axios';
import { load } from 'cheerio';
import debug from 'debug';
import { CronJob } from 'cron';
import config from 'config';

const log = debug('app');

process.on('unhandledRejection', reason => {
  log({ msg: 'unhandled rejection', reason });
});

process.on('uncaughtException', error => {
  log({ msg: 'uncaught exception', error });
  process.exit(1);
});

async function fetchTemperature(): Promise<undefined | number> {
  const {
    status,
    statusText,
    data: html,
  } = await axios.get<string>(config.get('thermometer.dataSourceUrl'), {
    validateStatus: () => true,
  });

  log({
    msg: 'fetch temperature meter HTML page',
    status,
    statusText,
    html: status !== 200 ? html : '<hidden>',
  });

  if (status !== 200) return undefined;

  const $ = load(html);

  const [serializedValue] = $('#main > form > p:nth-child(3) > span').text().split(' ');

  const temperature = parseFloat(serializedValue);

  log({
    msg: 'founded temperature value',
    serialized: serializedValue,
    parsed: temperature,
  });

  return Number.isNaN(temperature) ? undefined : temperature;
}

async function uploadTemperature(temperature: number): Promise<void> {
  const env = config.get<string>('thermometer.enmon.env');
  const customerId = config.get<string>('thermometer.enmon.customerId');

  const { status, statusText, data } = await axios.post<unknown>(
    `https://${env}.enmon.tech/meter/plain/${customerId}/value`,
    {
      devEUI: config.get<string>('thermometer.enmon.devEUI'),
      date: new Date(),
      value: temperature,
    },
    {
      headers: {
        Authorization: `Bearer ${config.get<string>('thermometer.enmon.token')}`,
      },
      validateStatus: () => true,
    },
  );

  log({ msg: 'upload temperature result', status, statusText, data });
}

async function handleJobTick() {
  log({ msg: 'job execution started', at: new Date() });

  const temperature = await fetchTemperature();

  if (temperature) await uploadTemperature(temperature);

  log({ msg: 'job execution ended' });
}

const job = new CronJob({
  cronTime: '* * * * *',
  onTick: handleJobTick,
  runOnInit: true,
});

const handleAppShutdown = () => {
  log({ msg: 'received shutdown signal, shutting down job ...' });
  job.stop();
  log({ msg: 'job shuted down, exiting process ...' });
  process.exit(0);
};

process.once('SIGINT', handleAppShutdown);
process.once('SIGTERM', handleAppShutdown);

log('starting job ...');

job.start();

log({ msg: 'job started', nextRun: job.nextDate().toDate() });
