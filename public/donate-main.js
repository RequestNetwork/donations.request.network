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
var customAmountButton, customAmountInput, proceedButton, closeIcon, conversionRate, total, totalFIAT, receiptDate, saveReceiptLink;
var selectionPanel, paymentPanel, confirmationPanel, modalFooter;
var metamaskButton, ledgerButton, qrButton;
var that;
var selectedAmount = '10', selectedCurrency = 'ETH', totalOwed, network = 1, maxDonationAmount, transactionData;
var conversionRates = [];
var filteredCurrencies = [];
var presetAmounts = [5, 10, 25, 50, 100, 250];
var address;
var PAYMENT_ROUND_AMOUNT = 6;

var requestContractAddress = '0xd88ab9b1691340E04a5BBf78529c11d592d35f57';

function requestNetworkDonations(opts) {
    opts = opts || {};

    var defaults = {};

    opts = Object.assign(defaults, opts);

    var rootUrl = "https://c344a350.ngrok.io/";

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
        customAmountButton = document.getElementById('custom-amount-trigger');
        customAmountInput = document.getElementById('custom-amount-input');
        modalFooter = document.getElementsByClassName('request-modal-box__footer');
        conversionRate = document.getElementById('request-donations-rate');
        total = document.getElementsByClassName('request-donations-total');
        totalFIAT = document.getElementsByClassName('request-donations-total-fiat');
        saveReceiptLink = document.getElementById('request-save-receipt-link');
        receiptDate = document.getElementById('request-receipt-date');

        selectionPanel = document.getElementById('request-selection-panel');
        paymentPanel = document.getElementById('request-payment-panel');
        confirmationPanel = document.getElementById('request-confirmation-panel');

        metamaskButton = document.getElementById('request-n-payment-button-metamask');
        ledgerButton = document.getElementById('request-n-payment-button-ledger');
        qrButton = document.getElementById('request-n-payment-button-qr');

        this.setInnerHtmlByClass(totalFIAT, selectedAmount + ' USD');
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

        var params = {
            'to_pay': totalOwed,
            'to_address': address,
            'redirect_url': 'N/A',
            'reason': 'Donation to ' + currentBaseUrl,
            'network': network,
            'currency': selectedCurrency,
            'builder_id': 'RequestDonations',
            'invoice_items': invoiceItem,
            'cbUUID': ''
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
            that.setInnerHtmlByClass(total, totalOwed + ' ' + selectedCurrency)
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

        var qr = new QRious({
            value: 'ethereum:' + requestContractAddress + '?amount=' + totalOwed + '&data=' + transactionData,
            background: '#f5f6fa',
            size: 300
        });

        console.log(qr.toDataURL());
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
                if (web3.eth.accounts[0] != null) {
                    window.web3 = new Web3(web3.currentProvider);

                    var totalOwedWithFee = that.addTransactionFee(totalOwed);
    
                    var totalOwedWei = web3.toWei(totalOwedWithFee, 'ether');
    
                    web3.eth.sendTransaction({
                        from: web3.eth.accounts[0],
                        to: requestContractAddress,
                        value: totalOwedWei,
                        data: transactionData
                    }, function (error, result) {
                        if (!error && result != undefined) {
                            selectionPanel.classList.add('hidden');
                            paymentPanel.classList.add('hidden');
                            confirmationPanel.classList.remove('hidden');
                            that.setSaveReceiptLink(result);
                        }
                    });
                }
                else {
                    alert('Please login to MetaMask');
                }
            } else {
                alert('You don\'t have MetaMask installed');
            }
        });

        qrButton.addEventListener('click', function () {

        });
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
                    presetAmounts[i] + '<span class="request-dollar">$</span>' + '</div>' +
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

        var html = '<div id="request-payment-panel"  class="hidden">' +
            '<div class="request-modal-box__header">' +
            '<span class="request-h1 request-modal-title">Make a donation today</span>' +
            '<span class="request-h3 request-modal-subtitle">Powered by Request Network</span>' +
            '</div>' +
            '<div id="request-payment-choices" class="request-modal-box__body">' +
            '<p class="request-subtitle mb-3">Waiting on payment</p>' +
            '<div class="request-boxed mb-5">' +
            '<div class="request-donations-total-fiat request-lg-heading"></div>' +
            '<div class="request-donations-total"></div>' +
            '<div id="request-rn-timer" class="request-status-tag">Pending</div>' +
            '</div>' +
            '<div id="request-payment-buttons">' +
            '<div class="request-subtitle rq-dark text-center">Send your payment using any of the following methods</div>' +
            this.generatePaymentButtonsHtml() +
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
            '<div class="request-status-tag success">Paid</div>' +
            '</div>' +
            '<div class="request-subtitle rq-dark text-center mb-2">Your transaction has been successfully processed</div>' +
            '<div class="request-subtitle text-center mb-3"><a target="_blank" id="request-save-receipt-link" class="rq-light" href="#">Save your receipt</a></div>' +
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
    }

    this.setSaveReceiptLink = function (txid) {
        var currentBaseUrl = [location.protocol, '//', location.host].join('');
        var link = 'https://donations.request.network/thank-you?owed=' + totalOwed + '&currency=' + selectedCurrency + '&fiat=' + selectedAmount + '&redirect=' + currentBaseUrl + '&network=' + network + '&txid=' + txid;
        saveReceiptLink.href = link;
    }
}