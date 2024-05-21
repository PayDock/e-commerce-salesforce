'use strict';

/**
 * @namespace Paydock
 */

var server = require('server');

/**
 * Paydock Notification processing endpoint
 */
/**
 * Paydock-Notification : This endpoint is called when Paydock sends a Notification
 * @name Base/Paydock-Notification
 * @function
 * @memberof Paydock
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post('Notification', function (req, res, next) {
    var Logger = require('dw/system/Logger').getLogger('PAYDOCK', 'notification');
    var paydockCheckoutHelper = require('*/cartridge/scripts/paydock/helpers/checkoutHelper');

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
            paydockCheckoutHelper.processNotification(notification);
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
