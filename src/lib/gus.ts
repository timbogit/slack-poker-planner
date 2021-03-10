import logger from './logger';

const jsforce = require('jsforce');

let client = new jsforce.Connection(
  {
    version: '50.0',
    accessToken: process.env.ACCESS_TOKEN,
    instanceUrl: process.env.INSTANCE_URL
  }
);

export let accessInfo:Object = {
  accessToken: process.env.ACCESS_TOKEN,
  instanceUrl: process.env.INSTANCE_URL
};

export function init() {
  logger.info({ msg: `in initGus ${process.env.GUS_USER}` });
  // Login to GUS, then start the processor
  accessInfo = client.login(process.env.GUS_USER, process.env.GUS_PASSWORD)
    .then(() => {
      logger.info('CONNECTED, W00t');
      logger.info(`ACCESSTOKEN ${client.accessToken}`);
      logger.info(`INSTANCE URL ${client.instanceUrl}`);
      return {
        accessToken: client.accessToken,
        instanceUrl: client.instanceUrl
      };

      // client.query("SELECT Id, Name, Subject__c FROM ADM_Work__c LIMIT 1", function(err: any, result: any) {
      //   if (err) { return logger.error(err); }
      //   logger.info("total : " + result.totalSize);
      //   logger.info("fetched : " + result.records.length);
      //   logger.info("done ? : " + result.done);
      //   if (!result.done) {
      //     // you can use the locator to fetch next records set.
      //     // Connection#queryMore()
      //     logger.info("next records URL : " + result.nextRecordsUrl);
      //   }
      //   logger.info(result.records[0])
      // });
    })
    .catch((err: any) => {
      if (err.stack === undefined) logger.error('ERROR: ' + err)
      logger.error(err.stack)
    });
  logger.info(`ACCESS INFO ${accessInfo}`);
}

export function getConnection() {
  return client;
}

export interface IGusRecord {
  Id: string;
  Subject__c: string;
}

export async function getRecord(title: string): Promise<IGusRecord> {
  let record: IGusRecord;

  await getConnection().query(`SELECT Id, Subject__c FROM ADM_Work__c WHERE Name='${title}'`,
    function(err: any, result: any) {
      if (err) {
        return logger.error(err);
      }
      logger.info("total : " + result.totalSize);
      logger.info("fetched : " + result.records.length);
      logger.info("done ? : " + result.done);
      if (!result.done) {
        // you can use the locator to fetch next records set.
        // Connection#queryMore()
        logger.info("next records URL : " + result.nextRecordsUrl);
      }
      logger.info(result.records[0]);
      record = <IGusRecord> result.records[0];
    }
  );
  return record;
}

// Find the closest Fibonacci number, given number `n`
function fib(n: number, x:number=0, y:number=1):number {
  if (y < n) {
    return fib(n, y, x + y);
  } else {
    if (y - n > n - x) {
      return x;
    } else {
      return y;
    }
  }
}

export async function reportStoryPoints(average: string, workId: string): Promise<void> {
  const fibAverage : number = fib(Number(average));
  await getConnection().sobject("ADM_Work__c").update({
    Id : workId,
    Story_Points__c : fibAverage
  }, function(err: any, ret: any) {
    if (err || !ret.success) { return "Update Error : " + logger.error(err); }
  });
}