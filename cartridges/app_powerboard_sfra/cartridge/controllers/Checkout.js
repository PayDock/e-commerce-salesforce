'use strict';

var preferences = require('*/cartridge/config/preferences');

var server = require('server');

server.extend(module.superModule);

server.append(
    'Begin',
    server.middleware.https,
    function (req, res, next) {
        var powerboardCheckoutHelper = require('*/cartridge/scripts/powerboard/helpers/checkoutHelper');

        var viewData = res.getViewData();

        var selectedPowerboardPaymentInstrument = viewData.order && viewData.order.billing && viewData.order.billing.payment ?
          powerboardCheckoutHelper.getPowerboardPaymentInstrumentModel(viewData.order.billing.payment.selectedPaymentInstruments) :
          null;
        var gatewayID = 'not_configured';

        if (preferences.powerboard.powerboard3DSFlow.value === 'ott'
        ) {
          gatewayID = preferences.powerboard.powerboardGatewayID;
        }

        var schemas = preferences.powerboard.powerboardCardScheme;
        var tempArr = [];

        schemas.forEach(function (el) {
          tempArr.push(el.toLowerCase());
        })

        var saveCard = preferences.powerboard.powerboardEnableSaveCard && preferences.powerboard.powerboard3DSFlow.value === 'vault';

        res.setViewData({
          powerboardPublicAPIKey: preferences.powerboard.powerboardPublicAPIKey,
          powerboardGatewayID: gatewayID,
          powerboardWidgetStyles: preferences.powerboard.powerboardWidgetStyles,
          powerboardEnableSaveCard: saveCard,
          selectedPowerboardPaymentInstrument: selectedPowerboardPaymentInstrument,
          powerboard3DSType: preferences.powerboard.powerboard3DSType.value,
          powerboard3DSFlow: preferences.powerboard.powerboard3DSFlow.value,
          powerboardCardScheme: tempArr.join(','),
          powerboardEnvironment: preferences.powerboard.powerboardEnvironment
        });

        return next();
    }
);

module.exports = server.exports();
