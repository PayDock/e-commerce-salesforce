'use strict';

var preferences = require('*/cartridge/config/preferences');

var server = require('server');

server.extend(module.superModule);

server.append(
    'Begin',
    server.middleware.https,
    function (req, res, next) {
        var paydockCheckoutHelper = require('*/cartridge/scripts/paydock/helpers/checkoutHelper');

        var viewData = res.getViewData();

        var selectedPaydockPaymentInstrument = viewData.order && viewData.order.billing && viewData.order.billing.payment ?
          paydockCheckoutHelper.getPaydockPaymentInstrumentModel(viewData.order.billing.payment.selectedPaymentInstruments) :
          null;
        var gatewayID = 'not_configured';

        if (preferences.paydock.paydock3DSFlow.value === 'ott') {
          gatewayID = preferences.paydock.paydockGatewayID;
        }

        var schemas = preferences.paydock.paydockCardScheme;
        var tempArr = [];

        schemas.forEach(function (el) {
          tempArr.push(el.toLowerCase());
        });

        var saveCard = preferences.paydock.paydockEnableSaveCard && preferences.paydock.paydock3DSFlow.value === 'vault';

        res.setViewData({
          paydockPublicAPIKey: preferences.paydock.paydockPublicAPIKey,
          paydockGatewayID: gatewayID,
          paydockWidgetStyles: preferences.paydock.paydockWidgetStyles,
          paydockEnableSaveCard: saveCard,
          selectedPaydockPaymentInstrument: selectedPaydockPaymentInstrument,
          paydock3DSType: preferences.paydock.paydock3DSType.value,
          paydock3DSFlow: preferences.paydock.paydock3DSFlow.value,
          paydockCardScheme: tempArr.join(','),
          paydockEnvironment: preferences.paydock.paydockEnvironment
        });

        return next();
    }
);

module.exports = server.exports();
