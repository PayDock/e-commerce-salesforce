'use strict';

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

    var paydockPaymentMethod = PaymentMgr.getPaymentMethod('Paydock');

    return paydockPaymentMethod && paydockPaymentMethod.active;
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
    }

    // shortcut
    var paymentTransaction = paymentInstrument.paymentTransaction;

    // Order may get created before the Charge creation at Paydock side
    if (!paymentTransaction.getPaymentProcessor() && paymentMethodId === 'Paydock') {
        var processor = PaymentMgr.getPaymentMethod('Paydock').getPaymentProcessor();

        if (processor) {
            paymentTransaction.setPaymentProcessor(processor);
        }
    }

    paymentTransaction.setType(params.paydockChargeCapture ? dw.order.PaymentTransaction.TYPE_CAPTURE : dw.order.PaymentTransaction.TYPE_AUTH);
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
 * Attempts to refund Paydock Charges for the Order.
 * 
 * @param {dw.order.Order} order - Order
 * @returns {Number} Number of Refunded Charges
 */
function refundPaydockCharges(order) {
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
                        amount: paymentInstrument.paymentTransaction.amount.value
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
 * Attempts to capture Paydock Charges for the Order.
 * 
 * @param {dw.order.Order} order - Order
 * @returns {Number} Number of Captured Charges
 */
function capturePaydockCharges(order) {
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
                    captureResult = paydockService.charges.capture(chargeId);
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
                            order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                        }
                    });

                    capturedResult++;
                }
            }
        }
    }

    return capturedResult;
}

module.exports = {
    isCreditCardPaymentMethodEnabled: isCreditCardPaymentMethodEnabled,
    isPaydockPaymentMethodEnabled: isPaydockPaymentMethodEnabled,
    isPaydockPaymentInstrument: isPaydockPaymentInstrument,
    getPaydockPaymentInstrument: getPaydockPaymentInstrument,
    removePaydockPaymentInstruments: removePaydockPaymentInstruments,
    createPaydockPaymentInstrument: createPaydockPaymentInstrument,
    getNewPaydockOrderNumber: getNewPaydockOrderNumber,
    getReservedPaydockOrderNumber: getReservedPaydockOrderNumber,
    getNonGiftCertificateAmount: getNonGiftCertificateAmount,
    createOrder: createOrder,
    refundPaydockCharges: refundPaydockCharges,
    capturePaydockCharges: capturePaydockCharges
}
