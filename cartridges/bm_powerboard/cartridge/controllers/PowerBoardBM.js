'use strict';

var server = require('server');

var Site = require('dw/system/Site');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

server.get('Charges', function (req, res, next) {
    res.render('powerboard/charges');

    return next();
});

server.post('HandleCharge', function (req, res, next) {
    var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');
    var powerboardCheckoutHelper = require('*/cartridge/scripts/powerboard/helpers/checkoutHelper');

    if (!req.form.orderToken || !req.form.orderID) {
        res.json({
            error: true,
            message: (
                !req.form.orderID ?
                    Resource.msg('powerboard.charge.operations.missed.order.number', 'powerboardbm', null) :
                    Resource.msg('powerboard.charge.operations.missed.order.token', 'powerboardbm', null)
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
            message: Resource.msgf('powerboard.charge.operations.order.not.found', 'powerboardbm', null, req.form.orderID)
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
            message: Resource.msg('powerboard.charge.operations.missed.amount', 'powerboardbm', null)
        });

        return next();
    }

    // get PowerBoard Payment Instrument
    var powerboardPI = powerboardCheckoutHelper.getPowerboardPaymentInstrument(order);

    // check PowerBoard Payment Instrument
    if (!powerboardPI) {
        res.json({
            error: true,
            message: Resource.msg('powerboard.charge.not.powerboard.payment.instrument.error', 'powerboardbm', null)
        });

        return next();
    }

    // check PowerBoard Charge ID
    if (!powerboardPI.custom.powerboardChargeID) {
        res.json({
            error: true,
            message: Resource.msg('powerboard.charge.missed.charge.id.error', 'powerboardbm', null)
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
            operationResult = powerboardCheckoutHelper.cancelCharge(powerboardPI.custom.powerboardChargeID, order);
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
                // update PowerBoard Payment Instrument with charge details
                powerboardCheckoutHelper.updatePowerboardPaymentInstrumentWithChargeDetails(powerboardPI, operationResult);

                // cancel the order
                Transaction.wrap(function() {
                    OrderMgr.cancelOrder(order);
                    order.setCancelCode('PowerBoard');
                    order.setCancelDescription('Cancelled due to Payment Cancellation');
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
                    message: Resource.msg('powerboard.charge.cancel.succeded', 'powerboardbm', null)
                });
            }
        }
    }
    else if (operation === 'capture') {
        try {
            operationResult = powerboardCheckoutHelper.capturePowerboardCharge(powerboardPI.custom.powerboardChargeID, null, order);
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
                // update PowerBoard Payment Instrument with charge details
                powerboardCheckoutHelper.updatePowerboardPaymentInstrumentWithChargeDetails(powerboardPI, operationResult);
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
                    message: Resource.msg('powerboard.charge.capture.succeded', 'powerboardbm', null)
                });
            }
        }
    }
    else if (operation === 'refund') {
        try {
            operationResult = powerboardCheckoutHelper.refundPowerboardCharge(powerboardPI.custom.powerboardChargeID, refundAmount, order);
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
                // update PowerBoard Payment Instrument with charge details
                powerboardCheckoutHelper.updatePowerboardPaymentInstrumentWithChargeDetails(powerboardPI, operationResult);
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
                    message: Resource.msg('powerboard.charge.refund.succeded', 'powerboardbm', null)
                });
            }
        }
    }

    // update PowerBoard Payment Instrument
    try {
        if (error && !updatePaymentInstrumentError) powerboardCheckoutHelper.updatePowerboardPaymentInstrumentWithChargeDetails(powerboardPI);
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
