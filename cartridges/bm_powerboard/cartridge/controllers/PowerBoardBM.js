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
    var captureAmount = req.form.captureAmount;
    var refundAmount = req.form.refundAmount;

    // data check
    if ((operation === 'capture' && !captureAmount) || (operation === 'refund' && !refundAmount)) {
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
            operationResult = powerboardCheckoutHelper.capturePowerboardCharge(powerboardPI.custom.powerboardChargeID, captureAmount, order);
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

server.get('Notifications', function (req, res, next) {
    res.render('powerboard/notifications');

    return next();
});

server.post('HandleNotifications', function (req, res, next) {
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');

    // shortcuts
    var operation = req.form.operation;
    var currentSite = Site.getCurrent();
    var siteId = currentSite.getID();

    // constants
    var type = 'webhook';

    // data check
    if (['search', 'create', 'delete'].indexOf(operation) === -1) {
        res.json({
            error: true,
            message: (
                operation ?
                    Resource.msg('powerboard.notifications.operation.invalid', 'powerboardbm', null) :
                    Resource.msg('powerboard.notifications.operation.missed', 'powerboardbm', null)
                )
        });

        return next();
    }

    // defaults
    var operationResult;
    var existingNotifications = [];
    var errorMessage;
    var error = false;

    // get all existing notifications parameters
    var skip = 0;
    var limit = 1000;
    var sortKey = 'created_at'
    var sortDirection = 'DESC';

    if (operation === 'create') { // perform create operation
        if (type === 'webhook') {
            try {
                operationResult = powerboardService.notifications.search(type, skip, limit, sortKey, sortDirection);
                existingNotifications = operationResult.resource.data;
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

                return next();
            }

            // events to be created
            var events = [
                'transaction_success',
                'refund_failure',
                'refund_success',
                'refund_requested',
                'transaction_failure',
                'standalone_fraud_check_in_review_approved',
                'fraud_check_transaction_in_review_approved',
                'fraud_check_in_review',
                'fraud_check_failed',
                'fraud_check_success',
                'fraud_check_in_review_async_declined',
                'standalone_fraud_check_in_review',
                'standalone_fraud_check_in_review_declined',
                'fraud_check_transaction_in_review_async_approved',
                'fraud_check_transaction_in_review_declined',
                'standalone_fraud_check_in_review_async_approved',
                'fraud_check_in_review_async_approved',
                'fraud_check_transaction_in_review_async_declined',
                'standalone_fraud_check_failed',
                'standalone_fraud_check_in_review_async_declined',
                'standalone_fraud_check_success'
            ];

            // identify destination
            var destination = URLUtils.abs('PowerBoard-Notification').toString();

            // substitute onto Storefront site
            destination = destination.replace('Sites-Site', 'Sites-' + siteId + '-Site');

            // identify which events are created, and which ones should be
            var existingEvents = {};
            var missedEvents = [];

            for (var i = 0; i < existingNotifications.length; i++) {
                var existingNotification = existingNotifications[i]; // shortcut

                if (existingNotification.destination === destination) {
                    existingEvents[ existingNotification.event ] = destination;
                }
            }

            existingEvents = Object.keys(existingEvents);

            for (var i = 0; i < events.length; i++) {
                var event = events[i]; // shortcut

                if (existingEvents.indexOf(event) === -1) {
                    missedEvents.push(event);
                }
            }

            try {
                for (var i = 0; i < missedEvents.length; i++) {
                    var event = missedEvents[i]; // shortcut
                    operationResult = powerboardService.notifications.create({
                        type: type,
                        destination: destination,
                        event: event,
                        transaction_only: false
                    });
                }
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
                // reporting
                var data = {
                    'createdNotificationsFor': missedEvents,
                    'existingAlreadyNotifications': existingEvents
                }
                res.json({
                    error: false,
                    message: Resource.msg('powerboard.notifications.create.succeded', 'powerboardbm', null),
                    data: data
                });
            }
        }
    }
    else if (operation === 'delete') { // perform delete operation
        if (type === 'webhook') {
            try {
                operationResult = powerboardService.notifications.search(type, skip, limit, sortKey, sortDirection);
                existingNotifications = operationResult.resource.data;
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

                return next();
            }

            // identify destination
            var bmDestination = URLUtils.abs('PowerBoarf-Notification').toString();

            // substitute onto Storefront site
            var siteDestination = bmDestination.replace('Sites-Site', 'Sites-' + siteId + '-Site');

            try {
                for (var i = 0; i < existingNotifications.length; i++) {
                    var existingNotification = existingNotifications[i]; // shortcut
                    if (
                        existingNotification.destination == siteDestination ||
                        existingNotification.destination == bmDestination
                    ) {
                        operationResult = powerboardService.notifications.delete(existingNotification._id);
                    }
                }
            }
            catch (e) {
                error = true;
                errorMessage = e.message;
            }

            if (error) {
                res.json({
                    error: false,
                    message: errorMessage
                });

                return next();
            }
            else {
                res.json({
                    error: false,
                    message: Resource.msg('powerboard.notifications.delete.succeded', 'powerboardbm', null)
                });
            }
        }
    }
    else if (operation === 'search') { // perform search operation
        if (type === 'webhook') {
            try {
                operationResult = powerboardService.notifications.search(type, skip, limit, sortKey, sortDirection);
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
                res.json({
                    error: false,
                    message: Resource.msg('powerboard.notifications.search.succeded', 'powerboardbm', null),
                    data: operationResult
                });
            }
        }
    }

    return next();
});

module.exports = server.exports();
