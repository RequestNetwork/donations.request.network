import 'babel-polyfill';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import config from './config.json';
import Store from 'data-store';
import AWS from 'aws-sdk';
const store = new Store({ path: 'public/e515d5eb-9320-49c0-a175-126b441ec0d7.json' });

AWS.config.update({ accessKeyId: config.AWS_ACCESS_KEY, secretAccessKey: config.AWS_PRIVATE_KEY });

const bucketName = 'donations-logs',
    bucketKey = 'stores.json';

let app = express();

app.get('/thank-you', function (req, res) {
    res.render(
        'thank-you',
        { txid: req.query.txid, owed: req.query.owed, currency: req.query.currency, redirect: req.query.redirect, fiat: req.query.fiat, network: req.query.network })
});

app.server = http.createServer(app);

app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.use('/', express.static('landing'));
app.use('/demo', express.static('public/demo'));
app.use('/demo2', express.static('public/demo2'));
app.use('/makerdemo', express.static('public/demo-maker'));

app.use(function (req, res, next) {

    if (req.originalUrl == '/donate.js' && req.header('Referer') && req.header('Referer') != "https://donations.request.network/donate.js") {
        var ref = extractRootDomain(req.header('Referer')).replace(/\./g, '[DOT]');
        store.set(ref, extractRootDomain(req.header('Referer')));

        const buf = Buffer.from(JSON.stringify(store.data));
        var s3 = new AWS.S3();

        s3.putObject({
            Bucket: bucketName,
            Key: bucketKey,
            Body: buf,
            ACL: 'private'
        }, function (resp) {
            console.log(arguments);
            console.log('Successfully uploaded package.');
        });
    }
    next();
});

app.use(express.static('public'));

app.use(function (err, req, res, next) {
    res.send("500" + err);
    next();
});

app.server.listen(process.env.PORT || config.port, () => {
    console.log(`Started on port ${app.server.address().port}`);

    var params = { Bucket: bucketName, Key: bucketKey }
    var s3 = new AWS.S3();
    //Fetch the stores.json from AWS and store in the local cache
    s3.getObject(params, function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        }
        else {
            const storesJson = JSON.parse(data.Body.toString());
            console.log(storesJson);           // successful response
        }
    });

});

function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

function extractRootDomain(url) {
    var domain = extractHostname(url),
        splitArr = domain.split('.'),
        arrLen = splitArr.length;

    //extracting the root domain here
    //if there is a subdomain 
    if (arrLen > 2) {
        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
        if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
            //this is using a ccTLD
            domain = splitArr[arrLen - 3] + '.' + domain;
        }
    }
    return domain;
}


export default app;