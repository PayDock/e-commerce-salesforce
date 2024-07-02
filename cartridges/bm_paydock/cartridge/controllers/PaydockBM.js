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
    var captureAmount = req.form.captureAmount;
    var refundAmount = req.form.refundAmount;

    // data check
    if ((operation === 'capture' && !captureAmount) || (operation === 'refund' && !refundAmount)) {
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
                    order.setCancelCode('Paydock');
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
                    message: Resource.msg('paydock.charge.cancel.succeded', 'paydockbm', null)
                });
            }
        }
    }
    else if (operation === 'capture') {
        try {
            operationResult = paydockCheckoutHelper.capturePaydockCharge(paydockPI.custom.paydockChargeID, captureAmount, order);
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

server.get('Notifications', function (req, res, next) {
    res.render('paydock/notifications');

    return next();
});

server.post('HandleNotifications', function (req, res, next) {
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');

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
                    Resource.msg('paydock.notifications.operation.invalid', 'paydockbm', null) :
                    Resource.msg('paydock.notifications.operation.missed', 'paydockbm', null)
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
                operationResult = paydockService.notifications.search(type, skip, limit, sortKey, sortDirection);
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
            var destination = URLUtils.abs('Paydock-Notification').toString();

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

                    operationResult = paydockService.notifications.create({
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
                    message: Resource.msg('paydock.notifications.create.succeded', 'paydockbm', null),
                    data: data
                });
            }
        }
    }
    else if (operation === 'delete') { // perform delete operation
        try {
            operationResult = paydockService.notifications.search(type, skip, limit, sortKey, sortDirection);
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
        var bmDestination = URLUtils.abs('Paydock-Notification').toString();

        // substitute onto Storefront site
        var siteDestination = bmDestination.replace('Sites-Site', 'Sites-' + siteId + '-Site');

        try {
            for (var i = 0; i < existingNotifications.length; i++) {
                var existingNotification = existingNotifications[i]; // shortcut

                if (
                    existingNotification.destination == siteDestination ||
                    existingNotification.destination == bmDestination
                ) {
                    operationResult = paydockService.notifications.delete(existingNotification._id);
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
                message: Resource.msg('paydock.notifications.delete.succeded', 'paydockbm', null)
            });
        }
    }
    else if (operation === 'search') { // perform search operation
        if (type === 'webhook') {
            try {
                operationResult = paydockService.notifications.search(type, skip, limit, sortKey, sortDirection);
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
                    message: Resource.msg('paydock.notifications.search.succeded', 'paydockbm', null),
                    data: operationResult
                });
            }
        }
    }

    return next();
});


module.exports = server.exports();
