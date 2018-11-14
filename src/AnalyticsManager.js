import Store from "data-store";
import AWS from "aws-sdk";
import config from "./config.json";
import { URL } from "url";

const store = new Store({
  path: config.logPath
});

export default class AnalyticsManager {
  constructor() {
    this.log = this.log.bind(this);
    this.load = this.load.bind(this);
    this.persist = this.persist.bind(this);
    const frequencyMinute = +config.persistFrequencyMinutes || 5;
    setInterval(this.persist, frequencyMinute * 60 * 1000);
  }

  async load() {
    var params = { Bucket: config.bucketName, Key: config.bucketKey };
    var s3 = new AWS.S3();
    //Fetch the stores.json from AWS and store in the local cache
    const data = await s3.getObject(params).promise();
    const logs = JSON.parse(data.Body.toString());
    store.union("sites", logs.sites);
    console.log("logs loaded");
  }

  log(referer) {
    const hostname = new URL(referer).hostname;
    //console.log(`logging ${referer} =>  ${hostname}`);
    store.union("sites", hostname);
  }

  async persist() {
    await this.load();
    const buf = Buffer.from(JSON.stringify(store.data));
    var s3 = new AWS.S3();
    try {
      await s3
        .putObject({
          Bucket: config.bucketName,
          Key: config.bucketKey,
          Body: buf,
          ACL: "private"
        })
        .promise();
      console.log("Successfully persisted logs.");
    } catch (er) {
      console.log(er);
    }
  }
}
