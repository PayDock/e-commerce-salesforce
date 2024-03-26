'use strict';

var preferences = require('*/cartridge/config/preferences');

var server = require('server');

server.extend(module.superModule);

server.append(
    'Begin',
    server.middleware.https,
    function (req, res, next) {
        var gatewayID =  preferences.paydock.paydockEnableVaultSession ? 'not_configured' : preferences.paydock.paydockGatewayID;
        res.setViewData({
          paydockPublicAPIKey: preferences.paydock.paydockPublicAPIKey,
          paydockGatewayID: gatewayID,
          paydockWidgetStyles: preferences.paydock.paydockWidgetStyles
        });

        return next();
    }
);

module.exports = server.exports();
