import 'dotenv/config';
import axios from 'axios';
import { load } from 'cheerio';
import debug from 'debug';
import { CronJob } from 'cron';

const log = debug('app');

async function fetchTemperature(): Promise<undefined | number> {
  const {
    status,
    statusText,
    data: html,
  } = await axios.get<string>(process.env.SOURCE_URL ?? 'http://192.168.3.6', {
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
  const { status, statusText, data } = await axios.post<unknown>(
    `https://${process.env.ENMON_APP_ENV ?? 'dev'}.enmon.tech/meter/plain/${process.env.ENMON_CUSTOMER_ID ?? ''}/value`,
    {
      devEUI: 'heky-koj9-temp-puda',
      date: new Date(),
      value: temperature,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.ENMON_METER_AUTH_TOKEN ?? ''}`,
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

log('starting job ...');

job.start();

log({ msg: 'job started', nextRun: job.nextDate() });

const handleAppShutdown = () => {
  log({ msg: 'received shutdown signal, shutting down job ...' });
  job.stop();
  log({ msg: 'job shuted down, exiting process ...' });
  process.exit(0);
};

process.once('SIGINT', handleAppShutdown);
process.once('SIGTERM', handleAppShutdown);
