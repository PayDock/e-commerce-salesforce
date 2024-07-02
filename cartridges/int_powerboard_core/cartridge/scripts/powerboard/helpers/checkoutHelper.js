'use strict';

// constants
var powerboardWalletButtonsPaymentMethodIDs = ['POWERBOARD_WALLET_BUTTONS_APPLE_PAY', 'POWERBOARD_WALLET_BUTTONS_GOOGLE_PAY', 'POWERBOARD_WALLET_BUTTONS_PAYPAL', 'POWERBOARD_WALLET_BUTTONS_AFTERPAY'];
var powerboardWalletButtonsPaymentMethodTypes = ['ApplePay', 'GooglePay', 'PayPal', 'Afterpay'];
var powerboardPaymentMethodID = "POWERBOARD";

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
 * Checks if Powerboard payments are enabled.
 *
 * @return {boolean} - True if Powerboard payments are enabled
 */
function isPowerboardPaymentMethodEnabled() {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentInstrument = require('dw/order/PaymentInstrument');

    var powerboardPaymentMethod = PaymentMgr.getPaymentMethod('POWERBOARD');

    return powerboardPaymentMethod && powerboardPaymentMethod.active;
}

/**
 * Checks if Payment Method is a PowerBoard Wallet Buttons one.
 *
 * @param {String} paymentMethodId - Payment Method ID
 * @return {boolean} - Verification result
 */
function isPowerboardWalletButtonsPaymentMethod(paymentMethodId) {
    return paymentMethodId && powerboardWalletButtonsPaymentMethodIDs.indexOf(paymentMethodId) !== -1;
}

/**
 * Checks if PowerBoard Wallet Buttons payment is enabled.
 *
 * @return {boolean} - True if PowerBoard Wallet Buttons payment is enabled
 */
function isPowerboardWalletButtonsPaymentMethodEnabled(paymentMethodId) {
    var PaymentMgr = require('dw/order/PaymentMgr');

    // early returns
    if (!paymentMethodId || !isPowerboardWalletButtonsPaymentMethod(paymentMethodId)) return false;

    // get Payment Method
    var powerboardWalletButtonsPaymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);

    return powerboardWalletButtonsPaymentMethod && powerboardWalletButtonsPaymentMethod.active;
}

/**
 * Checks if any PowerBoard Wallet Buttons payments are enabled.
 *
 * @return {boolean} - True if Powerboard Buttons payments are enabled
 */
function isPowerboardWalletButtonsPaymentMethodsEnabled() {
    var PaymentMgr = require('dw/order/PaymentMgr');

    for (var i = 0; i < powerboardWalletButtonsPaymentMethodIDs.length; i++) {
        var powerboardWalletButtonsPaymentMethodID = powerboardWalletButtonsPaymentMethodIDs[i]; // shortcut

        if (isPowerboardWalletButtonsPaymentMethodEnabled(powerboardWalletButtonsPaymentMethodID)) return true;
    }

    return false;
}

/**
 * Checks if any Powerboard payments are enabled.
 *
 * @return {boolean} - True if any Powerboard payments are enabled
 */
function isPowerboardPaymentMethodsEnabled() {
    return isPowerboardPaymentMethodEnabled() || isPowerboardWalletButtonsPaymentMethodsEnabled();
}

/**
 * Get PowerBoard Wallet Buttons Payment Method type.
 *
 * @param {String} paymentMethodId - Payment Method ID
 * @return {String} - Payment Method type
 */
function getPowerboardWalletButtonsPaymentMethodType(paymentMethodId) {
    return paymentMethodId ?
        (powerboardWalletButtonsPaymentMethodTypes[ powerboardWalletButtonsPaymentMethodIDs.indexOf(paymentMethodId) ] || null) :
        null;
}

/**
 * Get PowerBoard Wallet Buttons Payment Method configuration.
 *
 * @param {String} paymentMethodId - Payment Method ID
 * @param {Object} preferences - Preferences Object
 * @return {Object|null} - Payment Method configuration, or null if Payment Method does not exist or is not configured
 */
function getPowerboardWalletButtonPaymentMethodConfig(paymentMethodId, preferences) {
    var PaymentMgr = require('dw/order/PaymentMgr');

    // early returns
    if (!paymentMethodId || !preferences) return null;

    if (!isPowerboardWalletButtonsPaymentMethodEnabled(paymentMethodId)) return null;

    // get Payment Method
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);

    // get Payment Method type
    var paymentMethodType = getPowerboardWalletButtonsPaymentMethodType(paymentMethodId);

    if (!paymentMethodType) return null;

    // defaults
    var chargeCapture;
    var gatewayId;
    var fraudEnabled;
    var fraudServiceID;

    switch (paymentMethodType) {
        case 'ApplePay':
            chargeCapture = preferences.powerboardWalletButtonsApplePayChargeCapture;
            gatewayId = preferences.powerboardWalletButtonsApplePayGatewayID;
            fraudEnabled = preferences.powerboardWalletButtonsApplePayFraudEnabled;
            fraudServiceID = preferences.powerboardWalletButtonsApplePayFraudServiceID;
            break;
        case 'GooglePay':
            chargeCapture = preferences.powerboardWalletButtonsGooglePayChargeCapture;
            gatewayId = preferences.powerboardWalletButtonsGooglePayGatewayID;
            fraudEnabled = preferences.powerboardWalletButtonsGooglePayFraudEnabled;
            fraudServiceID = preferences.powerboardWalletButtonsGooglePayFraudServiceID;
            break;
        case 'PayPal':
            chargeCapture = preferences.powerboardWalletButtonsPayPalChargeCapture;
            gatewayId = preferences.powerboardWalletButtonsPayPalGatewayID;
            fraudEnabled = preferences.powerboardWalletButtonsPayPalFraudEnabled;
            fraudServiceID = preferences.powerboardWalletButtonsPayPalFraudServiceID;
            break;
        case 'Afterpay':
            chargeCapture = preferences.powerboardWalletButtonsAfterpayChargeCapture;
            gatewayId = preferences.powerboardWalletButtonsAfterpayGatewayID;
            fraudEnabled = preferences.powerboardWalletButtonsAfterpayFraudEnabled;
            fraudServiceID = preferences.powerboardWalletButtonsAfterpayFraudServiceID;
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
 * Checks whether the passed Payment Instrument is handled by Powerboard.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment Instrument
 * @return {boolean} - True if Payment Instrument is handled by Powerboard
 */
function isPowerboardPaymentInstrument(paymentInstrument) {
    if (!paymentInstrument || !paymentInstrument.paymentMethod) {
        return false;
    }

    var powerboardPaymentInstrumentRegex = /(^POWERBOARD$|^POWERBOARD_.+)/i;
    return powerboardPaymentInstrumentRegex.test(paymentInstrument.paymentMethod);
}

/**
 * Gets the first Powerboard Payment Instrument of the passed Line Item Container.
 *
 * @param {dw.order.LineItemContainer} lineItemCtnr - Line Item Container
 * @return {dw.order.PaymentInstrument|null} - Powerboard Payment Instrument or null
 */
function getPowerboardPaymentInstrument(lineItemCtnr) {
    var allPaymentInstruments = lineItemCtnr.paymentInstruments.toArray();
    var powerboardPaymentInstruments = allPaymentInstruments.filter(isPowerboardPaymentInstrument);

    return powerboardPaymentInstruments.length ? powerboardPaymentInstruments[0] : null;
}

/**
 * Gets the first Powerboard Payment Instrument model of the passed Line Item Container model.
 *
 * @param {Object} lineItemCtnrModel - Line Item Container model
 * @return {Object|null} - Powerboard Payment Instrument model or null
 */
function getPowerboardPaymentInstrumentModel(lineItemCtnrModel) {
    var allPaymentInstruments = lineItemCtnrModel ? lineItemCtnrModel : [];
    var powerboardPaymentInstruments = allPaymentInstruments.filter(isPowerboardPaymentInstrument);

    return powerboardPaymentInstruments.length ? powerboardPaymentInstruments[0] : null;
}

/**
 * Gets the Powerboard Payment Instruments of the passed Line Item Container.
 *
 * @param {dw.order.LineItemContainer} lineItemCtnr - Line Item Container
 * @return {[dw.order.PaymentInstrument]|null} - Powerboard Payment Instruments list or null
 */
function getPowerboardPaymentInstruments(lineItemCtnr) {
    var allPaymentInstruments = lineItemCtnr.paymentInstruments.toArray();
    var powerboardPaymentInstruments = allPaymentInstruments.filter(isPowerboardPaymentInstrument);

    return powerboardPaymentInstruments.length ? powerboardPaymentInstruments : null;
}

/**
 * Removes any Powerboard Payment Instruments for the passed Line Item Container.
 *
 * @param {dw.order.LineItemContainer} lineItemCtnr - Line Item Container
 * @return {void}
 */
function removePowerboardPaymentInstruments(lineItemCtnr) {
    // early returns
    if (!lineItemCtnr) return;

    var iter = lineItemCtnr.paymentInstruments.iterator();

    // remove Powerboard Payment Instruments
    while (iter.hasNext()) {
        var existingPI = iter.next();

        if (isPowerboardPaymentInstrument(existingPI)) {
            lineItemCtnr.removePaymentInstrument(existingPI);
        }
    }
}

/**
 * Creates Powerboard Payment Instrument for the passed Line Item Container.
 *
 * @param {dw.order.LineItemContainer} lineItemCtnr - Line Item Container
 * @return {dw.order.PaymentInstrument|null} - Powerboard Payment Instrument or null
 */
function createPowerboardPaymentInstrument(lineItemCtnr, paymentMethodId, params) {
    var PaymentMgr = require('dw/order/PaymentMgr');

    // early returns
    if (!lineItemCtnr) return null;

    removePowerboardPaymentInstruments(lineItemCtnr);

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
            paymentInstrument.custom.powerboardToken = params.token;
        }

        if ('chargeId' in params) {
            paymentInstrument.custom.powerboardChargeID = params.chargeId;

            lineItemCtnr.custom.powerboardChargeID = params.chargeId;
        }

        if ('chargeStatus' in params) {
            paymentInstrument.custom.powerboardChargeStatus = params.chargeStatus;
        }

        if ('vaultToken' in params) {
          paymentInstrument.custom.powerboardVaultToken = params.vaultToken;
        }

        if ('vaultType' in params) {
          paymentInstrument.custom.powerboardVaultType = params.vaultType;
        }

        if ('gatewayType' in params) {
            paymentInstrument.custom.powerboardGatewayType = params.gatewayType;
        }

        if ('customerID' in params) {
          paymentInstrument.custom.powerboardCustomerID = params.customerID;
        }

        if ('powerboard3DSToken' in params) {
          paymentInstrument.custom.powerboard3DSToken = params.powerboard3DSToken;
        }

        if ('powerboardFraudID' in params) {
          paymentInstrument.custom.powerboardFraudID = params.powerboardFraudID;
          lineItemCtnr.custom.powerboardFraudID = params.powerboardFraudID;
        }

        if ('powerboardFraudStatus' in params) {
          paymentInstrument.custom.powerboardFraudStatus = params.powerboardFraudStatus;
        }

        if ('powerboardCardDetails' in params) {
          paymentInstrument.custom.powerboardCardDetails = params.powerboardCardDetails;
        }
    }

    // shortcut
    var paymentTransaction = paymentInstrument.paymentTransaction;

    // Order may get created before the Charge creation at Powerboard side
    if (
        !paymentTransaction.getPaymentProcessor() &&
        [
            'POWERBOARD',
            'POWERBOARD_WALLET_BUTTONS_APPLE_PAY', 'POWERBOARD_WALLET_BUTTONS_GOOGLE_PAY', 'POWERBOARD_WALLET_BUTTONS_PAYPAL', 'POWERBOARD_WALLET_BUTTONS_AFTERPAY',
            'POWERBOARD_CHECKOUT_BUTTON_AFTERPAY', 'POWERBOARD_CHECKOUT_BUTTON_ZIPMONEY'
        ].indexOf(paymentMethodId) !== -1
    ) {
        var processor = PaymentMgr.getPaymentMethod(paymentMethodId).getPaymentProcessor();

        if (processor) {
            paymentTransaction.setPaymentProcessor(processor);
        }
    }

    paymentTransaction.setType(params && params.powerboardChargeCapture ? dw.order.PaymentTransaction.TYPE_CAPTURE : dw.order.PaymentTransaction.TYPE_AUTH);
}

/**
 * Checks if Powerboard Payment Instrument is eligible to request charge captured.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Powerboard Payment Instrument
 * @return {Boolean} - Verification result
 */
function isPowerboardPaymentInstrumentEligibleForCapture(paymentInstrument) {
    // early returns
    if (!isPowerboardPaymentInstrument(paymentInstrument)) return false;

    return paymentInstrument.custom.powerboardChargeStatus === 'pending';
}

/**
 * Returns the maximum amount the capture may be requested for the PowerBoard Payment Instrument.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - PowerBoard Payment Instrument
 * @return {Number|null} - The amount
 */
function getPowerboardPaymentInstrumentCaptureAmount(paymentInstrument) {
    // early returns
    if (
        !isPowerboardPaymentInstrumentEligibleForCapture(paymentInstrument) ||
        !paymentInstrument.paymentTransaction.amount.available
    ) return null;

    // data normalization
    var capturedAmount = paymentInstrument.custom.powerboardCapturedAmount;
    capturedAmount = !empty(capturedAmount) ? Number(capturedAmount) : 0;
    capturedAmount = !isNaN(capturedAmount) ? capturedAmount : 0;

    var maxCaptureAmount = paymentInstrument.paymentTransaction.amount.value - capturedAmount;
    maxCaptureAmount = new dw.value.Money(maxCaptureAmount, paymentInstrument.paymentTransaction.amount.currencyCode);

    return maxCaptureAmount.value;
}

/**
 * Checks if Powerboard Payment Instrument is eligible to request charge refund.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Powerboard Payment Instrument
 * @return {Boolean} - Verification result
 */
function isPowerboardPaymentInstrumentEligibleForRefund(paymentInstrument) {
    // early returns
    if (!isPowerboardPaymentInstrument(paymentInstrument)) return false;

    if (paymentInstrument.custom.powerboardChargeStatus === 'complete') return true;

    if (paymentInstrument.custom.powerboardChargeStatus === 'refunded') {
        var capturedAmount = paymentInstrument.custom.powerboardCapturedAmount ?
            Number(paymentInstrument.custom.powerboardCapturedAmount) :
            0;
        capturedAmount = isNaN(capturedAmount) ? 0 : capturedAmount;

        var refundedAmount = paymentInstrument.custom.powerboardRefundedAmount ?
            Number(paymentInstrument.custom.powerboardRefundedAmount) :
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
 * Returns the maximum amount the refund may be requested for the PowerBoard Payment Instrument.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - PowerBoard Payment Instrument
 * @return {Number|null} - The amount
 */
function getPowerboardPaymentInstrumentRefundAmount(paymentInstrument) {
    // early returns
    if (
        !isPowerboardPaymentInstrumentEligibleForRefund(paymentInstrument) ||
        !paymentInstrument.paymentTransaction.amount.available
    ) return null;

    // data normalization
    var capturedAmount = paymentInstrument.custom.powerboardCapturedAmount;
    capturedAmount = !empty(capturedAmount) ? Number(capturedAmount) : 0;
    capturedAmount = !isNaN(capturedAmount) ? capturedAmount : 0;

    var refundedAmount = paymentInstrument.custom.powerboardRefundedAmount;
    refundedAmount = !empty(refundedAmount) ? Number(refundedAmount) : 0;
    refundedAmount = !isNaN(refundedAmount) ? refundedAmount : 0;

    var maxRefundAmount = capturedAmount >= refundedAmount ? capturedAmount - refundedAmount : 0;
    maxRefundAmount = new dw.value.Money(maxRefundAmount, paymentInstrument.paymentTransaction.amount.currencyCode);

    return maxRefundAmount.value;
}

/**
 * Checks if Powerboard Payment Instrument is eligible to request charge cancel.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Powerboard Payment Instrument
 * @return {Boolean} - Verification result
 */
function isPowerboardPaymentInstrumentEligibleForCancel(paymentInstrument) {
    // early returns
    if (!isPowerboardPaymentInstrument(paymentInstrument)) return false;

    if (paymentInstrument.custom.powerboardChargeStatus === 'pending') return true;

    if (
        paymentInstrument.custom.powerboardChargeStatus === 'complete' &&
        (
            paymentInstrument.custom.powerboardCapturedAmount && paymentInstrument.paymentTransaction.amount.available ?
            paymentInstrument.custom.powerboardCapturedAmount - paymentInstrument.paymentTransaction.amount.value === 0 :
            true
        )
    ) return true;

    return false;
}

/**
 * Checks if Powerboard charge associated with the Payment Instrument in under the processing.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Powerboard Payment Instrument
 * @return {Boolean} - Verification result
 */
function isPowerboardPaymentInstrumentUnderProcessing(paymentInstrument) {
    // early returns
    if (!isPowerboardPaymentInstrument(paymentInstrument)) return false;

    if (['inreview', 'pre_authentication_pending'].indexOf(paymentInstrument.custom.powerboardChargeStatus) !== -1) return true;

    if (['inreview'].indexOf(paymentInstrument.custom.powerboardFraudStatus) !== -1) return true;

    return false;
}

/**
 * Update Powerboard Payment Instrument with the charge details.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Powerboard Payment Instrument
 * @param {Object} chargeDetails - previously retrieved charge details
 * @return {void}
 */
function updatePowerboardPaymentInstrumentWithChargeDetails(paymentInstrument, chargeDetails) {
    var Transaction = require('dw/system/Transaction');
    var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');

    // early returns
    if (!isPowerboardPaymentInstrument(paymentInstrument)) return;

    var chargeResult = chargeDetails || powerboardService.charges.get(paymentInstrument.custom.powerboardChargeID);

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
        paymentInstrument.custom.powerboardChargeStatus = chargeResult.resource.data.status;
        paymentInstrument.custom.powerboardCapturedAmount = (capturedAmount || autoCapturedAmount).toFixed(2);
        paymentInstrument.custom.powerboardRefundedAmount = refundedAmount.toFixed(2);
    });
}

/**
 * Update Powerboard Payment Instrument with the notification details.
 *
 * @param {dw.order.PaymentInstrument} paymentInstrument - Powerboard Payment Instrument
 * @param {Object} notification - previously retrieved notification
 * @return {void}
 */
function updatePowerboardPaymentInstrumentWithNotificaionDetails(paymentInstrument, notification) {
    var Transaction = require('dw/system/Transaction');
    var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');

    // early returns
    if (!isPowerboardPaymentInstrument(paymentInstrument) || !notification || !notification.event || !notification.data) return;

    var autoCapturedAmount = 0;
    var capturedAmount = 0;
    var refundedAmount = 0;
    
    for (var i = 0; i < notification.data.transactions.length; i++) {
        var transaction = notification.data.transactions[i]; // shortcut

        if (transaction.type === 'sale' && transaction.status === 'complete' && transaction.amount) autoCapturedAmount += transaction.amount;
        if (transaction.type === 'capture' && transaction.status === 'complete' && transaction.amount) capturedAmount += transaction.amount;
        if (transaction.type === 'refund' && transaction.status === 'complete' && transaction.amount) refundedAmount += transaction.amount;
    }

    Transaction.wrap(function() {
        paymentInstrument.custom.powerboardChargeStatus = notification.data.status;
        paymentInstrument.custom.powerboardCapturedAmount = (capturedAmount || autoCapturedAmount).toFixed(2);
        paymentInstrument.custom.powerboardRefundedAmount = refundedAmount.toFixed(2);
    });
}

function updateOrderWithNotificationDetails(order, paymentInstrument, notification) {
    var Transaction = require('dw/system/Transaction');
    var Order = require('dw/order/Order');
    var Logger = require('dw/system/Logger').getLogger('POWERBOARD', 'notification');
    var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');
    var preferences = require('*/cartridge/config/preferences');

    var err;
    var chargeResult;

    // early returns
    if (
        !order ||
        !isPowerboardPaymentInstrument(paymentInstrument)
        || !notification
        || !notification.event
        || !notification.data
    ) return;

    // shortcuts
    var event = notification.event;
    var data = notification.data;

    var autoCapturedAmount = 0;
    var capturedAmount = 0;
    var refundedAmount = 0;
    
    for (var i = 0; i < data.transactions.length; i++) {
        var transaction = data.transactions[i]; // shortcut

        if (transaction.type === 'sale' && transaction.status === 'complete' && transaction.amount) autoCapturedAmount += transaction.amount;
        if (transaction.type === 'capture' && transaction.status === 'complete' && transaction.amount) capturedAmount += transaction.amount;
        if (transaction.type === 'refund' && transaction.status === 'complete' && transaction.amount) refundedAmount += transaction.amount;
    }

    capturedAmount = capturedAmount || autoCapturedAmount;

    Transaction.wrap(function () {
        switch (event) {
            case 'fraud_check_transaction_in_review_approved':
                order.addNote('Fraud Notification', 'Fraud check transaction in review approved');
                paymentInstrument.custom.powerboardFraudStatus = 'complete';
                break;
            case 'transaction_success':
                if ((data.transaction.type === 'capture' || data.transaction.type === 'sale') && data.transaction.status === 'complete') {
                    order.addNote('Transaction Notification',
                        data.amount === data.transaction.amount ?
                            'Captured' :
                            'Captured ' + data.transaction.amount + ' ' + data.transaction.currency
                    );

                    order.setPaymentStatus(
                        paymentInstrument.paymentTransaction.amount.value == capturedAmount ?
                            Order.PAYMENT_STATUS_PAID :
                            Order.PAYMENT_STATUS_PARTPAID
                    );

                    order.custom.powerboardCaptured = true;
                }
                break;
            case 'transaction_failure':
                order.addNote('Transaction Notification',
                    (data.transaction.type === 'sale' && data.transaction.status === 'pending') ?
                        'Authorized' :
                        'Failed'
                );
                break;
            case 'refund_success':
                if (data.transaction.type === 'refund' && data.transaction.status === 'complete') {
                    order.addNote('Transaction Notification',
                        data.amount === data.transaction.amount ?
                            'Refunded' :
                            'Refunded ' + data.transaction.amount + ' ' + data.transaction.currency
                    );

                    order.setPaymentStatus(
                        paymentInstrument.custom.powerboardCapturedAmount == refundedAmount ?
                            Order.PAYMENT_STATUS_PAID :
                            Order.PAYMENT_STATUS_PARTPAID
                    );

                    order.custom.powerboardRefunded = true;
                }
                break;
            case 'refund_failure':
                order.addNote('Transaction Notification', 'Refund failed');
                break;
            case 'refund_requested':
                order.addNote('Transaction Notification', 'Refund requested');
                break;
            case 'standalone_fraud_check_in_review':
                order.addNote('Fraud Notification', 'Standalone Fraud check in review');
                paymentInstrument.custom.powerboardFraudStatus = 'inreview';
                break;
            case 'standalone_fraud_check_success':
                order.addNote('Fraud Notification', 'Standalone Fraud check success');
                paymentInstrument.custom.powerboardFraudStatus = 'complete';
                break;
            case 'standalone_fraud_check_failed':
                order.addNote('Fraud Notification', 'Standalone Fraud check failed');
                paymentInstrument.custom.powerboardFraudStatus = 'failed';
                break;
            case 'standalone_fraud_check_in_review_declined':
                order.addNote('Fraud Notification', 'Standalone Fraud check in review declined');
                paymentInstrument.custom.powerboardFraudStatus = 'declined';
                break;
            case 'fraud_check_in_review':
                order.addNote('Fraud Notification', 'Fraud check in review');
                paymentInstrument.custom.powerboardFraudStatus = 'inreview';
                break;
            case 'fraud_check_in_review_async_approved':
                order.addNote('Fraud Notification', 'Fraud check in review assync approved');
                paymentInstrument.custom.powerboardFraudStatus = 'complete';
                break;
            case 'fraud_check_in_review_async_declined':
                order.addNote('Fraud Notification', 'Fraud check in review assync declined');
                paymentInstrument.custom.powerboardFraudStatus = 'declined';
                break;
            case 'fraud_check_transaction_in_review_async_approved':
                order.addNote('Fraud Notification', 'Fraud check transaction in review assync approved');
                paymentInstrument.custom.powerboardFraudStatus = 'complete';
                break;
            case 'fraud_check_transaction_in_review_async_declined':
                order.addNote('Fraud Notification', 'Fraud check transaction in review assync declined');
                paymentInstrument.custom.powerboardFraudStatus = 'declined';
                break;
            case 'fraud_check_success':
                order.addNote('Fraud Notification', 'Fraud check success');
                paymentInstrument.custom.powerboardFraudStatus = 'complete';
                break;
            case 'fraud_check_failed':
                order.addNote('Fraud Notification', 'Fraud check failed');
                paymentInstrument.custom.powerboardFraudStatus = 'failed';
                break;
            case 'fraud_check_transaction_in_review_declined':
                order.addNote('Fraud Notification', 'Fraud check transaction in review declined');
                paymentInstrument.custom.powerboardFraudStatus = 'declined';
                break;
        }
    });
}

function processStandAloneApproveNotification(order, paymentInstrument, notification) {
  var Transaction = require('dw/system/Transaction');
  var Order = require('dw/order/Order');
  var Logger = require('dw/system/Logger').getLogger('POWERBOARD', 'notification');
  var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');
  var preferences = require('*/cartridge/config/preferences');

  var err;
  var chargeResult;

  // early returns
  if (
      !isPowerboardPaymentInstrument(paymentInstrument)
      || !notification
      || !notification.event
      || !notification.data
      || empty(order)
  ) return;

  var paymentAmount = getNonGiftCertificateAmount(order);

  var chargeReqObj = {
    amount: paymentAmount.value.toString(),
    currency: paymentAmount.currencyCode,
    reference: order.orderNo,
    customer: {
      payment_source: {
        gateway_id: preferences.powerboard.powerboardGatewayID
      }
    }
  }

  if (!empty(order.paymentInstrument.custom.powerboardCustomerID)) {
    chargeReqObj.customer_id = order.paymentInstrument.custom.powerboardCustomerID;
  }

  if (preferences.powerboard.powerboard3DSType.value === 'inbuilt3DS') {
    chargeReqObj._3ds = {
      id: order.paymentInstrument.custom.powerboardCharge3DSToken
    }
  }

  if (preferences.powerboard.powerboard3DSFlow.value === 'ott'
    && preferences.powerboard.powerboard3DSType.value !== 'inbuilt3DS'
  ) {
    chargeReqObj.token = oreder.paymentInstrument.custom.powerboardToken;
  }

  if (preferences.powerboard.powerboard3DSType.value === 'standalone3DS'
    && preferences.powerboard.powerboard3DSFlow.value === 'vault'
  ) {
    chargeReqObj._3ds_charge_id = order.paymentInstrument.custom.powerboardCharge3DSToken
  }

  if (order.paymentInstrument.custom.powerboardVaultToken) {
    chargeReqObj.customer.payment_source.vault_token = order.paymentInstrument.custom.powerboardVaultToken
  }

  addChargePayloadDetails(chargeReqObj, order);

  try {
    chargeResult = powerboardService.charges.create(chargeReqObj, preferences.powerboard.powerboardChargeCapture);
    var attachFraudResult = powerboardService.charges.attachFraud(chargeResult.resource.data._id, {
      fraud_charge_id: order.paymentInstrument.custom.powerboardFraudID
    });
  } catch (e) {
    var errorMessage = 'Failed to create charge or attach fraud  at Powerboard.' + '\n' + e.message;
    Logger.error(errorMessage);

    err = e;
  }

  if (err) {
    throw new Error(err.message);
  } else {
    Transaction.wrap(function () {
        order.addNote('Powerboard charge succeeded', 'Charge ' + chargeResult.resource.data._id);

        if (chargeResult) {
          order.paymentInstrument.custom.powerboardChargeStatus = chargeResult.resource.data.status;
    
          if (chargeResult.resource.data._id) {
            order.paymentInstrument.custom.powerboardChargeID = chargeResult.resource.data._id;
            order.paymentInstrument.paymentTransaction.setTransactionID(chargeResult.resource.data._id);
          }
      
          if (chargeResult.resource.data.status === 'complete') {
            order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
          }
    
          // update Powerboard Payment Instrument with charge details
          updatePowerboardPaymentInstrumentWithChargeDetails(order.paymentInstrument, chargeResult);
        }
    });
  }
}

/**
 * Reserves the new Order Number for the needs of Powerboard.
 * Overwrites the previous one stored in session, if any.
 *
 * @return {String} Order Number
 */
function getNewPowerboardOrderNumber() {
    var OrderMgr = require('dw/order/OrderMgr');
    var powerboardOrderNumber = session.privacy.powerboardOrderNumber;

    if (
        !powerboardOrderNumber || // no reserved Order Number
        OrderMgr.getOrder(powerboardOrderNumber)   // reserved Order Number was used already
    ) {
        powerboardOrderNumber = session.privacy.powerboardOrderNumber = OrderMgr.createOrderNo();
    }

    return powerboardOrderNumber;
}

/**
 * Returns reserved for Powerboard Order Number.
 * Checks the Powerboard's Payment Instrument of the passed Line Item Container,
 * falls back to the value stored in session if no Order Number found in the Payment Instrument.
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Line Item Container
 * @return {String} - Reserved Order Number
 */
function getReservedPowerboardOrderNumber(lineItemCtnr) {
    var powerboardOrderNumber = null;

    if (lineItemCtnr) {
        var powerboardPaymentInstrument = getPowerboardPaymentInstrument(lineItemCtnr);

        if (powerboardPaymentInstrument) {
            var paymentTransaction = powerboardPaymentInstrument.paymentTransaction;

            if ('powerboardOrderNumber' in paymentTransaction.custom) {
                powerboardOrderNumber = paymentTransaction.custom.powerboardOrderNumber;
            }
        }
    }

    if (!powerboardOrderNumber) {
        powerboardOrderNumber = session.privacy.powerboardOrderNumber;
    }

    return powerboardOrderNumber;
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
 * Returns Meta details for the Powerboard Checkout Button Afterpay.
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
            currency: lineItemCtnr.getCurrencyCode(),
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
 * Returns Meta details for the Powerboard Checkout Button ZipMoney.
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
            currency: lineItemCtnr.getCurrencyCode(),
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
    var powerboardOrderNumber = getReservedPowerboardOrderNumber(currentBasket);

    var order = null;

    try {
        order = Transaction.wrap(function () {
            var newOrder;

            if (powerboardOrderNumber) {
                newOrder = OrderMgr.createOrder(currentBasket, powerboardOrderNumber);
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
 * Attempts to refund Powerboard Charge.
 * 
 * @param {String} chargeId - Charge ID
 * @param {Number} amount - amount to be refunded
 * @param {dw.order.Order} order - Order optional
 * @returns {Object|null} Operation result in case of success, null otherwise
 */
function refundPowerboardCharge(chargeId, amount, order) {
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger').getLogger('POWERBOARD', 'api.chargeRefund');
    var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');

    // early returns
    if (!chargeId) return null;

    var refundResult = null;
    var err = null;

    try {
        if (amount) {
            refundResult = powerboardService.charges.refund(chargeId, {
                amount: amount
            });
        }
        else {
            refundResult = powerboardService.charges.refund(chargeId);
        }
    } catch (e) {
        var errorMessage = 'Failed to refund charge ' + chargeId + '.' + '\n' + e.message;
        Logger.error(errorMessage);

        if (order) {
            Transaction.wrap(function () {
                order.addNote('Operation Notification', 'Refund failed. ' + '\n' + e.message);
            });
        }

        err = e;
    }

    if (err) {
        throw new Error(err.message);
    }
    else {
        if (order) {
            Transaction.wrap(function () {
                order.addNote('Operation Notification', 
                    amount ?
                    'Refund for ' + amount + ' ' + order.currencyCode + ' requested. Charge ' + chargeId :
                    'Refund requested. Charge ' + chargeId
                );
            });
        }
    }

    return refundResult;
}

/**
 * Attempts to refund Powerboard Charges for the Order.
 * 
 * @param {dw.order.Order} order - Order
 * @param {Number} amount - amount to be refunded
 * @returns {Number} Number of Refunded Charges
 */
function refundPowerboardCharges(order, amount) {
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger').getLogger('POWERBOARD', 'api.chargeRefund');
    var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');

    var refundedResult = 0;
    var powerboardPaymentInstruments = getPowerboardPaymentInstruments(order);

    if (powerboardPaymentInstruments) {
        for (var i = 0; i < powerboardPaymentInstruments.length; i++) {
            // shortcuts
            var paymentInstrument = powerboardPaymentInstruments[i];
            var chargeId = paymentInstrument.paymentTransaction.transactionID;

            if (chargeId) {
                var refundResult = null;
                var err = null;

                try {
                    refundResult = powerboardService.charges.refund(chargeId, {
                        amount: (amount ? amount : paymentInstrument.paymentTransaction.amount.value)
                    });
                } catch (e) {
                    var errorMessage = 'Failed to refund charge ' + chargeId + '.' + '\n' + e.message;
                    Logger.error(errorMessage);

                    Transaction.wrap(function () {
                        order.addNote('Operation Notification', 'Refund failed. ' + '\n' + e.message);
                    });

                    err = e;
                }

                if (err) {
                    throw new Error(err.message);
                }

                if (refundResult && !refundResult.error) {
                    Transaction.wrap(function () {
                        order.addNote('Operation Notification', 'Refund requested. Charge ' + chargeId);

                        if (i === powerboardPaymentInstruments.length - 1) {
                            order.custom.powerboardRefunded = true;
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
 * Attempts to capture Powerboard Charge.
 * 
 * @param {String} chargeId - Charge ID
 * @param {Number} amount - amount to be captured
 * @param {dw.order.Order} order - Order optional
 * @returns {Object|null} Operation result in case of success, null otherwise
 */
function capturePowerboardCharge(chargeId, amount, order) {
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger').getLogger('POWERBOARD', 'api.chargeCapture');
    var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');

    // early returns
    if (!chargeId) return null;

    var captureResult = null;
    var err = null;

    try {
        if (amount) {
            captureResult = powerboardService.charges.capture(chargeId, {
                amount: amount
            });
        }
        else {
            captureResult = powerboardService.charges.capture(chargeId);
        }
    } catch (e) {
        var errorMessage = 'Failed to capture charge ' + chargeId + '.' + '\n' + e.message;
        Logger.error(errorMessage);

        if (order) {
            Transaction.wrap(function () {
                order.addNote('Operation Notification', 'Capture failed. ' + '\n' + e.message);
            });
        }

        err = e;
    }

    if (err) {
        throw new Error(err.message);
    }
    else {
        if (order) {
            Transaction.wrap(function () {
                order.addNote('Operation Notification',
                    amount ?
                        'Capture for ' + amount + ' ' + order.currencyCode + ' requested. Charge ' + chargeId :
                        'Capture requested. Charge ' + chargeId
                );

            });
        }
    }

    return captureResult;
}

/**
 * Attempts to capture Powerboard Charges for the Order.
 * 
 * @param {dw.order.Order} order - Order
 * @param {Number} amount - amount to be captured
 * @returns {Number} Number of Captured Charges
 */
function capturePowerboardCharges(order, amount) {
    var Order = require('dw/order/Order');
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger').getLogger('POWERBOARD', 'api.chargeCapture');
    var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');

    var capturedResult = 0;
    var powerboardPaymentInstruments = getPowerboardPaymentInstruments(order);

    if (powerboardPaymentInstruments) {
        for (var i = 0; i < powerboardPaymentInstruments.length; i++) {
            // shortcuts
            var paymentInstrument = powerboardPaymentInstruments[i];
            var chargeId = paymentInstrument.paymentTransaction.transactionID;

            if (chargeId) {
                var captureResult = null;
                var err = null;

                try {
                    if (amount) {
                        captureResult = powerboardService.charges.capture(chargeId, {
                            amount: amount
                        });
                    }
                    else {
                        captureResult = powerboardService.charges.capture(chargeId);
                    }
                } catch (e) {
                    var errorMessage = 'Failed to capture charge ' + chargeId + ' at Powerboard.' + '\n' + e.message;
                    Logger.error(errorMessage);

                    Transaction.wrap(function () {
                        order.addNote('Operation Notification', 'Capture failed. ' + '\n' + e.message);
                    });

                    err = e;
                }

                if (err) {
                    throw new Error(err.message);
                }

                if (captureResult && !captureResult.error) {
                    Transaction.wrap(function () {
                        Transaction.wrap(function () {
                            order.addNote('Operation Notification', 'Capture requested. Charge ' + chargeId);
                        });

                        paymentInstrument.custom.powerboardChargeStatus = captureResult.resource.data.status;

                        if (i === powerboardPaymentInstruments.length - 1) {
                            if (order.paymentStatus.value !== Order.PAYMENT_STATUS_PAID) order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                            order.custom.powerboardCaptured === true;
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
 * Adds the details to Powerboard Charge payload object.
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
        if (billingAddress.city) paymentSource.address_city = billingAddress.city;
        if (billingAddress.stateCode) paymentSource.address_state = billingAddress.stateCode;
        if (billingAddress.postalCode) paymentSource.address_postcode = billingAddress.postalCode;
        if (billingAddress.countryCode && billingAddress.countryCode.value) paymentSource.address_country = billingAddress.countryCode.value;
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

    // add contact details
    if (shippingAddress.firstName || shippingAddress.lastName || shippingAddress.phone) {
        shipping.contact = {};
        if (shippingAddress.firstName) shipping.contact.first_name = shippingAddress.firstName;
        if (shippingAddress.lastName) shipping.contact.last_name = shippingAddress.lastName;
        if (shippingAddress.phone) shipping.contact.phone = shippingAddress.phone;
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
 * Attempts to initialize Powerboard Charge with Wallet for the current Basket for the provided Gateway.
 * 
 * @param {dw.order.Basket} currentBasket - Current Basket
 * @param {String} gatewayId - Gateway ID
 * @param {String} chargeCapture - Charge Capture
 * @param {Boolean} fraudEnabled - Fraud Enabled
 * @param {String} fraudServiceID - Fraud Service ID
 * @returns {Object|null} Token, Charge ID and other data pairs, or null
 */
function initializePowerboardChargeWallet(currentBasket, gatewayId, chargeCapture, fraudEnabled, fraudServiceID) {
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var Logger = require('dw/system/Logger').getLogger('POWERBOARD', 'api.chargeWallet');
    var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');

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
            service_id: fraudServiceID
        };
    }

    try {
        chargeResult = powerboardService.charges.wallet(chargeWalletPayload, chargeCapture);
    } catch (e) {
        var t = e;
        var errorMessage = 'Failed to initialize charge for wallet payments at Powerboard. Gateway ID is ' + gatewayId + '.\n' + e.message;
        Logger.error(errorMessage);

        throw new Error(e.message);
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
 * Attempts to cancel Powerboard Charge
 * 
 * @param {String} chargeId - Charge ID
 * @param {dw.order.Order} order - Order optional
 * @returns {Object|null} Operation result in case of success, null otherwise
 */
function cancelCharge(chargeId, order) {
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger').getLogger('POWERBOARD', 'api.chargeCancel');
    var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');

    // early returns
    if (!chargeId) return null;

    var cancelResult = null;
    var err = null;

    try {
        cancelResult = powerboardService.charges.cancel(chargeId);
    } catch (e) {
        var errorMessage = 'Failed to cancel charge ' + chargeId + '.' + '\n' + e.message;
        Logger.error(errorMessage);

        if (order) {
            Transaction.wrap(function () {
                order.addNote('Operation Notification', 'Cancel failed.' + '\n' + e.message);
            });
        }

        err = e;
    }

    if (err) {
        throw new Error(err.message);
    }
    else {
        if (order) {
            Transaction.wrap(function () {
                order.addNote('Operation Notification', 'Cancel requested. Charge ' + chargeId);
            });
        }
    }

    return cancelResult;
}

/**
 * Attempts to archive a Powerboard Charge
 * 
 * @param {String} chargeId - Charge ID
 * @returns {Boolean} Success or not
 */
function archiveCharge(chargeId) {
    var Logger = require('dw/system/Logger').getLogger('POWERBOARD', 'api.archiveCancel');
    var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');

    // early returns
    if (!chargeId) return false;

    var archiveResult = null;
    var err = null;

    try {
        archiveResult = powerboardService.charges.archive(chargeId);
    } catch (e) {
        var errorMessage = 'Failed to archive charge ' + chargeId + '.' + '\n' + e.message;
        Logger.error(errorMessage);

        if (order) {
            Transaction.wrap(function () {
                order.addNote('Operation Notification', 'Archive failed.' + '\n' + e.message);
            });
        }

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

/**
 * Attempts to process a Powerboard Notification
 * 
 * @param {Object} notification - notification
 * @returns {void}
 */
function processNotification(notification) {
    var OrderMgr = require('dw/order/OrderMgr');

    var order;

    // early returns
    if (!notification) return;

    // shortcuts
    var event = notification.event;
    var data = notification.data;

    // early returns
    if (!event || !data) throw new Error('Corrupted Notification object');

    var chargeId = data._id;
    
    // get Order
    if (event === 'standalone_fraud_check_in_review_approved') {
      order = OrderMgr.queryOrder('custom.powerboardFraudID = {0}', chargeId);
    } else {
      order = OrderMgr.queryOrder('custom.powerboardChargeID = {0}', chargeId);
    }

    // no Order
    if (!order) return;

    // get Powerboard Payment Instrument
    var powerboardPI = getPowerboardPaymentInstrument(order);

    // no Powerboard Payment Instrument
    if (!powerboardPI) return;

    switch (event) {
        case 'transaction_success':
        case 'transaction_failure':
        case 'refund_success':
        case 'refund_failure':
            updatePowerboardPaymentInstrumentWithNotificaionDetails(powerboardPI, notification);
            updateOrderWithNotificationDetails(order, powerboardPI, notification);
            break;
        case 'refund_requested':
            updateOrderWithNotificationDetails(order, powerboardPI, notification);
            break;
        case 'standalone_fraud_check_in_review_async_approved':
        case 'standalone_fraud_check_in_review_approved':
            processStandAloneApproveNotification(order, powerboardPI, notification);
            break;
        case 'standalone_fraud_check_in_review':
        case 'standalone_fraud_check_success':
        case 'standalone_fraud_check_failed':
        case 'standalone_fraud_check_in_review_declined':
        case 'fraud_check_in_review':
        case 'fraud_check_in_review_async_approved':
        case 'fraud_check_in_review_async_declined':
        case 'fraud_check_transaction_in_review_async_approved':
        case 'fraud_check_transaction_in_review_async_declined':
        case 'fraud_check_success':
        case 'fraud_check_failed':
        case 'fraud_check_transaction_in_review_approved':
        case 'fraud_check_transaction_in_review_declined':
            updateOrderWithNotificationDetails(order, powerboardPI, notification);
            break;
    }
}

module.exports = {
    isCreditCardPaymentMethodEnabled: isCreditCardPaymentMethodEnabled,
    isPowerboardPaymentMethodEnabled: isPowerboardPaymentMethodEnabled,
    isPowerboardWalletButtonsPaymentMethod: isPowerboardWalletButtonsPaymentMethod,
    isPowerboardWalletButtonsPaymentMethodEnabled: isPowerboardWalletButtonsPaymentMethodEnabled,
    isPowerboardWalletButtonsPaymentMethodsEnabled: isPowerboardWalletButtonsPaymentMethodsEnabled,
    isPowerboardPaymentMethodsEnabled: isPowerboardPaymentMethodsEnabled,
    getPowerboardWalletButtonPaymentMethodConfig: getPowerboardWalletButtonPaymentMethodConfig,
    isPowerboardPaymentInstrument: isPowerboardPaymentInstrument,
    getPowerboardPaymentInstrument: getPowerboardPaymentInstrument,
    getPowerboardPaymentInstrumentModel: getPowerboardPaymentInstrumentModel,
    removePowerboardPaymentInstruments: removePowerboardPaymentInstruments,
    createPowerboardPaymentInstrument: createPowerboardPaymentInstrument,
    isPowerboardPaymentInstrumentEligibleForCapture: isPowerboardPaymentInstrumentEligibleForCapture,
    getPowerboardPaymentInstrumentCaptureAmount: getPowerboardPaymentInstrumentCaptureAmount,
    isPowerboardPaymentInstrumentEligibleForRefund: isPowerboardPaymentInstrumentEligibleForRefund,
    getPowerboardPaymentInstrumentRefundAmount: getPowerboardPaymentInstrumentRefundAmount,
    isPowerboardPaymentInstrumentEligibleForCancel: isPowerboardPaymentInstrumentEligibleForCancel,
    isPowerboardPaymentInstrumentUnderProcessing: isPowerboardPaymentInstrumentUnderProcessing,
    updatePowerboardPaymentInstrumentWithChargeDetails: updatePowerboardPaymentInstrumentWithChargeDetails,
    updatePowerboardPaymentInstrumentWithNotificaionDetails: updatePowerboardPaymentInstrumentWithNotificaionDetails,
    getNewPowerboardOrderNumber: getNewPowerboardOrderNumber,
    getReservedPowerboardOrderNumber: getReservedPowerboardOrderNumber,
    getNonGiftCertificateAmount: getNonGiftCertificateAmount,
    getCheckoutButtonAfterpayMeta: getCheckoutButtonAfterpayMeta,
    getCheckoutButtonZipMoneyMeta: getCheckoutButtonZipMoneyMeta,
    createOrder: createOrder,
    refundPowerboardCharge: refundPowerboardCharge,
    refundPowerboardCharges: refundPowerboardCharges,
    capturePowerboardCharge: capturePowerboardCharge,
    capturePowerboardCharges: capturePowerboardCharges,
    initializePowerboardChargeWallet: initializePowerboardChargeWallet,
    cancelCharge: cancelCharge,
    archiveCharge: archiveCharge,
    addChargePayloadDetails: addChargePayloadDetails,
    processNotification: processNotification
}
