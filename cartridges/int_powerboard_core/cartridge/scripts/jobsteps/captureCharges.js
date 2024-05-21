'use strict';

/**
 *
 * Capture PowerBoard Charges associated with the Orders
 *
 */

var Logger = require('dw/system/Logger').getLogger('POWERBOARD', 'job.captureCharges');
var Status = require('dw/system/Status');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var powerboardCheckoutHelper = require('*/cartridge/scripts/powerboard/helpers/checkoutHelper');
var millisInDay = 86400000;
var result = true;

function capture(args) {
    // parameters mapping
    var daysPastTrack = args.DaysPastTrack;
    var captureLimit = args.CaptureLimit;
    var failedCaptureLimit = args.FailedCaptureLimit;

    // parameters normalization
    daysPastTrack = Number(daysPastTrack);
    daysPastTrack = isNaN(daysPastTrack) || daysPastTrack <= 0 || daysPastTrack > 365 ?
        1 :
        daysPastTrack;
    captureLimit = Number(captureLimit);
    captureLimit = isNaN(captureLimit) || captureLimit <= 0 ?
        1000 :
        captureLimit;
    failedCaptureLimit = Number(failedCaptureLimit);
    failedCaptureLimit = isNaN(failedCaptureLimit) || failedCaptureLimit <= 0 ?
        5 :
        failedCaptureLimit;

    // early returns
    if (empty(daysPastTrack) || empty(captureLimit) || empty(failedCaptureLimit)) {
        Logger.error(Resource.msg('powerboard.job.error.parameters.missed', 'powerboard', null));

        return new Status(Status.ERROR);
    }

    // process Orders newer than x-days
    var today = Date.now();
    var dateInPast = new Date(today - daysPastTrack * millisInDay);
    var dateInPastStr = dateInPast.toISOString();

    // defaults
    var result = true;
    var capturedCounter = 0;
    var failedCallsCounter = 0;
    var processedOrders = 0;

    // capture Order Payments at PowerBoard via Charges Capture
    function capturePowerboardOrderCharges(order) {
        // early returns
        if (!result) return;
        if (capturedCounter >= captureLimit) return;

        try {
            capturedCounter += powerboardCheckoutHelper.capturePowerboardCharges(order);   
        }
        catch (e) {
            failedCallsCounter++;
        }

        // reached out the failed captures limit
        if (failedCallsCounter >= failedCaptureLimit) {
            Logger.error(Resource.msg('powerboard.job.charges.capture.failed.quota.reached', 'powerboard', null));

            result = false;
        }

        if (capturedCounter >= captureLimit) {
            Logger.warn(Resource.msg('powerboard.job.charges.capture.success.quota.reached', 'powerboard', null));
        }

        processedOrders++;
    }

    // search and process
    OrderMgr.processOrders(
        capturePowerboardOrderCharges,
        'status != {0} AND status != {1} AND paymentStatus != {2} AND confirmationStatus = {3} AND creationDate >= {4} AND custom.powerboardCaptured != True AND custom.powerboardRefunded != True',
        Order.ORDER_STATUS_CANCELLED,
        Order.ORDER_STATUS_FAILED,
        Order.PAYMENT_STATUS_PAID,
        Order.CONFIRMATION_STATUS_CONFIRMED,
        dateInPastStr
    );

    // return result
    if (!result) {
        return new Status(Status.ERROR);
    }

    Logger.info(Resource.msgf('powerboard.job.processed.orders', 'powerboard', null, processedOrders));
    Logger.info(Resource.msgf('powerboard.job.charges.capture.succeded', 'powerboard', null, capturedCounter));
    Logger.info(Resource.msgf('powerboard.job.charges.capture.failed', 'powerboard', null, failedCallsCounter));

    return new Status(Status.OK);
}

exports.capture = capture;
