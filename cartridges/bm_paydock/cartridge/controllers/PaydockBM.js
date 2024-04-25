'use strict';

var server = require('server');

var Site = require('dw/system/Site');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

server.get('Charges', function (req, res, next) {
    res.render('paydock/charges');

    return next();
});

server.post('HandleCharge', function (req, res, next) {
    var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');
    var paydockCheckoutHelper = require('*/cartridge/scripts/paydock/helpers/checkoutHelper');

    if (!req.form.orderToken || !req.form.orderID) {
        res.json({
            error: true,
            message: (
                !req.form.orderID ?
                    Resource.msg('paydock.charge.operations.missed.order.number', 'paydockbm', null) :
                    Resource.msg('paydock.charge.operations.missed.order.token', 'paydockbm', null)
            )
        });

        return next();
    }

    var order = req.form.orderToken === 'noToken' ?
        OrderMgr.getOrder(req.form.orderID) :
        OrderMgr.getOrder(req.form.orderID, req.form.orderToken);

    if (!order) {
        res.json({
            error: true,
            message: Resource.msgf('paydock.charge.operations.order.not.found', 'paydockbm', null, req.form.orderID)
        });

        return next();
    }

    // shortcuts
    var operation = req.form.operation;
    var refundAmount = req.form.refundAmount;

    // data check
    if (operation === 'refund' && !refundAmount) {
        res.json({
            error: true,
            message: Resource.msg('paydock.charge.operations.missed.amount', 'paydockbm', null)
        });

        return next();
    }

    // get Paydock Payment Instrument
    var paydockPI = paydockCheckoutHelper.getPaydockPaymentInstrument(order);

    // check Paydock Payment Instrument
    if (!paydockPI) {
        res.json({
            error: true,
            message: Resource.msg('paydock.charge.not.paydock.payment.instrument.error', 'paydockbm', null)
        });

        return next();
    }

    // check Paydock Charge ID
    if (!paydockPI.custom.paydockChargeID) {
        res.json({
            error: true,
            message: Resource.msg('paydock.charge.missed.charge.id.error', 'paydockbm', null)
        });

        return next();
    }

    // defaults
    var operationResult;
    var errorMessage;
    var error = false;
    var updatePaymentInstrumentError = false;

    // perform charge operation
    if (operation === 'cancel') {
        try {
            operationResult = paydockCheckoutHelper.cancelCharge(paydockPI.custom.paydockChargeID, order);
        }
        catch (e) {
            error = true;
            errorMessage = e.message;
        }

        if (error) {
            res.json({
                error: true,
                message: errorMessage
            });
        }
        else {
            try {
                // update Paydock Payment Instrument with charge details
                paydockCheckoutHelper.updatePaydockPaymentInstrumentWithChargeDetails(paydockPI, operationResult);

                // cancel the order
                Transaction.wrap(function() {
                    OrderMgr.cancelOrder(order);
                });
            }
            catch (e) {
                error = true;
                updatePaymentInstrumentError = true;
                errorMessage = e.message;
            }

            if (error) {
                res.json({
                    error: true,
                    message: errorMessage
                });
            }
            else {
                res.json({
                    error: false,
                    message: Resource.msg('paydock.charge.cancel.succeded', 'paydockbm', null)
                });
            }
        }
    }
    else if (operation === 'capture') {
        try {
            operationResult = paydockCheckoutHelper.capturePaydockCharge(paydockPI.custom.paydockChargeID, null, order);
        }
        catch (e) {
            error = true;
            errorMessage = e.message;
        }

        if (error) {
            res.json({
                error: true,
                message: errorMessage
            });
        }
        else {
            try {
                // update Paydock Payment Instrument with charge details
                paydockCheckoutHelper.updatePaydockPaymentInstrumentWithChargeDetails(paydockPI, operationResult);
            }
            catch (e) {
                error = true;
                updatePaymentInstrumentError = true;
                errorMessage = e.message;
            }

            if (error) {
                res.json({
                    error: true,
                    message: errorMessage
                });
            }
            else {
                res.json({
                    error: false,
                    message: Resource.msg('paydock.charge.capture.succeded', 'paydockbm', null)
                });
            }
        }
    }
    else if (operation === 'refund') {
        try {
            operationResult = paydockCheckoutHelper.refundPaydockCharge(paydockPI.custom.paydockChargeID, refundAmount, order);
        }
        catch (e) {
            error = true;
            errorMessage = e.message;
        }

        if (error) {
            res.json({
                error: true,
                message: errorMessage
            });
        }
        else {
            try {
                // update Paydock Payment Instrument with charge details
                paydockCheckoutHelper.updatePaydockPaymentInstrumentWithChargeDetails(paydockPI, operationResult);
            }
            catch (e) {
                error = true;
                updatePaymentInstrumentError = true;
                errorMessage = e.message;
            }

            if (error) {
                res.json({
                    error: true,
                    message: errorMessage
                });
            }
            else {
                res.json({
                    error: false,
                    message: Resource.msg('paydock.charge.refund.succeded', 'paydockbm', null)
                });
            }
        }
    }

    // update Paydock Payment Instrument
    try {
        if (error && !updatePaymentInstrumentError) paydockCheckoutHelper.updatePaydockPaymentInstrumentWithChargeDetails(paydockPI);
    }
    catch (e) {
        res.json({
            error: true,
            message: e.message
        });
    }

    return next();
});

module.exports = server.exports();
