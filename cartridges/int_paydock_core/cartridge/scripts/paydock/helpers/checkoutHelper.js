'use strict';

// constants
var paydockWalletButtonsPaymentMethodIDs = ['PAYDOCK_WALLET_BUTTONS_APPLE_PAY', 'PAYDOCK_WALLET_BUTTONS_GOOGLE_PAY', 'PAYDOCK_WALLET_BUTTONS_PAYPAL', 'PAYDOCK_WALLET_BUTTONS_AFTERPAY'];
var paydockWalletButtonsPaymentMethodTypes = ['ApplePay', 'GooglePay', 'PayPal', 'Afterpay'];
var paydockPaymentMethodID = "PAYDOCK";

/**
 * Checks if Credit Card payments are enabled.
 *
 * @return {boolean} - True if Credit Card payments are enabled
 */
function isCreditCardPaymentMethodEnabled() {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentInstrument = require('dw/order/PaymentInstrument');

    var cardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);

    return cardPaymentMethod && cardPaymentMethod.active;
}

/**
 * Checks if Paydock payments are enabled.
 *
 * @return {boolean} - True if Paydock payments are enabled
 */
function isPaydockPaymentMethodEnabled() {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentInstrument = require('dw/order/PaymentInstrument');

    var paydockPaymentMethod = PaymentMgr.getPaymentMethod('PAYDOCK');

    return paydockPaymentMethod && paydockPaymentMethod.active;
}

/**
 * Checks if Payment Method is a Paydock Wallet Buttons one.
 *
 * @param {String} paymentMethodId - Payment Method ID
 * @return {boolean} - Verification result
 */
function isPaydockWalletButtonsPaymentMethod(paymentMethodId) {
    return paymentMethodId && paydockWalletButtonsPaymentMethodIDs.indexOf(paymentMethodId) !== -1;
}

/**
 * Checks if Paydock Wallet Buttons payment is enabled.
 *
 * @return {boolean} - True if Paydock Wallet Buttons payment is enabled
 */
function isPaydockWalletButtonsPaymentMethodEnabled(paymentMethodId) {
    var PaymentMgr = require('dw/order/PaymentMgr');

    // early returns
    if (!paymentMethodId || !isPaydockWalletButtonsPaymentMethod(paymentMethodId)) return false;

    // get Payment Method
    var paydockWalletButtonsPaymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);

    return paydockWalletButtonsPaymentMethod && paydockWalletButtonsPaymentMethod.active;
}

/**
 * Checks if any Paydock Wallet Buttons payments are enabled.
 *
 * @return {boolean} - True if Paydock Buttons payments are enabled
 */
function isPaydockWalletButtonsPaymentMethodsEnabled() {
    var PaymentMgr = require('dw/order/PaymentMgr');

    for (var i = 0; i < paydockWalletButtonsPaymentMethodIDs.length; i++) {
        var paydockWalletButtonsPaymentMethodID = paydockWalletButtonsPaymentMethodIDs[i]; // shortcut

        if (isPaydockWalletButtonsPaymentMethodEnabled(paydockWalletButtonsPaymentMethodID)) return true;
    }

    return false;
}

/**
 * Checks if any Paydock payments are enabled.
 *
 * @return {boolean} - True if any Paydock payments are enabled
 */
function isPaydockPaymentMethodsEnabled() {
    return isPaydockPaymentMethodEnabled() || isPaydockWalletButtonsPaymentMethodsEnabled();
}

/**
 * Get Paydock Wallet Buttons Payment Method type.
 *
 * @param {String} paymentMethodId - Payment Method ID
 * @return {String} - Payment Method type
 */
function getPaydockWalletButtonsPaymentMethodType(paymentMethodId) {
    return paymentMethodId ?
        (paydockWalletButtonsPaymentMethodTypes[ paydockWalletButtonsPaymentMethodIDs.indexOf(paymentMethodId) ] || null) :
        null;
}

/**
 * Get Paydock Wallet Buttons Payment Method configuration.
 *
 * @param {String} paymentMethodId - Payment Method ID
 * @param {Object} preferences - Preferences Object
 * @return {Object|null} - Payment Method configuration, or null if Payment Method does not exist or is not configured
 */
function getPaydockWalletButtonPaymentMethodConfig(paymentMethodId, preferences) {
    var PaymentMgr = require('dw/order/PaymentMgr');

    // early returns
    if (!paymentMethodId || !preferences) return null;

    if (!isPaydockWalletButtonsPaymentMethodEnabled(paymentMethodId)) return null;

    // get Payment Method
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);

    // get Payment Method type
    var paymentMethodType = getPaydockWalletButtonsPaymentMethodType(paymentMethodId);

    if (!paymentMethodType) return null;

    // defaults
    var chargeCapture;
    var gatewayId;
    var fraudEnabled;
    var fraudServiceID;

    switch (paymentMethodType) {
        case 'ApplePay':
            chargeCapture = preferences.paydockWalletButtonsApplePayChargeCapture;
            gatewayId = preferences.paydockWalletButtonsApplePayGatewayID;
            fraudEnabled = preferences.paydockWalletButtonsApplePayFraudEnabled;
            fraudServiceID = preferences.paydockWalletButtonsApplePayFraudServiceID;
            break;
        case 'GooglePay':
            chargeCapture = preferences.paydockWalletButtonsGooglePayChargeCapture;
            gatewayId = preferences.paydockWalletButtonsGooglePayGatewayID;
            fraudEnabled = preferences.paydockWalletButtonsGooglePayFraudEnabled;
            fraudServiceID = preferences.paydockWalletButtonsGooglePayFraudServiceID;
            break;
        case 'PayPal':
            chargeCapture = preferences.paydockWalletButtonsPayPalChargeCapture;
            gatewayId = preferences.paydockWalletButtonsPayPalGatewayID;
            fraudEnabled = preferences.paydockWalletButtonsPayPalFraudEnabled;
            fraudServiceID = preferences.paydockWalletButtonsPayPalFraudServiceID;
            break;
        case 'Afterpay':
            chargeCapture = preferences.paydockWalletButtonsAfterpayChargeCapture;
            gatewayId = preferences.paydockWalletButtonsAfterpayGatewayID;
            fraudEnabled = preferences.paydockWalletButtonsAfterpayFraudEnabled;
            fraudServiceID = preferences.paydockWalletButtonsAfterpayFraudServiceID;
            break;
        default:
                return null;
    }

    return {
        ID: paymentMethod.ID,
        name: paymentMethod.name,
        description: paymentMethod.description,
        image: paymentMethod.image ? paymentMethod.image.httpsURL.toString() : null,
        chargeCapture: chargeCapture,
        gatewayId: gatewayId,
        type: paymentMethodType,
        fraudEnabled: fraudEnabled,
        fraudServiceID: fraudServiceID
    };
}

/**
 * Checks whether the passed Payment Instrument is handled by Paydock.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment Instrument
 * @return {boolean} - True if Payment Instrument is handled by Paydock
 */
function isPaydockPaymentInstrument(paymentInstrument) {
    if (!paymentInstrument || !paymentInstrument.paymentMethod) {
        return false;
    }

    var paydockPaymentInstrumentRegex = /(^PAYDOCK$|^PAYDOCK_.+)/i;
    return paydockPaymentInstrumentRegex.test(paymentInstrument.paymentMethod);
}

/**
 * Gets the first Paydock Payment Instrument of the passed Line Item Container.
 *
 * @param {dw.order.LineItemContainer} lineItemCtnr - Line Item Container
 * @return {dw.order.PaymentInstrument|null} - Paydock Payment Instrument or null
 */
function getPaydockPaymentInstrument(lineItemCtnr) {
    var allPaymentInstruments = lineItemCtnr.paymentInstruments.toArray();
    var paydockPaymentInstruments = allPaymentInstruments.filter(isPaydockPaymentInstrument);

    return paydockPaymentInstruments.length ? paydockPaymentInstruments[0] : null;
}

/**
 * Gets the first Paydock Payment Instrument model of the passed Line Item Container model.
 *
 * @param {Object} lineItemCtnrModel - Line Item Container model
 * @return {Object|null} - Paydock Payment Instrument model or null
 */
function getPaydockPaymentInstrumentModel(lineItemCtnrModel) {
    var allPaymentInstruments = lineItemCtnrModel ? lineItemCtnrModel : [];
    var paydockPaymentInstruments = allPaymentInstruments.filter(isPaydockPaymentInstrument);

    return paydockPaymentInstruments.length ? paydockPaymentInstruments[0] : null;
}

/**
 * Gets the Paydock Payment Instruments of the passed Line Item Container.
 *
 * @param {dw.order.LineItemContainer} lineItemCtnr - Line Item Container
 * @return {[dw.order.PaymentInstrument]|null} - Paydock Payment Instruments list or null
 */
function getPaydockPaymentInstruments(lineItemCtnr) {
    var allPaymentInstruments = lineItemCtnr.paymentInstruments.toArray();
    var paydockPaymentInstruments = allPaymentInstruments.filter(isPaydockPaymentInstrument);

    return paydockPaymentInstruments.length ? paydockPaymentInstruments : null;
}

/**
 * Removes any Paydock Payment Instruments for the passed Line Item Container.
 *
 * @param {dw.order.LineItemContainer} lineItemCtnr - Line Item Container
 * @return {void}
 */
function removePaydockPaymentInstruments(lineItemCtnr) {
    // early returns
    if (!lineItemCtnr) return;

    var iter = lineItemCtnr.paymentInstruments.iterator();

    // remove Paydock Payment Instruments
    while (iter.hasNext()) {
        var existingPI = iter.next();

        if (isPaydockPaymentInstrument(existingPI)) {
            lineItemCtnr.removePaymentInstrument(existingPI);
        }
    }
}

/**
 * Creates Paydock Payment Instrument for the passed Line Item Container.
 *
 * @param {dw.order.LineItemContainer} lineItemCtnr - Line Item Container
 * @return {dw.order.PaymentInstrument|null} - Paydock Payment Instrument or null
 */
function createPaydockPaymentInstrument(lineItemCtnr, paymentMethodId, params) {
    var PaymentMgr = require('dw/order/PaymentMgr');

    // early returns
    if (!lineItemCtnr) return null;

    removePaydockPaymentInstruments(lineItemCtnr);

    var paymentInstrument = lineItemCtnr.createPaymentInstrument(paymentMethodId, getNonGiftCertificateAmount(lineItemCtnr));

    if (params) {
        if ('cardHolder' in params) {
            paymentInstrument.creditCardHolder = params.cardHolder;
        }

        if ('cardNumber' in params) {
            paymentInstrument.creditCardNumber = params.cardNumber;
        }

        if ('cardType' in params) {
            paymentInstrument.creditCardType = params.cardType;
        }

        if ('cardExpMonth' in params) {
            paymentInstrument.creditCardExpirationMonth = params.cardExpMonth;
        }

        if ('cardExpYear' in params) {
            paymentInstrument.creditCardExpirationYear = params.cardExpYear;
        }

        if ('token' in params) {
            paymentInstrument.custom.paydockToken = params.token;
        }

        if ('chargeId' in params) {
            paymentInstrument.custom.paydockChargeID = params.chargeId;
        }

        if ('chargeStatus' in params) {
            paymentInstrument.custom.paydockChargeStatus = params.chargeStatus;
        }

        if ('vaultToken' in params) {
          paymentInstrument.custom.paydockVaultToken = params.vaultToken;
        }

        if ('vaultType' in params) {
          paymentInstrument.custom.paydockVaultType = params.vaultType;
        }

        if ('gatewayType' in params) {
            paymentInstrument.custom.paydockGatewayType = params.gatewayType;
        }

        if ('customerID' in params) {
          paymentInstrument.custom.paydockCustomerID = params.customerID;
        }

        if ('paydock3DSToken' in params) {
          paymentInstrument.custom.paydock3DSToken = params.paydock3DSToken;
        }
    }

    // shortcut
    var paymentTransaction = paymentInstrument.paymentTransaction;

    // Order may get created before the Charge creation at Paydock side
    if (
        !paymentTransaction.getPaymentProcessor() &&
        [
            'PAYDOCK',
            'PAYDOCK_WALLET_BUTTONS_APPLE_PAY', 'PAYDOCK_WALLET_BUTTONS_GOOGLE_PAY', 'PAYDOCK_WALLET_BUTTONS_PAYPAL', 'PAYDOCK_WALLET_BUTTONS_AFTERPAY',
            'PAYDOCK_CHECKOUT_BUTTON_AFTERPAY', 'PAYDOCK_CHECKOUT_BUTTON_ZIPMONEY'
        ].indexOf(paymentMethodId) !== -1
    ) {
        var processor = PaymentMgr.getPaymentMethod(paymentMethodId).getPaymentProcessor();

        if (processor) {
            paymentTransaction.setPaymentProcessor(processor);
        }
    }

    paymentTransaction.setType(params && params.paydockChargeCapture ? dw.order.PaymentTransaction.TYPE_CAPTURE : dw.order.PaymentTransaction.TYPE_AUTH);
}

/**
 * Checks if Paydock Payment Instrument is eligible to request charge captured.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Paydock Payment Instrument
 * @return {Boolean} - Verification result
 */
function isPaydockPaymentInstrumentEligibleForCapture(paymentInstrument) {
    // early returns
    if (!isPaydockPaymentInstrument(paymentInstrument)) return false;

    return paymentInstrument.custom.paydockChargeStatus === 'pending';
}

/**
 * Checks if Paydock Payment Instrument is eligible to request charge refund.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Paydock Payment Instrument
 * @return {Boolean} - Verification result
 */
function isPaydockPaymentInstrumentEligibleForRefund(paymentInstrument) {
    // early returns
    if (!isPaydockPaymentInstrument(paymentInstrument)) return false;

    if (paymentInstrument.custom.paydockChargeStatus === 'complete') return true;

    if (paymentInstrument.custom.paydockChargeStatus === 'refunded') {
        var capturedAmount = paymentInstrument.custom.paydockCapturedAmount ?
            Number(paymentInstrument.custom.paydockCapturedAmount) :
            0;
        capturedAmount = isNaN(capturedAmount) ? 0 : capturedAmount;

        var refundedAmount = paymentInstrument.custom.paydockRefundedAmount ?
            Number(paymentInstrument.custom.paydockRefundedAmount) :
            0;
        refundedAmount = isNaN(refundedAmount) ? 0 : refundedAmount;
       
        if (capturedAmount === 0) {
            return paymentInstrument.paymentTransaction.amount.available ?
                refundedAmount < paymentInstrument.paymentTransaction.amount.value :
                false;
        }

        return refundedAmount < capturedAmount;
    }

    return false;
}

/**
 * Checks if Paydock Payment Instrument is eligible to request charge cancel.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Paydock Payment Instrument
 * @return {Boolean} - Verification result
 */
function isPaydockPaymentInstrumentEligibleForCancel(paymentInstrument) {
    // early returns
    if (!isPaydockPaymentInstrument(paymentInstrument)) return false;

    if (paymentInstrument.custom.paydockChargeStatus === 'pending') return true;

    if (
        paymentInstrument.custom.paydockChargeStatus === 'complete' &&
        (
            paymentInstrument.custom.paydockCapturedAmount && paymentInstrument.paymentTransaction.amount.available ?
            paymentInstrument.custom.paydockCapturedAmount - paymentInstrument.paymentTransaction.amount.value === 0 :
            true
        )
    ) return true;

    return false;
}

/**
 * Update Paydock Payment Instrument with the charge details.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Paydock Payment Instrument
 * @param {Object} chargeDetails - previously retrieved charge details
 * @return {void}
 */
function updatePaydockPaymentInstrumentWithChargeDetails(paymentInstrument, chargeDetails) {
    var Transaction = require('dw/system/Transaction');
    var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');

    // early returns
    if (!isPaydockPaymentInstrument(paymentInstrument)) return;

    var chargeResult = chargeDetails || paydockService.charges.get(paymentInstrument.custom.paydockChargeID);

    var autoCapturedAmount = 0;
    var capturedAmount = 0;
    var refundedAmount = 0;

    if (chargeResult && chargeResult.resource && chargeResult.resource.data && chargeResult.resource.data.transactions) {
        for (var i = 0; i < chargeResult.resource.data.transactions.length; i++) {
            var transaction = chargeResult.resource.data.transactions[i]; // shortcut

            if (transaction.type === 'sale' && transaction.status === 'complete' && transaction.amount) autoCapturedAmount += transaction.amount;
            if (transaction.type === 'capture' && transaction.status === 'complete' && transaction.amount) capturedAmount += transaction.amount;
            if (transaction.type === 'refund' && transaction.status === 'complete' && transaction.amount) refundedAmount += transaction.amount;
        }
    }

    Transaction.wrap(function() {
        paymentInstrument.custom.paydockChargeStatus = chargeResult.resource.data.status;
        paymentInstrument.custom.paydockCapturedAmount = (capturedAmount || autoCapturedAmount).toFixed(2);
        paymentInstrument.custom.paydockRefundedAmount = refundedAmount.toFixed(2);
    });
}

/**
 * Reserves the new Order Number for the needs of Paydock.
 * Overwrites the previous one stored in session, if any.
 *
 * @return {String} Order Number
 */
function getNewPaydockOrderNumber() {
    var OrderMgr = require('dw/order/OrderMgr');
    var paydockOrderNumber = session.privacy.paydockOrderNumber;

    if (
        !paydockOrderNumber || // no reserved Order Number
        OrderMgr.getOrder(paydockOrderNumber)   // reserved Order Number was used already
    ) {
        paydockOrderNumber = session.privacy.paydockOrderNumber = OrderMgr.createOrderNo();
    }

    return paydockOrderNumber;
}

/**
 * Returns reserved for Paydock Order Number.
 * Checks the Paydock's Payment Instrument of the passed Line Item Container,
 * falls back to the value stored in session if no Order Number found in the Payment Instrument.
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Line Item Container
 * @return {String} - Reserved Order Number
 */
function getReservedPaydockOrderNumber(lineItemCtnr) {
    var paydockOrderNumber = null;

    if (lineItemCtnr) {
        var paydockPaymentInstrument = getPaydockPaymentInstrument(lineItemCtnr);

        if (paydockPaymentInstrument) {
            var paymentTransaction = paydockPaymentInstrument.paymentTransaction;

            if ('paydockOrderNumber' in paymentTransaction.custom) {
                paydockOrderNumber = paymentTransaction.custom.paydockOrderNumber;
            }
        }
    }

    if (!paydockOrderNumber) {
        paydockOrderNumber = session.privacy.paydockOrderNumber;
    }

    return paydockOrderNumber;
}

/**
 * Returns Line Item Container amount to be paid.
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Line Item Container
 * @return {dw.value.Money} - Line Item Container amount to be paid
 */
function getNonGiftCertificateAmount(lineItemCtnr) {
    var Money = require('dw/value/Money');

    // early returns
    if (!lineItemCtnr) return Money.NOT_AVAILABLE;

    // total redemption amount of all Gift Certificate Payment Instruments in the Line Item Container
    var giftCertTotal = new Money(0.0, lineItemCtnr.getCurrencyCode());

    // get list of all Gift Certificate Payment Instruments
    var gcPaymentInstrs = lineItemCtnr.getGiftCertificatePaymentInstruments();
    var iter = gcPaymentInstrs.iterator();

    // sum up the total redemption amount
    while (iter.hasNext()) {
        var orderPI = iter.next();

        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }

    // get the Order total
    var orderTotal = lineItemCtnr.getTotalGrossPrice();

    // protection from the not calculated price
    if (orderTotal.value === 0) {
        orderTotal = lineItemCtnr.getAdjustedMerchandizeTotalPrice(true).add(lineItemCtnr.getGiftCertificateTotalPrice());
    }

    // calculate the amount remained to charge via the Payment Instrument
    var amountRemained = orderTotal.subtract(giftCertTotal);

    // return amount to be paid
    return amountRemained;
}

/**
 * Returns Meta details for the Paydock Checkout Button Afterpay.
 * 
 * @param {dw.order.LineItemContainer} lineItemCtnr - Line Item Container
 * @returns {Object} - Meta details
 */
function getCheckoutButtonAfterpayMeta(lineItemCtnr) {
    var Money = require('dw/value/Money');

    // early returns
    if (!lineItemCtnr || !lineItemCtnr.customerEmail || lineItemCtnr.productLineItems.empty) return null;

    // get price
    var amount = getNonGiftCertificateAmount(lineItemCtnr);

    // no price
    if (!amount.available) return null;

    // shortcuts
    var billingAddress = lineItemCtnr.billingAddress;

    // no billing address
    if (!billingAddress) return null;

    // basic result
    var meta = {
        amount: amount.value,
        currency: lineItemCtnr.getCurrencyCode()
    };

    // extended result
    if (billingAddress) {
        meta = {
            amount: amount.value,
            // currency: lineItemCtnr.getCurrencyCode(),
            currency: 'AUD',
            email: lineItemCtnr.customerEmail,
            first_name: billingAddress.firstName,
            last_name: billingAddress.lastName,
            address_line: billingAddress.address1,
            address_city: billingAddress.city,
            address_state: billingAddress.stateCode,
            address_postcode:  billingAddress.postalCode,
            address_country: billingAddress.countryCode.value,
            phone: billingAddress.phone
        };

        if (billingAddress.address2) {
            meta.address_line2 = billingAddress.address2;
        }
    }

    return meta;
}

/**
 * Returns Meta details for the Paydock Checkout Button ZipMoney.
 * 
 * @param {dw.order.LineItemContainer} lineItemCtnr - Line Item Container
 * @returns {Object} - Meta details
 */
function getCheckoutButtonZipMoneyMeta(lineItemCtnr) {
    var Money = require('dw/value/Money');

    // early returns
    if (!lineItemCtnr || !lineItemCtnr.customerEmail || lineItemCtnr.productLineItems.empty) return null;

    // get price
    var amount = getNonGiftCertificateAmount(lineItemCtnr);

    // no price
    if (!amount.available) return null;

    // shortcuts
    var billingAddress = lineItemCtnr.billingAddress;
    var shippingAddress = lineItemCtnr.defaultShipment.shippingAddress;

    // no billing address
    if (!billingAddress) return null;

    // basic result
    var meta = {
        email: lineItemCtnr.customerEmail,
        tokenize: true,
        charge: {
            amount: amount.value.toString(),
            // currency: lineItemCtnr.getCurrencyCode(),
            currency: 'AUD',
            items: []
        }
    };

    // extended the result
    if (shippingAddress) {
        meta.charge.shipping_address = {
            first_name: shippingAddress.firstName,
            last_name: shippingAddress.lastName,
            line1: shippingAddress.address1,
            city: shippingAddress.city,
            postcode:  shippingAddress.postalCode,
            country: shippingAddress.countryCode.value,
            phone: shippingAddress.phone
        }

        if (shippingAddress.address2) {
            meta.charge.shipping_address.line2 = shippingAddress.address2;
        }

        if (shippingAddress.stateCode) {
            meta.charge.shipping_address.state = shippingAddress.stateCode;
        }
    }

    if (billingAddress) {
        meta.first_name = billingAddress.firstName;
        meta.last_name = billingAddress.lastName;

        meta.charge.billing_address = {
            first_name: billingAddress.firstName,
            last_name: billingAddress.lastName,
            line1: billingAddress.address1,
            city: billingAddress.city,
            postcode:  billingAddress.postalCode,
            country: billingAddress.countryCode.value,
            phone: billingAddress.phone
        }

        if (billingAddress.address2) {
            meta.charge.billing_address.line2 = billingAddress.address2;
        }

        if (billingAddress.stateCode) {
            meta.charge.billing_address.state = billingAddress.stateCode;
        }
    }

    var iter = lineItemCtnr.productLineItems.iterator();

    while (iter.hasNext()) {
        var pli = iter.next();

        if (pli.product && pli.productName && pli.quantityValue && pli.adjustedPrice.available) {
            meta.charge.items.push({
                name: pli.productName,
                amount: pli.adjustedPrice.value,
                quantity: pli.quantityValue
            });
        }
        else { // damaged Product Line Items
            meta.charge.items = [];

            break;
        }
    }

    return meta;
}

/**
 * Attempts to create an Order from the current Basket.
 * 
 * @param {dw.order.Basket} currentBasket - Current Basket
 * @returns {dw.order.Order|null} Order object created from the current Basket, null if no Order created
 */
function createOrder(currentBasket) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var paydockOrderNumber = getReservedPaydockOrderNumber(currentBasket);

    var order = null;

    try {
        order = Transaction.wrap(function () {
            var newOrder;

            if (paydockOrderNumber) {
                newOrder = OrderMgr.createOrder(currentBasket, paydockOrderNumber);
            } else {
                newOrder = OrderMgr.createOrder(currentBasket);
            }

            return newOrder;
        });
    }
    catch (e) {
        if (order) {
            Transaction.wrap(function () {
                order.addNote('Error Create Order', e.message);
            });
        }

        order = null;
    }

    return order;
}

/**
 * Attempts to refund Paydock Charge.
 * 
 * @param {String} chargeId - Charge ID
 * @param {Number} amount - amount to be refunded
 * * @param {dw.order.Order} order - Order optional
 * @returns {Object|null} Operation result in case of success, null otherwise
 */
function refundPaydockCharge(chargeId, amount, order) {
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger').getLogger('paydock', 'api.chargeRefund');
    var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');

    // early returns
    if (!chargeId) return null;

    var refundResult = null;
    var err = null;

    try {
        if (amount) {
            refundResult = paydockService.charges.refund(chargeId, {
                amount: amount
            });
        }
        else {
            refundResult = paydockService.charges.refund(chargeId);
        }
    } catch (e) {
        var errorMessage = 'Failed to refund charge ' + chargeId + ' at Paydock.' + '\n' + e.message;
        Logger.error(errorMessage);

        err = e;
    }

    if (err) {
        throw new Error(err.message);
    }
    else {
        if (order) {
            Transaction.wrap(function () {
                order.addNote('Paydock refund succeeded', 'Charge ' + chargeId + ' refund requested.' + (amount ? ' Amount is ' + amount : ''));
            });
        }
    }

    return refundResult;
}

/**
 * Attempts to refund Paydock Charges for the Order.
 * 
 * @param {dw.order.Order} order - Order
 * @param {Number} amount - amount to be refunded
 * @returns {Number} Number of Refunded Charges
 */
function refundPaydockCharges(order, amount) {
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger').getLogger('paydock', 'api.chargeRefund');
    var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');

    var refundedResult = 0;
    var paydockPaymentInstruments = getPaydockPaymentInstruments(order);

    if (paydockPaymentInstruments) {
        for (var i = 0; i < paydockPaymentInstruments.length; i++) {
            // shortcuts
            var paymentInstrument = paydockPaymentInstruments[i];
            var chargeId = paymentInstrument.paymentTransaction.transactionID;

            if (chargeId) {
                var refundResult = null;
                var err = null;

                try {
                    refundResult = paydockService.charges.refund(chargeId, {
                        amount: (amount ? amount : paymentInstrument.paymentTransaction.amount.value)
                    });
                } catch (e) {
                    var errorMessage = 'Failed to refund charge ' + chargeId + ' at Paydock.' + '\n' + e.message;
                    Logger.error(errorMessage);

                    Transaction.wrap(function () {
                        order.addNote('Paydock refund failed', errorMessage);
                    });

                    err = e;
                }

                if (err) {
                    throw new Error(err.message);
                }

                if (refundResult && !refundResult.error) {
                    Transaction.wrap(function () {
                        order.addNote('Paydock refund succeeded', 'Charge ' + chargeId + ' refund requested.');

                        if (i === paydockPaymentInstruments.length - 1) {
                            order.custom.paydockRefunded = true;
                        }
                    });

                    refundedResult++;
                }
            }
        }
    }

    return refundedResult;
}

/**
 * Attempts to capture Paydock Charge.
 * 
 * @param {String} chargeId - Charge ID
 * @param {Number} amount - amount to be captured
 * @param {dw.order.Order} order - Order optional
 * @returns {Object|null} Operation result in case of success, null otherwise
 */
function capturePaydockCharge(chargeId, amount, order) {
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger').getLogger('PAYDOCK', 'api.chargeCapture');
    var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');

    // early returns
    if (!chargeId) return null;

    var captureResult = null;
    var err = null;

    try {
        if (amount) {
            captureResult = paydockService.charges.capture(chargeId, {
                amount: amount
            });
        }
        else {
            captureResult = paydockService.charges.capture(chargeId);
        }
    } catch (e) {
        var errorMessage = 'Failed to capture charge ' + chargeId + ' at Paydock.' + '\n' + e.message;
        Logger.error(errorMessage);

        err = e;
    }

    if (err) {
        throw new Error(err.message);
    }
    else {
        if (order) {
            Transaction.wrap(function () {
                order.addNote('Paydock capture succeeded', 'Charge ' + chargeId + ' capture requested.' + (amount ? ' Amount is ' + amount : ''));
            });
        }
    }

    return captureResult;
}

/**
 * Attempts to capture Paydock Charges for the Order.
 * 
 * @param {dw.order.Order} order - Order
 * @param {Number} amount - amount to be captured
 * @returns {Number} Number of Captured Charges
 */
function capturePaydockCharges(order, amount) {
    var Order = require('dw/order/Order');
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger').getLogger('paydock', 'api.chargeCapture');
    var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');

    var capturedResult = 0;
    var paydockPaymentInstruments = getPaydockPaymentInstruments(order);

    if (paydockPaymentInstruments) {
        for (var i = 0; i < paydockPaymentInstruments.length; i++) {
            // shortcuts
            var paymentInstrument = paydockPaymentInstruments[i];
            var chargeId = paymentInstrument.paymentTransaction.transactionID;

            if (chargeId) {
                var captureResult = null;
                var err = null;

                try {
                    if (amount) {
                        captureResult = paydockService.charges.capture(chargeId, {
                            amount: amount
                        });
                    }
                    else {
                        captureResult = paydockService.charges.capture(chargeId);
                    }
                } catch (e) {
                    var errorMessage = 'Failed to capture charge ' + chargeId + ' at Paydock.' + '\n' + e.message;
                    Logger.error(errorMessage);

                    Transaction.wrap(function () {
                        order.addNote('Paydock capture failed', errorMessage);
                    });

                    err = e;
                }

                if (err) {
                    throw new Error(err.message);
                }

                if (captureResult && !captureResult.error) {
                    Transaction.wrap(function () {
                        order.addNote('Paydock capture succeeded', 'Charge ' + chargeId + ' capture requested.');

                        paymentInstrument.custom.paydockChargeStatus = captureResult.resource.data.status;

                        if (i === paydockPaymentInstruments.length - 1) {
                            if (order.paymentStatus.value !== Order.PAYMENT_STATUS_PAID) order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                            order.custom.paydockCaptured === true;
                        }
                    });

                    capturedResult++;
                }
            }
        }
    }

    return capturedResult;
}

/**
 * Adds the details to Paydock Charge payload object.
 * 
 * @param {Object} chargePayload - charge payload
 * @param {dw.order.LineItemContainer} lineItemCtnr - Line Item Container
 * @returns {void}
 */
function addChargePayloadDetails(chargePayload, lineItemCtnr) {
    var URLUtils = require('dw/web/URLUtils');

    // early returns
    if (!chargePayload || !lineItemCtnr) return;

    // data normalization
    chargePayload.customer = chargePayload.customer || {};
    chargePayload.shipping = chargePayload.shipping || {};
    chargePayload.customer.payment_source = chargePayload.customer.payment_source || {};
    chargePayload.items = chargePayload.items || [];

    // shortcuts
    var customer = chargePayload.customer;
    var shipping = chargePayload.shipping;
    var paymentSource = chargePayload.customer.payment_source;
    var items = chargePayload.items;
    var billingAddress = lineItemCtnr.billingAddress;
    var shipment = lineItemCtnr.defaultShipment;
    var shippingAddress = shipment.shippingAddress;
    var shippingMethod = shipment.shippingMethod;

    // add customer email
    if (lineItemCtnr.customerEmail) customer.email = lineItemCtnr.customerEmail;

    // add details of the customer and billing address
    if (billingAddress) {
        if (billingAddress.firstName) customer.first_name = billingAddress.firstName;
        if (billingAddress.lastName) customer.last_name = billingAddress.lastName;
        if (billingAddress.phone) customer.phone = billingAddress.phone;

        if (billingAddress.address1) paymentSource.address_line1 = billingAddress.address1;
        if (billingAddress.address2) paymentSource.address_line2 = billingAddress.address2;
        if (billingAddress.city) paymentSource.city = billingAddress.city;
        if (billingAddress.stateCode) paymentSource.state = billingAddress.stateCode;
        if (billingAddress.postalCode) paymentSource.postcode = billingAddress.postalCode;
        if (billingAddress.countryCode && billingAddress.countryCode.value) paymentSource.country = billingAddress.countryCode.value;
    }

    // add details of the shipping address
    if (shippingAddress) {
        if (shippingAddress.address1) shipping.address_line1 = shippingAddress.address1;
        if (shippingAddress.address2) shipping.address_line2 = shippingAddress.address2;
        if (shippingAddress.stateCode) shipping.address_state = shippingAddress.stateCode;
        if (shippingAddress.countryCode && shippingAddress.countryCode.value) shipping.address_country = shippingAddress.countryCode.value;
        if (shippingAddress.city) shipping.address_city = shippingAddress.city;
        if (shippingAddress.postalCode) shipping.address_postcode = shippingAddress.postalCode;
    }

    // add details of the shipping method and shipping price
    if (shippingMethod && shipment.shippingTotalPrice.available) {
        shipping.method =  shippingMethod.custom.storePickupEnabled ? 'PICKUP' : 'GROUND';
        shipping.currency = shipment.shippingTotalPrice.currencyCode;
        shipping.amount = shipment.shippingTotalPrice.value;
    }

    // add items details
    if (!shipment.productLineItems.empty) {
        var iter = shipment.productLineItems.iterator();

        while (iter.hasNext()) {
            var pli = iter.next();

            if (pli.product && pli.productName && pli.quantityValue && pli.adjustedPrice.available) {
                var item = {
                    name: pli.productName,
                    quantity: pli.quantityValue,
                    item_uri: URLUtils.abs('Product-Show', 'pid', pli.product.ID).toString(),
                    amount: pli.adjustedPrice.value
                };

                // add an image
                var pliImage = pli.product.getImage('small');
                if (pliImage) item.image_uri = pliImage.absURL.toString();

                // add a brand
                if (pli.product.brand) item.type = pli.product.brand;

                items.push(item);
            }
            else { // damaged Product Line Items
                items = [];

                break;
            }
        }
    }
}

/**
 * Attempts to initialize Paydock Charge with Wallet for the current Basket for the provided Gateway.
 * 
 * @param {dw.order.Basket} currentBasket - Current Basket
 * @param {String} gatewayId - Gateway ID
 * @param {String} chargeCapture - Charge Capture
 * @param {Boolean} fraudEnabled - Fraud Enabled
 * @param {String} fraudServiceID - Fraud Service ID
 * @returns {Object|null} Token, Charge ID and other data pairs, or null
 */
function initializePaydockChargeWallet(currentBasket, gatewayId, chargeCapture, fraudEnabled, fraudServiceID) {
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var Logger = require('dw/system/Logger').getLogger('PAYDOCK', 'api.chargeWallet');
    var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');

    // early returns
    if (!currentBasket || !gatewayId) return null;

    // defaults
    var chargeResult = null;

    var amount = getNonGiftCertificateAmount(currentBasket);
    
    if (amount && amount.available) {
        amount = amount.value;
    }
    else {
        return null;
    }

    var chargeWalletPayload = {
        amount: amount,
        currency: currentBasket.getCurrencyCode(),
        customer: {
            payment_source: {
                gateway_id: gatewayId
            }
        },
        meta: {
            store_id: Site.current.ID,
            store_name: Site.current.name,
            success_url: URLUtils.abs('CheckoutServices-PlaceOrder').toString(),
            error_url: URLUtils.abs('CheckoutServices-PlaceOrder').toString()
        }
    };

    // add charge payload details
    addChargePayloadDetails(chargeWalletPayload, currentBasket);

    // add fraud details
    if (fraudEnabled && fraudServiceID) {
        chargeWalletPayload.fraud = {
            service_id: fraudServiceID,
            mode: 'active'
        };
    }

    try {
        chargeResult = paydockService.charges.wallet(chargeWalletPayload, chargeCapture);
    } catch (e) {
        var t = e;
        var errorMessage = 'Failed to initialize charge for wallet payments at Paydock. Gateway ID is ' + gatewayId + '.\n' + e.message;
        Logger.error(errorMessage);

        chargeResult = null;
    }

    if (chargeResult && !chargeResult.error) {
        return {
            token: chargeResult.resource.data.token,
            chargeId: chargeResult.resource.data.charge._id,
            gatewayName: chargeResult.resource.data.charge.customer.payment_source.gateway_name,
            gatewayType: chargeResult.resource.data.charge.customer.payment_source.gateway_type,
            walletType: chargeResult.resource.data.charge.customer.payment_source.wallet_type
        }
    }

    return chargeResult;
}

/**
 * Attempts to cancel Paydock Charge
 * 
 * @param {String} chargeId - Charge ID
 * @param {dw.order.Order} order - Order optional
 * @returns {Object|null} Operation result in case of success, null otherwise
 */
function cancelCharge(chargeId, order) {
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger').getLogger('PAYDOCK', 'api.chargeCancel');
    var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');

    // early returns
    if (!chargeId) return null;

    var cancelResult = null;
    var err = null;

    try {
        cancelResult = paydockService.charges.cancel(chargeId);
    } catch (e) {
        var errorMessage = 'Failed to cancel charge ' + chargeId + ' at Paydock.' + '\n' + e.message;
        Logger.error(errorMessage);

        err = e;
    }

    if (err) {
        throw new Error(err.message);
    }
    else {
        if (order) {
            Transaction.wrap(function () {
                order.addNote('Paydock cancellation succeeded', 'Charge ' + chargeId + ' cancellation requested.');
            });
        }
    }

    return cancelResult;
}

/**
 * Attempts to archive a Paydock Charge
 * 
 * @param {String} chargeId - Charge ID
 * @returns {Boolean} Success or not
 */
function archiveCharge(chargeId) {
    var Logger = require('dw/system/Logger').getLogger('paydock', 'api.archiveCancel');
    var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');

    // early returns
    if (!chargeId) return false;

    var archiveResult = null;
    var err = null;

    try {
        archiveResult = paydockService.charges.archive(chargeId);
    } catch (e) {
        var errorMessage = 'Failed to archive charge ' + chargeId + ' at Paydock.' + '\n' + e.message;
        Logger.error(errorMessage);

        err = e;
    }

    if (err) {
        throw new Error(err.message);
    }

    if (archiveResult && !archiveResult.error) {
        return true;
    }

    return false;
}

module.exports = {
    isCreditCardPaymentMethodEnabled: isCreditCardPaymentMethodEnabled,
    isPaydockPaymentMethodEnabled: isPaydockPaymentMethodEnabled,
    isPaydockWalletButtonsPaymentMethod: isPaydockWalletButtonsPaymentMethod,
    isPaydockWalletButtonsPaymentMethodEnabled: isPaydockWalletButtonsPaymentMethodEnabled,
    isPaydockWalletButtonsPaymentMethodsEnabled: isPaydockWalletButtonsPaymentMethodsEnabled,
    isPaydockPaymentMethodsEnabled: isPaydockPaymentMethodsEnabled,
    getPaydockWalletButtonPaymentMethodConfig: getPaydockWalletButtonPaymentMethodConfig,
    isPaydockPaymentInstrument: isPaydockPaymentInstrument,
    getPaydockPaymentInstrument: getPaydockPaymentInstrument,
    getPaydockPaymentInstrumentModel: getPaydockPaymentInstrumentModel,
    removePaydockPaymentInstruments: removePaydockPaymentInstruments,
    createPaydockPaymentInstrument: createPaydockPaymentInstrument,
    isPaydockPaymentInstrumentEligibleForCapture: isPaydockPaymentInstrumentEligibleForCapture,
    isPaydockPaymentInstrumentEligibleForRefund: isPaydockPaymentInstrumentEligibleForRefund,
    isPaydockPaymentInstrumentEligibleForCancel: isPaydockPaymentInstrumentEligibleForCancel,
    updatePaydockPaymentInstrumentWithChargeDetails: updatePaydockPaymentInstrumentWithChargeDetails,
    getNewPaydockOrderNumber: getNewPaydockOrderNumber,
    getReservedPaydockOrderNumber: getReservedPaydockOrderNumber,
    getNonGiftCertificateAmount: getNonGiftCertificateAmount,
    getCheckoutButtonAfterpayMeta: getCheckoutButtonAfterpayMeta,
    getCheckoutButtonZipMoneyMeta: getCheckoutButtonZipMoneyMeta,
    createOrder: createOrder,
    refundPaydockCharge: refundPaydockCharge,
    refundPaydockCharges: refundPaydockCharges,
    capturePaydockCharge: capturePaydockCharge,
    capturePaydockCharges: capturePaydockCharges,
    initializePaydockChargeWallet: initializePaydockChargeWallet,
    cancelCharge: cancelCharge,
    archiveCharge: archiveCharge,
    addChargePayloadDetails: addChargePayloadDetails
}
