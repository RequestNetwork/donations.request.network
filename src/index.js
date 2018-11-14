import "babel-polyfill";
import http from "http";
import express from "express";
import bodyParser from "body-parser";
import config from "./config.json";
import { version } from "../package.json";
import AnalyticsManager from "./AnalyticsManager";

console.log(`App version = ${version}`);

let app = express();
let analytics = new AnalyticsManager();

app.server = http.createServer(app);
app.use(bodyParser.json());
app.set("view engine", "ejs");

app.use("/demo", express.static("public/demo"));
app.use("/demo2", express.static("public/demo2"));
app.use("/makerdemo", express.static("public/demo-maker"));
app.get("/thank-you", function(req, res) {
  res.render("thank-you", {
    txid: req.query.txid,
    owed: req.query.owed,
    currency: req.query.currency,
    redirect: req.query.redirect,
    fiat: req.query.fiat,
    network: req.query.network
  });
});

app.use(function(req, res, next) {
  const referer = req.header("Referer");
  if (req.originalUrl == "/donate.js") {
    if (referer && referer != "https://donations.request.network/donate.js") {
      analytics.log(referer);
    } else {
      console.log(req.headers);
    }
  }
  next();
});
app.use(express.static("public"));

app.use(function(err, req, res, next) {
  res.send("500" + err);
  next();
});

app.server.listen(process.env.PORT || config.port, async () => {
  console.log(`Started on port ${app.server.address().port}`);

  await analytics.load();
});

export default app;
