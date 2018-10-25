donations.request.network - donations script and demos
==================================

[Documentation can be found here](https://docs.request.network/integrations/request-donations)

Demo
---------------
[MakerDAO Demo](https://donations.request.network/demo/)

[Basic Demo](https://donations.request.network/demo2/)

How to use
---------------

Embed the following just before the body tags on your site
```sh
<script type="text/javascript" src="https://donations.request.network/donate.js"></script>
<script type="text/javascript">
  var requestDonations = new requestNetworkDonations({
    address: '0x2027c7fd9e48c028e7a927a6def44f4b2e52c703',
    currencies: ['ETH', 'REQ', 'DAI', 'OMG', 'KNC', 'DGX', 'KIN', 'BNB', 'BAT', 'ZRX', 'LINK'],
    network: 4,
    max_amount: 500
  });
  requestDonations.start();
</script>
```

Change the 'address' field to the address where you want to recieve funds.

(optional) Change the 'currencies' field to limit the currencies which you want to recieve. Currently the accepted currencies are: REQ, DAI, KNC, OMG, DGX, KIN, BNB, BAT, ZRX and LINK. If this parameter is not set all available currencies will be shown - any new currencies will show automatically.

(optional) Set the network parameter value to 4 for testing on Rinkeby. Leave blank for mainnet

(optional) Set the max_amount parameter to limit the maximum donation amount you want to accept

Add an ID of 'requestDonationTrigger' to an element in your HTML e.g. ```<button id="requestDonationTrigger">Click here to trigger the modal</button>```

Getting Started
---------------
To run the demos run the following:

```sh
# Install dependencies
npm install

# Start development live-reload server
npm run dev

# Start production server:
npm start
```

If you would like to self host you can find the main donations script at /public/donate-main.js. 
