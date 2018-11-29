/*!
* RequestNetworkDonations
* @author  Adam Dowson
* @version 1.0.0
*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.request = factory();
    }
}(this, function () {

    /* ----------------------------------------------------------- */
    /* == modal */
    /* ----------------------------------------------------------- */

    var transitionEvent = whichTransitionEvent();

    function Modal(options) {

        var defaults = {
            onClose: null,
            onOpen: null,
            beforeOpen: null,
            beforeClose: null,
            stickyFooter: false,
            footer: false,
            cssClass: [],
            closeLabel: 'Close',
            closeMethods: ['overlay', 'button', 'escape']
        };

        // extends config
        this.opts = extend({}, defaults, options);

        // init modal
        this.init();
    }

    Modal.prototype.init = function () {
        if (this.modal) {
            return;
        }

        _build.call(this);
        _bindEvents.call(this);

        // insert modal in dom
        document.body.insertBefore(this.modal, document.body.firstChild);

        if (this.opts.footer) {
            this.addFooter();
        }
    };

    Modal.prototype.destroy = function () {
        if (this.modal === null) {
            return;
        }

        // unbind all events
        _unbindEvents.call(this);

        // remove modal from dom
        this.modal.parentNode.removeChild(this.modal);

        this.modal = null;
    };


    Modal.prototype.open = function () {

        var self = this;

        // before open callback
        if (typeof self.opts.beforeOpen === 'function') {
            self.opts.beforeOpen();
        }

        if (this.modal.style.removeProperty) {
            this.modal.style.removeProperty('display');
        } else {
            this.modal.style.removeAttribute('display');
        }

        // prevent double scroll
        this._scrollPosition = window.pageYOffset;
        document.body.classList.add('request-enabled');
        document.body.style.top = -this._scrollPosition + 'px';

        // sticky footer
        this.setStickyFooter(this.opts.stickyFooter);

        // show modal
        this.modal.classList.add('request-modal--visible');

        if (transitionEvent) {
            this.modal.addEventListener(transitionEvent, function handler() {
                if (typeof self.opts.onOpen === 'function') {
                    self.opts.onOpen.call(self);
                }

                // detach event after transition end (so it doesn't fire multiple onOpen)
                self.modal.removeEventListener(transitionEvent, handler, false);

            }, false);
        } else {
            if (typeof self.opts.onOpen === 'function') {
                self.opts.onOpen.call(self);
            }
        }

        // check if modal is bigger than screen height
        this.checkOverflow();
    };

    Modal.prototype.isOpen = function () {
        return !!this.modal.classList.contains("request-modal--visible");
    };

    Modal.prototype.close = function () {

        //  before close
        if (typeof this.opts.beforeClose === "function") {
            var close = this.opts.beforeClose.call(this);
            if (!close) return;
        }

        document.body.classList.remove('request-enabled');
        window.scrollTo(0, this._scrollPosition);
        document.body.style.top = null;

        this.modal.classList.remove('request-modal--visible');

        //Using similar setup as onOpen
        //Reference to the Modal that's created
        var self = this;

        if (transitionEvent) {
            //Track when transition is happening then run onClose on complete
            this.modal.addEventListener(transitionEvent, function handler() {
                // detach event after transition end (so it doesn't fire multiple onClose)
                self.modal.removeEventListener(transitionEvent, handler, false);

                self.modal.style.display = 'none';

                // on close callback
                if (typeof self.opts.onClose === "function") {
                    self.opts.onClose.call(this);
                }

            }, false);
        } else {
            self.modal.style.display = 'none';
            // on close callback
            if (typeof self.opts.onClose === "function") {
                self.opts.onClose.call(this);
            }
        }
    };

    Modal.prototype.setContent = function (content) {
        // check type of content : String or Node
        if (typeof content === 'string') {
            this.modalBoxContent.innerHTML = content;
        } else {
            this.modalBoxContent.innerHTML = "";
            this.modalBoxContent.appendChild(content);
        }

        if (this.isOpen()) {
            // check if modal is bigger than screen height
            this.checkOverflow();
        }
    };

    Modal.prototype.getContent = function () {
        return this.modalBoxContent;
    };

    Modal.prototype.addFooter = function () {
        // add footer to modal
        _buildFooter.call(this);
    };

    Modal.prototype.setFooterContent = function (content) {
        // set footer content
        this.modalBoxFooter.innerHTML = content;
    };

    Modal.prototype.getFooterContent = function () {
        return this.modalBoxFooter;
    };

    Modal.prototype.setStickyFooter = function (isSticky) {
        // if the modal is smaller than the viewport height, we don't need sticky
        if (!this.isOverflow()) {
            isSticky = false;
        }

        if (isSticky) {
            if (this.modalBox.contains(this.modalBoxFooter)) {
                this.modalBox.removeChild(this.modalBoxFooter);
                this.modal.appendChild(this.modalBoxFooter);
                this.modalBoxFooter.classList.add('request-modal-box__footer--sticky');
                _recalculateFooterPosition.call(this);
                this.modalBoxContent.style['padding-bottom'] = this.modalBoxFooter.clientHeight + 20 + 'px';
            }
        } else if (this.modalBoxFooter) {
            if (!this.modalBox.contains(this.modalBoxFooter)) {
                this.modal.removeChild(this.modalBoxFooter);
                this.modalBox.appendChild(this.modalBoxFooter);
                this.modalBoxFooter.style.width = 'auto';
                this.modalBoxFooter.style.left = '';
                this.modalBoxContent.style['padding-bottom'] = '';
                this.modalBoxFooter.classList.remove('request-modal-box__footer--sticky');
            }
        }
    };


    Modal.prototype.addFooterBtn = function (label, cssClass, callback) {
        var btn = document.createElement("button");

        // set label
        btn.innerHTML = label;

        // bind callback
        btn.addEventListener('click', callback);

        if (typeof cssClass === 'string' && cssClass.length) {
            // add classes to btn
            cssClass.split(" ").forEach(function (item) {
                btn.classList.add(item);
            });
        }

        this.modalBoxFooter.appendChild(btn);

        return btn;
    };

    Modal.prototype.resize = function () {
        console.warn('Resize is deprecated and will be removed in version 1.0');
    };


    Modal.prototype.isOverflow = function () {
        var viewportHeight = window.innerHeight;
        var modalHeight = this.modalBox.clientHeight;

        return modalHeight >= viewportHeight;
    };

    Modal.prototype.checkOverflow = function () {
        // only if the modal is currently shown
        if (this.modal.classList.contains('request-modal--visible')) {
            if (this.isOverflow()) {
                this.modal.classList.add('request-modal--overflow');
            } else {
                this.modal.classList.remove('request-modal--overflow');
            }

            // TODO: remove offset
            //_offset.call(this);
            if (!this.isOverflow() && this.opts.stickyFooter) {
                this.setStickyFooter(false);
            } else if (this.isOverflow() && this.opts.stickyFooter) {
                _recalculateFooterPosition.call(this);
                this.setStickyFooter(true);
            }
        }
    }


    /* ----------------------------------------------------------- */
    /* == private methods */
    /* ----------------------------------------------------------- */

    function _recalculateFooterPosition() {
        if (!this.modalBoxFooter) {
            return;
        }
        this.modalBoxFooter.style.width = this.modalBox.clientWidth + 'px';
        this.modalBoxFooter.style.left = this.modalBox.offsetLeft + 'px';
    }

    function _build() {

        // wrapper
        this.modal = document.createElement('div');
        this.modal.classList.add('request-modal');

        // remove cusor if no overlay close method
        if (this.opts.closeMethods.length === 0 || this.opts.closeMethods.indexOf('overlay') === -1) {
            this.modal.classList.add('request-modal--noOverlayClose');
        }

        this.modal.style.display = 'none';

        // custom class
        this.opts.cssClass.forEach(function (item) {
            if (typeof item === 'string') {
                this.modal.classList.add(item);
            }
        }, this);

        // close btn
        if (this.opts.closeMethods.indexOf('button') !== -1) {
            this.modalCloseBtn = document.createElement('button');
            this.modalCloseBtn.classList.add('request-modal__close');

            this.modalCloseBtnIcon = document.createElement('span');
            this.modalCloseBtnIcon.classList.add('request-modal__closeIcon');
            this.modalCloseBtnIcon.innerHTML = '×';

            this.modalCloseBtnLabel = document.createElement('span');
            this.modalCloseBtnLabel.classList.add('request-modal__closeLabel');
            this.modalCloseBtnLabel.innerHTML = this.opts.closeLabel;

            this.modalCloseBtn.appendChild(this.modalCloseBtnIcon);
            this.modalCloseBtn.appendChild(this.modalCloseBtnLabel);
        }

        // modal
        this.modalBox = document.createElement('div');
        this.modalBox.classList.add('request-modal-box');

        // modal box content
        this.modalBoxContent = document.createElement('div');
        this.modalBoxContent.classList.add('request-modal-box__content');

        this.modalBox.appendChild(this.modalBoxContent);

        if (this.opts.closeMethods.indexOf('button') !== -1) {
            this.modal.appendChild(this.modalCloseBtn);
        }

        this.modal.appendChild(this.modalBox);

    }

    function _buildFooter() {
        this.modalBoxFooter = document.createElement('div');
        this.modalBoxFooter.classList.add('request-modal-box__footer');
        this.modalBox.appendChild(this.modalBoxFooter);
    }

    function _bindEvents() {

        this._events = {
            clickCloseBtn: this.close.bind(this),
            clickOverlay: _handleClickOutside.bind(this),
            resize: this.checkOverflow.bind(this),
            keyboardNav: _handleKeyboardNav.bind(this)
        };

        if (this.opts.closeMethods.indexOf('button') !== -1) {
            this.modalCloseBtn.addEventListener('click', this._events.clickCloseBtn);
        }

        this.modal.addEventListener('mousedown', this._events.clickOverlay);
        window.addEventListener('resize', this._events.resize);
        document.addEventListener("keydown", this._events.keyboardNav);
    }

    function _handleKeyboardNav(event) {
        // escape key
        if (this.opts.closeMethods.indexOf('escape') !== -1 && event.which === 27 && this.isOpen()) {
            this.close();
        }
    }

    function _handleClickOutside(event) {
        // if click is outside the modal
        if (this.opts.closeMethods.indexOf('overlay') !== -1 && !_findAncestor(event.target, 'request-modal') &&
            event.clientX < this.modal.clientWidth) {
            this.close();
        }
    }

    function _findAncestor(el, cls) {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    }

    function _unbindEvents() {
        if (this.opts.closeMethods.indexOf('button') !== -1) {
            this.modalCloseBtn.removeEventListener('click', this._events.clickCloseBtn);
        }
        this.modal.removeEventListener('mousedown', this._events.clickOverlay);
        window.removeEventListener('resize', this._events.resize);
        document.removeEventListener("keydown", this._events.keyboardNav);
    }

    /* ----------------------------------------------------------- */
    /* == helpers */
    /* ----------------------------------------------------------- */

    function extend() {
        for (var i = 1; i < arguments.length; i++) {
            for (var key in arguments[i]) {
                if (arguments[i].hasOwnProperty(key)) {
                    arguments[0][key] = arguments[i][key];
                }
            }
        }
        return arguments[0];
    }

    function whichTransitionEvent() {
        var t;
        var el = document.createElement('request-test-transition');
        var transitions = {
            'transition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'MozTransition': 'transitionend',
            'WebkitTransition': 'webkitTransitionEnd'
        };

        for (t in transitions) {
            if (el.style[t] !== undefined) {
                return transitions[t];
            }
        }
    }

    /* ----------------------------------------------------------- */
    /* == return */
    /* ----------------------------------------------------------- */

    return {
        modal: Modal
    };

}));

var triggerButton = document.getElementById('requestDonationTrigger');
var amountTiles = document.getElementsByClassName('request-tile-amount');
var currencyTiles = document.getElementsByClassName('request-tile-currency');
var customAmountButton, customAmountInput, proceedButton, returnButton, closeIcon, conversionRate, total, totalFIAT, receiptDate, saveReceiptLink, requestTransactionStatusTag, cbUUID;
var selectionPanel, paymentPanel, confirmationPanel, modalFooter;
var metamaskButton, ledgerButton, qrButton, qrImage, qrModalClose, qrModalMain, qrModalPaymentMade, qrPaymentDetectionText;
var that;
var selectedAmount = '10', selectedCurrency = 'ETH', totalOwed, network = 1, maxDonationAmount, transactionData, receiptDateValue;
var conversionRates = [];
var filteredCurrencies = [];
var presetAmounts = [5, 10, 25, 50, 100, 250];
var address;
var PAYMENT_ROUND_AMOUNT = 6;
var COOKIE_NAME = 'REQUEST_TXID_COOKIE';
var checkTxidInterval, cacheDBInterval;

var requestContractAddress = '0xd88ab9b1691340E04a5BBf78529c11d592d35f57';

function requestNetworkDonations(opts) {
    opts = opts || {};

    var defaults = {};

    opts = Object.assign(defaults, opts);

    var rootUrl = "https://donations-v2.request.network/";

    that = this;

    var allCurrencies = {
        'ETH': 'Ethereum (ETH)',
        'OMG': 'OmiseGO (OMG)',
        'REQ': 'Request Network (REQ)',
        'KNC': 'Kyber Network (KNC)',
        'DAI': 'Dai (DAI)',
        'DGX': 'Digix Gold (DGX)',
        'KIN': 'Kin (KIN)',
        'BNB': 'Binance Coin (BNB)',
        'BAT': 'Basic Attention Token (BAT)',
        'ZRX': '0x (ZRX)',
        'LINK': 'Chainlink (LINK)'
    };

    if (opts.currencies != null && opts.currencies.length > 0) {
        for (var currency in opts.currencies) {
            var currCurrency = opts.currencies[currency];
            if (allCurrencies[currCurrency]) {
                filteredCurrencies[currCurrency] = allCurrencies[currCurrency];
            }
        }
        selectedCurrency = opts.currencies[0];
    }
    else {
        filteredCurrencies = allCurrencies;
    }

    if (!filteredCurrencies || Object.keys(filteredCurrencies).length == 0) {
        alert('Incorrect currencies defined in parameters');
        triggerButton.classList.add('hidden');
        return;
    }

    if (!opts.address) {
        alert('Please enter an address');
        return;
    } else {
        address = opts.address;
    }

    if (opts.network) {
        if (opts.network != 1 && opts.network != 4) {
            alert('Network parameter must be 1 (mainnet) or 4 (rinkeby)');
            return;
        } else {
            network = opts.network;
        }
    }

    if (opts.max_amount) {
        if (isNaN(opts.max_amount)) {
            alert('Max amount parameter is incorrect');
            return;
        } else {
            maxDonationAmount = opts.max_amount;
        }
    }

    /* ----------------------------------------------------------- */
    /* == helper functions */
    /* ----------------------------------------------------------- */
    this.loadCSS = function (href) {
        var link = document.createElement('link');
        link.href = href;
        link.type = 'text/css';
        link.rel = 'stylesheet';
        document.getElementsByTagName('head')[0].appendChild(link);
    };

    this.loadJS = function (href) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = href;
        document.getElementsByTagName('head')[0].appendChild(script);
    };

    this.initModal = function () {
        donationsModal = new request.modal({
            footer: true,
            closeMethods: ['overlay', 'button', 'escape'],
            closeLabel: "Close"
        });


        var footerButton = '<button id="proceed-button" class="request-btn request-btn--primary">Next<i class="spinner"></i></button>';

        donationsModal.setFooterContent(footerButton);

        var btn = document.getElementById('requestDonationTrigger');
        btn.addEventListener('click', function () {
            donationsModal.open();
        });

        donationsModal.setContent(that.fetchContentHtml());

        proceedButton = document.getElementById('proceed-button');
        closeIcon = document.getElementsByClassName('request-modal__close');
        returnButton = document.getElementById('request-modal-return-arrow');
        customAmountButton = document.getElementById('custom-amount-trigger');
        customAmountInput = document.getElementById('custom-amount-input');
        modalFooter = document.getElementsByClassName('request-modal-box__footer');
        conversionRate = document.getElementById('request-donations-rate');
        total = document.getElementsByClassName('request-donations-total');
        totalFIAT = document.getElementsByClassName('request-donations-total-fiat');
        saveReceiptLink = document.getElementById('request-save-receipt-link');
        receiptDate = document.getElementById('request-receipt-date');
        requestTransactionStatusTag = document.getElementById('request-transaction-status-tag');

        selectionPanel = document.getElementById('request-selection-panel');
        paymentPanel = document.getElementById('request-payment-panel');
        confirmationPanel = document.getElementById('request-confirmation-panel');

        metamaskButton = document.getElementById('request-n-payment-button-metamask');
        ledgerButton = document.getElementById('request-n-payment-button-ledger');
        qrButton = document.getElementById('request-n-payment-button-qr');

        qrImage = document.getElementById('request-qr-code');
        qrModalClose = document.getElementById('request-qr-modal-close');
        qrModalMain = document.getElementById('request-qr-modal');
        qrModalPaymentMade = document.getElementById('request-qr-code-payment-made');
        qrPaymentDetectionText = document.getElementById('request-qr-detection-info');

        if (network == 4) {
            ledgerButton.classList.add('disabled');
        }

        this.setInnerHtmlByClass(totalFIAT, selectedAmount + ' USD');

        if (this.getCookie(COOKIE_NAME) != null) {
            this.showOldReceiptFromCookie(this.getCookie(COOKIE_NAME));
        }
    }

    this.showOldReceiptFromCookie = function (cookie) {
        var cookieJson = JSON.parse(cookie);

        totalOwed = cookieJson.amount_crypto;
        selectedCurrency = cookieJson.currency;
        selectedAmount = cookieJson.amount_fiat;
        network = cookieJson.network;
        var txid = cookieJson.txid;

        this.setSaveReceiptLink(txid);
        this.setInnerHtmlByClass(totalFIAT, selectedAmount + ' USD');
        this.setInnerHtmlByClass(total, totalOwed + ' ' + selectedCurrency);
        receiptDate.innerHTML = cookieJson.date;

        selectionPanel.classList.add('hidden');
        paymentPanel.classList.add('hidden');
        confirmationPanel.classList.remove('hidden');
        modalFooter[0].classList.add('hidden');
        requestTransactionStatusTag.innerHTML = 'Confirmed';
        requestTransactionStatusTag.classList.add('success');
        this.checkTxidStatus(txid);
    }

    this.jsonToQueryString = function (json) {
        return '?' +
            Object.keys(json).map(function (key) {
                return encodeURIComponent(key) + '=' +
                    encodeURIComponent(json[key]);
            }).join('&');
    }

    this.generateRequest = function () {
        var xhr = new XMLHttpRequest();

        var currentBaseUrl = [location.protocol, '//', location.host].join('');

        var invoiceItem = [{
            'name': 'Donation to ' + currentBaseUrl,
            'quantity': 1,
            'unitPrice': selectedAmount,
            'taxPercent': 0,
            'currency': 'USD'
        }];

        cbUUID = this.generateUUID();

        var params = {
            'to_pay': totalOwed,
            'to_address': address,
            'redirect_url': 'N/A',
            'reason': 'Donation to ' + currentBaseUrl,
            'network': network,
            'currency': selectedCurrency,
            'builder_id': 'RequestDonations',
            'invoice_items': invoiceItem,
            'cbUUID': cbUUID
        }

        var signUrl = 'https://sign.wooreq.com/v2/sign' + that.jsonToQueryString(params);

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                proceedButton.classList.remove('disabled');
                closeIcon[0].classList.remove('hidden');
                selectionPanel.classList.add('hidden');
                paymentPanel.classList.remove('hidden');
                modalFooter[0].classList.add('hidden');

                that.setTransactionData(xmlHttp.responseText);
                that.generateQrCode();
                that.checkForLedger();
            }
        }
        xmlHttp.open("GET", signUrl, true); // true for asynchronous 
        xmlHttp.send(null);
    }

    this.generateUUID = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    this.checkForLedger = function () {
        ledger.comm_u2f.create_async().then(function (comm) {
            var eth = new ledger.eth(comm);
            eth.getAddress_async("44'/60'/0'/0'/0").then(
                function (result) {
                    console.log(result);
                }).fail(function (error) {
                    console.log(error);
                    ledgerButton.classList.add('disabled');
                });
        });
    }

    this.setTransactionData = function (responseText) {
        var jsonResponse = JSON.parse(responseText);

        if (jsonResponse.transaction_data) {
            transactionData = jsonResponse.transaction_data;
        }
    }

    this.fetchRates = function () {

        var params = {
            'currency': selectedCurrency
        }

        that.setInnerHtmlByClass(totalFIAT, selectedAmount + ' USD');

        if (conversionRates[selectedCurrency]) {
            var rate = conversionRates[selectedCurrency];
            conversionRate.innerHTML = rate;
            totalOwed = parseFloat((rate * selectedAmount).toFixed(PAYMENT_ROUND_AMOUNT)).toString();
            that.setInnerHtmlByClass(total, totalOwed + ' ' + selectedCurrency);
        } else {
            var signUrl = 'https://sign.wooreq.com/rates' + that.jsonToQueryString(params);

            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                    var parsedResponse = JSON.parse(xmlHttp.responseText);
                    conversionRate.innerHTML = parsedResponse.conversion_rate;
                    totalOwed = parseFloat((parsedResponse.conversion_rate * selectedAmount).toFixed(PAYMENT_ROUND_AMOUNT)).toString();
                    that.setInnerHtmlByClass(total, totalOwed + ' ' + selectedCurrency);
                    conversionRates[selectedCurrency] = parsedResponse.conversion_rate;
                } else if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
                    alert('Error: Fetching conversion rates failed, this error has been logged');
                }
            }
            xmlHttp.open("GET", signUrl, true); // true for asynchronous 
            xmlHttp.send(null);
        }
    }

    this.generateQrCode = function () {

        var qr = new RequestQRCode({
            value: 'ethereum:' + requestContractAddress + '?amount=' + totalOwed + '&data=' + transactionData,
            background: '#f5f6fa',
            size: 300
        });

        qrImage.src = qr.toDataURL();
    }

    this.setInnerHtmlByClass = function (selector, amount) {
        if (selector.length > 0) {
            for (var i = 0; i < selector.length; i++) {
                selector[i].innerHTML = amount;
            }
        }
    }

    this.wipeRates = function () {
        for (var rate in conversionRates) {
            conversionRates[rate] = '';
        }
    }

    this.addClickEvents = function () {
        // Amount click events
        for (var i = 0; i < amountTiles.length; i++) {
            amountTiles[i].addEventListener('click', function (element) {
                for (var i = 0; i < amountTiles.length; i++) {
                    if (amountTiles[i] != element) {
                        amountTiles[i].classList.remove('active');
                    }
                }

                selectedAmount = this.getAttribute('data-req-amount');

                that.setInnerHtmlByClass(totalFIAT, selectedAmount + ' USD');
                that.fetchRates();
                that.clearCustomAmount();
                this.classList.toggle('active');
            });
        }

        // Currency click events
        for (var i = 0; i < currencyTiles.length; i++) {
            currencyTiles[i].addEventListener('click', function (element) {
                for (var i = 0; i < currencyTiles.length; i++) {
                    if (currencyTiles[i] != element) {
                        currencyTiles[i].classList.remove('active');
                    }

                }
                selectedCurrency = this.getAttribute('data-req-currency');
                that.fetchRates();
                this.classList.toggle('active');
            });
        }

        proceedButton.addEventListener('click', function () {
            if (network == 4 && selectedCurrency != 'ETH') {
                alert("This application is currently running in testmode (Rinkeby), ERC20 tokens are not available in this mode - please select ETH");
            } else if (selectedAmount > maxDonationAmount) {
                var currentBaseUrl = [location.protocol, '//', location.host].join('');
                alert(currentBaseUrl + " only accepts donations upto the value of $" + maxDonationAmount + ", please lower your donation amount");
            } else {
                proceedButton.classList.add('disabled');
                closeIcon[0].classList.add('hidden');
                that.loadJS('https://cdn.jsdelivr.net/gh/ethereum/web3.js/dist/web3.min.js');
                that.loadJS(rootUrl + 'js/ledger.min.js');
                that.loadJS(rootUrl + 'js/qr.min.js');
                that.generateRequest();
                that.setReceiptDate();
            }
        });

        customAmountButton.addEventListener('click', function () {
            this.classList.add('show-input');
            customAmountInput.focus();
        });

        customAmountInput.addEventListener('input', function (evt) {

            if (this.value) {
                var numericOnlyValue = this.value.replace(/\D/g, '');
                if (numericOnlyValue > maxDonationAmount) {
                    var currentBaseUrl = [location.protocol, '//', location.host].join('');
                    customAmountInput.value = selectedAmount;
                    alert(currentBaseUrl + " only accepts donations upto the value of $" + maxDonationAmount);
                } else {
                    selectedAmount = numericOnlyValue;
                    this.value = numericOnlyValue;
                    customAmountButton.classList.add('active');
                    for (var i = 0; i < amountTiles.length; i++) {
                        amountTiles[i].classList.remove('active');
                    }
                    that.fetchRates();
                }
            }
        });

        triggerButton.addEventListener('click', function () {
            that.fetchRates();
        });

        metamaskButton.addEventListener('click', function () {

            if (typeof web3 !== 'undefined') {

                web3.version.getNetwork((err, netId) => {
                    if (netId != network) {
                        if (network == 4) {
                            alert('Please change your MetaMask network to Rinkeby.');
                        }
                        else {
                            alert('Please change your MetMask network to Mainnet.');
                        }
                    } else {
                        if (web3.eth.accounts[0] != null) {
                            window.web3 = new Web3(web3.currentProvider);

                            var totalOwedWithFee = that.addTransactionFee(totalOwed);

                            var totalOwedWei = web3.toWei(totalOwedWithFee, 'ether');

                            web3.eth.sendTransaction({
                                from: web3.eth.accounts[0],
                                to: requestContractAddress,
                                value: totalOwedWei,
                                data: transactionData
                            }, function (error, txid) {
                                if (!error && txid != undefined) {
                                    selectionPanel.classList.add('hidden');
                                    paymentPanel.classList.add('hidden');
                                    confirmationPanel.classList.remove('hidden');
                                    that.setSaveReceiptLink(txid);
                                    that.checkTxidStatus(txid);
                                }
                            });
                        }
                        else {
                            alert('Please login to MetaMask');
                        }
                    }
                });
            } else {
                alert('You don\'t have MetaMask installed');
            }
        });

        qrButton.addEventListener('click', function () {
            qrModalMain.classList.remove('hidden');
        });

        qrModalClose.addEventListener('click', function () {
            qrModalMain.classList.add('hidden');
        });

        qrModalPaymentMade.addEventListener('click', function () {
            qrPaymentDetectionText.classList.remove('hidden');
            qrModalMain.classList.add('hidden');
            that.checkCacheDB(cbUUID);
        });

        closeIcon[0].addEventListener('click', function () {
            that.runModalCloseEvent();
        });

        returnButton.addEventListener('click', function () {
            that.runModalCloseEvent();
        });
    }

    this.checkCacheDB = function (cbUUID) {
        var networkName = network == 4 ? 'rinkeby' : 'mainnet';

        var cacheDBUrl = 'https://' + networkName + '.requestnetworkapi.com/requests?cbUUID=' + cbUUID;

        cacheDBInterval = setInterval(function () {

            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                    var jsonResponse = JSON.parse(xmlHttp.responseText);
                    if (jsonResponse.docs.length != 0) {
                        var requestInfo = jsonResponse.docs[0];
                        var txid = requestInfo._transactionId;

                        qrPaymentDetectionText.innerHTML = 'Payment detected';
                        qrPaymentDetectionText.classList.add('success');
                        clearInterval(cacheDBInterval);

                        setTimeout(function () {
                            selectionPanel.classList.add('hidden');
                            paymentPanel.classList.add('hidden');
                            confirmationPanel.classList.remove('hidden');
                            that.setSaveReceiptLink(txid);
                            that.checkTxidStatus(txid);
                        }, 4000);
                    }
                }
            }
            xmlHttp.open("GET", cacheDBUrl, true); // true for asynchronous 
            xmlHttp.send(null);

        }, 4000);
    }

    this.runModalCloseEvent = function () {
        selectionPanel.classList.remove('hidden');
        paymentPanel.classList.add('hidden');
        confirmationPanel.classList.add('hidden');
        modalFooter[0].classList.remove('hidden');
        currencyTiles[0].click();
    };

    this.savePaymentCookie = function (txid) {
        var cookieData = {
            'txid': txid,
            'amount_fiat': selectedAmount,
            'amount_crypto': totalOwed,
            'currency': selectedCurrency,
            'network': network,
            'date': receiptDateValue,
            'cbUUID': cbUUID
        };

        this.setCookie(COOKIE_NAME, JSON.stringify(cookieData), 5);
    }

    this.setCookie = function (name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + ";";
    }

    this.getCookie = function (name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    this.clearCookie = function (name) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    this.addTransactionFee = function (amount) {
        var totalOwedWithFee = amount * 1.001;
        var precision = Math.pow(10, 10);
        var totalOwedNormalized = Math.ceil(totalOwedWithFee * precision) / precision;
        return totalOwedNormalized;
    }

    this.clearCustomAmount = function () {
        customAmountButton.classList.remove('show-input');
        customAmountButton.classList.remove('active');
        customAmountInput.value = '';
    }

    this.initCustomInput = function () {
        function resizable(el, factor) {
            var int = Number(factor);
            function resize() { el.style.width = ((el.value.length + 1) * int) + 'px' }
            var e = 'keyup,keypress,focus,blur,change'.split(',');
            for (var i in e) el.addEventListener(e[i], resize, false);
            resize();
        }
        resizable(customAmountInput, 20);
    }

    this.setRateClear = function () {
        // We store the rates from the API in the session, we refetch them every 2 minutes. 
        setInterval(function () {
            that.wipeRates();
        }, 60 * 2000); // 2 minutes
    }

    this.filterMaxAmounts = function () {

    }

    this.start = function () {
        this.loadCSS(rootUrl + 'request-donation-styles.css'); //todo change to minified
        this.loadCSS('https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,600,700');
        this.initModal();
        this.addClickEvents();
        this.initCustomInput();
        this.setRateClear();
        this.filterMaxAmounts();

        //Debugging
        this.fetchRates();
        donationsModal.open();
    }

    this.fetchContentHtml = function () {

        var html = this.generatePaymentChoicesPageHtml();
        html += this.generateSelectionPageHtml();
        html += this.generateConfirmationPageHtml();

        return html;
    }

    this.generateSelectionPageHtml = function () {
        var first = true;

        var html = '<div id="request-selection-panel">' +
            '<div class="request-modal-box__header">' +
            '<span class="request-h1 request-modal-title">Make a donation today</span>' +
            '<span class="request-h3 request-modal-subtitle">Powered by Request Network</span>' +
            '</div>' +
            '<div class="request-modal-box__body">' +
            '<p class="request-subtitle">How much would you like to donate?</p>' +
            '<div class="request-tile-container clearfix">';

        for (var i = 0; i < presetAmounts.length; i++) {
            if (maxDonationAmount == undefined || presetAmounts[i] <= maxDonationAmount) {
                var activeClassAmounts = selectedAmount == presetAmounts[i] ? 'active' : '';

                html += '<div class="request-tile-outer request-tile-amount-outer">' +
                    '<div class="request-tile request-tile-amount ' + activeClassAmounts + '" data-req-amount="' + presetAmounts[i] + '">' +

                    '<div class="request-amount">' +
                    '<span class="request-dollar">$</span>' + presetAmounts[i] + '</div>' +
                    '</div>' +
                    '</div>';
            }
        }

        html += '<div class="request-tile-outer request-tile-outer-large">' +
            '<div id="custom-amount-trigger" class="request-tile">' +
            '<span class="request-tile-button-label">' +
            'Please type your amount (in $)' +
            '</span>' +
            '<div class="custom-amount-input-container">' +
            '<span class="request-dollar">$</span>' +
            '<input id="custom-amount-input" type="text">' +
            '</div>' +
            '<span class="request-tick"></span>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<p class="request-subtitle">Select donation currency</p>' +
            '<div class="request-tile-container request-tile-currency-container clearfix">';


        for (var currency in filteredCurrencies) {
            if (filteredCurrencies.hasOwnProperty(currency)) {
                var activeClass = first ? 'active' : '';

                var currencyLower = currency.toLowerCase();

                html += '<div class="request-tile-outer request-tile-currency-outer">' +
                    '<div class="request-tile request-tile-currency ' + activeClass + '" data-req-currency="' + currency + '">' +
                    '<div class="request-tile-payment-icon">' +
                    '<i class="request-payment-icon request-payment-icon--' + currencyLower + '"></i>' +
                    '<span class="request-payment-icon-title">' + currency + '</span>' +
                    '</div>' +
                    '<span class="request-tick small"></span>' +
                    '</div>' +
                    '</div>';
                first = false;
            }
        }


        html += '</div>' +
            '<div class="request-transaction-info-block">' +
            '<p class="mb-1">Conversion rate:' +
            '<strong id="request-donations-rate"></strong>' +
            '</p>' +
            '<p class="mt-0 mb-0">Total to donate:' +
            '<strong class="request-donations-total"></strong>' +
            '</p>' +
            '</div>' +
            '</div>' +
            '</div>';

        return html;
    }

    this.generatePaymentChoicesPageHtml = function () {

        var html = '<div id="request-payment-panel" class="hidden">' +
            '<div class="request-modal-box__header">' +
            '<span id="request-modal-return-arrow"></span>' +
            '<span class="request-h1 request-modal-title">Make a donation today</span>' +
            '<span class="request-h3 request-modal-subtitle">Powered by Request Network</span>' +
            '</div>' +
            '<div id="request-payment-choices" class="request-modal-box__body">' +
            '<p class="request-subtitle mb-3">Waiting on payment</p>' +
            '<div class="request-boxed mb-5">' +
            '<div class="request-donations-total-fiat request-lg-heading"></div>' +
            '<div class="request-donations-total"></div>' +
            '<div class="request-status-tag">Pending</div>' +
            '<div>' +
            '<div id="request-qr-detection-info" class="request-subtitle text-center hidden">Detecting payment<i id="request-qr-spinner" class="spinner"></i></div>' +
            '</div>' +
            '</div>' +
            '<div id="request-payment-buttons">' +
            '<div class="request-subtitle rq-dark text-center">Send your payment using any of the following methods</div>' +
            this.generatePaymentButtonsHtml() +
            '</div>' +
            '<div id="request-qr-modal" class="hidden">' +
            '<div id="request-qr-modal-close">×</div>' +
            '<div class="request-qr-code-holder">' +
            '<img src="data:image/png;base64,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" id="request-qr-code"/>' +
            '<button id="request-qr-code-payment-made" class="request-btn request-btn--success request-btn--small">Payment made</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';

        return html;
    }

    this.generatePaymentButtonsHtml = function () {
        var buttonsHtml = this.generatePaymentButtonHtml('metamask', 'Use MetaMask');
        buttonsHtml += this.generatePaymentButtonHtml('ledger', 'Connect Ledger');
        buttonsHtml += this.generatePaymentButtonHtml('qr', 'Pay via QR Code');
        return buttonsHtml;
    }

    this.generatePaymentButtonHtml = function (id, label) {
        return '<div class="request-n-payment-button-outer">' +
            '<div id="request-n-payment-button-' + id + '" class="request-n-payment-button">' +
            '<div class="request-payment-icon request-payment-icon--' + id + '"></div>' +
            '<span class="request-n-payment-button-label request-subtitle rq-dark"> ' + label + ' </span>' +
            '</div>' +
            '</div>';
    }

    this.generateConfirmationPageHtml = function () {

        var html = '<div id="request-confirmation-panel" class="hidden">' +
            '<div class="request-modal-box__header">' +
            '<span class="request-h1 request-modal-title">Thank you</span>' +
            '<span class="request-h3 request-modal-subtitle">Your support goes a long way towards making a difference</span>' +
            '</div>' +
            '<div class="request-modal-box__body">' +
            '<p class="request-subtitle mb-3">Your receipt<span href="#" id="request-receipt-date" class="right">dd/mm/YYYY</span></p>' +
            '<div class="request-boxed mb-5">' +
            '<div class="request-donations-total-fiat request-lg-heading"></div>' +
            '<div class="request-donations-total"></div>' +
            '<div id="request-transaction-status-tag" class="request-status-tag">Processing<i class="spinner"></i></div>' +
            '</div>' +
            '<div class="request-subtitle rq-dark text-center mb-2">Your transaction has been successfully processed</div>' +
            '<div class="request-subtitle text-center mb-3">' +
            '<a target="_blank" id="request-save-receipt-link" class="rq-light" href="#">Save your receipt</a>' +
            '</div>' +
            '</div>' +
            '</div>';

        return html;
    }

    this.setReceiptDate = function () {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!

        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        var today = dd + '/' + mm + '/' + yyyy;

        receiptDate.innerHTML = today;
        receiptDateValue = today;
    }

    this.setSaveReceiptLink = function (txid) {
        var currentBaseUrl = [location.protocol, '//', location.host].join('');
        var link = 'https://donations.request.network/thank-you?owed=' + totalOwed + '&currency=' + selectedCurrency + '&fiat=' + selectedAmount + '&redirect=' + currentBaseUrl + '&network=' + network + '&txid=' + txid;
        saveReceiptLink.href = link;
    }

    this.checkTxidStatus = function (txid) {
        var infura_base = "https://mainnet.infura.io";
        if (network && network == 4) {
            infura_base = "https://rinkeby.infura.io";
        }
        var web3 = new Web3(new Web3.providers.HttpProvider(infura_base));

        var delayBeforeChecks = 0; //ms
        //We do this as Rinkeby transactions confirm almost instantly. 
        if (network == 4) {
            delayBeforeChecks = 5000; //ms 
        }
        setTimeout(function () {
            checkTxidInterval = setInterval(that.hasBeenMined(txid, web3), 2000);
        }, delayBeforeChecks)
    }

    this.hasBeenMined = function (txid, provider) {
        var transaction = provider.eth.getTransaction(txid);
        if (transaction && transaction.blockHash) {
            requestTransactionStatusTag.innerHTML = 'Confirmed';
            requestTransactionStatusTag.classList.add('success');
            clearInterval(checkTxidInterval);
        }
    }
}