'use strict';

/**
 * @namespace PowerBoard
 */

var server = require('server');

/**
 * PowerBoard Notification processing endpoint
 */
/**
 * PowerBoard-Notification : This endpoint is called when PowerBoard sends a Notification
 * @name Base/PowerBoard-Notification
 * @function
 * @memberof PowerBoard
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post('Notification', function (req, res, next) {
    var Logger = require('dw/system/Logger').getLogger('POWERBOARD', 'notification');
    var powerboardCheckoutHelper = require('*/cartridge/scripts/powerboard/helpers/checkoutHelper');

    var error = false;
    var notification = null;

    try {
        notification = JSON.parse(request.httpParameterMap.requestBodyAsString);
    }
    catch (e) {
        Logger.error('Notification object parse failure.' + '\n' + e.message);

        error = true;
        notification = null;
    }

    if (!error) {
        try {
            powerboardCheckoutHelper.processNotification(notification);
        }
        catch (e) {
            Logger.error('Notification processing failure.' + '\n' + e.message);
    
            error = true;
        }
    }

    if (error) {
        res.setStatusCode(500);

        res.json({
            'error': true
        });
    }
    else {
        // log the notification
        Logger.info(request.httpParameterMap.requestBodyAsString);

        res.json({
            'success': true
        });
    }

    next();
});

module.exports = server.exports();
