'use strict';

/**
 *
 * Refund PowerBoard Charges associated with the Orders
 *
 */

var Logger = require('dw/system/Logger').getLogger('POWERBOARD', 'job.refundCharges');
var Status = require('dw/system/Status');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var powerboardCheckoutHelper = require('*/cartridge/scripts/powerboard/helpers/checkoutHelper');
var millisInDay = 86400000;
var result = true;

function refund(args) {
    // parameters mapping
    var daysPastTrack = args.DaysPastTrack;
    var refundLimit = args.RefundLimit;
    var failedRefundLimit = args.FailedRefundLimit;

    // parameters normalization
    daysPastTrack = Number(daysPastTrack);
    daysPastTrack = isNaN(daysPastTrack) || daysPastTrack <= 0 || daysPastTrack > 365 ?
        1 :
        daysPastTrack;
    refundLimit = Number(refundLimit);
    refundLimit = isNaN(refundLimit) || refundLimit <= 0 ?
        1000 :
        refundLimit;
    failedRefundLimit = Number(failedRefundLimit);
    failedRefundLimit = isNaN(failedRefundLimit) || failedRefundLimit <= 0 ?
        5 :
        failedRefundLimit;

    // early returns
    if (empty(daysPastTrack) || empty(refundLimit) || empty(failedRefundLimit)) {
        Logger.error(Resource.msg('powerboard.job.error.parameters.missed', 'powerboard', null));

        return new Status(Status.ERROR);
    }

    // process Orders newer than x-days
    var today = Date.now();
    var dateInPast = new Date(today - daysPastTrack * millisInDay);
    var dateInPastStr = dateInPast.toISOString();

    // defaults
    var result = true;
    var refundedCounter = 0;
    var failedCallsCounter = 0;
    var processedOrders = 0;

    // refund Order Payments at PowerBoard via Charges Refund
    function refundPowerboardOrderCharges(order) {
        // early returns
        if (!result) return;
        if (refundedCounter >= refundLimit) return;

        try {
            refundedCounter += powerboardCheckoutHelper.refundPowerboardCharges(order);   
        }
        catch (e) {
            failedCallsCounter++;
        }

        // reached out the failed refunds limit
        if (failedCallsCounter >= failedRefundLimit) {
            Logger.error(Resource.msg('powerboard.job.charges.refund.failed.quota.reached', 'powerboard', null));

            result = false;
        }

        if (refundedCounter >= refundLimit) {
            Logger.warn(Resource.msg('powerboard.job.charges.refund.success.quota.reached', 'powerboard', null));
        }

        processedOrders++;
    }

    // search and process
    OrderMgr.processOrders(
        refundPowerboardOrderCharges,
        '(status = {0} OR status = {1}) AND creationDate >= {2} AND custom.powerboardRefunded != True',
        Order.ORDER_STATUS_CANCELLED,
        Order.ORDER_STATUS_FAILED,
        dateInPastStr
    );

    // return result
    if (!result) {
        return new Status(Status.ERROR);
    }

    Logger.info(Resource.msgf('powerboard.job.processed.orders', 'powerboard', null, processedOrders));
    Logger.info(Resource.msgf('powerboard.job.charges.refund.succeded', 'powerboard', null, refundedCounter));
    Logger.info(Resource.msgf('powerboard.job.charges.refund.failed', 'powerboard', null, failedCallsCounter));

    return new Status(Status.OK);
}

exports.refund = refund;
