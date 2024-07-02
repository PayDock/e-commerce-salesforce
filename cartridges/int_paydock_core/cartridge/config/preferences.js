'use strict';

var Site = require('dw/system/Site');

var base = module.superModule || {};

var currentSite = Site.getCurrent();

// defaults
var paydockWidgetStyles = null;

try {
  if (currentSite.getCustomPreferenceValue('paydockWidgetStyles')) {
    paydockWidgetStyles = JSON.parse(currentSite.getCustomPreferenceValue('paydockWidgetStyles'));
  }
}
catch (e) {
  paydockWidgetStyles = null;
}

var widgetAccess = currentSite.getCustomPreferenceValue('paydockConnectionType').value === 'paydockKey' ?
  currentSite.getCustomPreferenceValue('paydockPublicAPIKey') :
  currentSite.getCustomPreferenceValue('paydockWidgetToken');

var APIAccess = currentSite.getCustomPreferenceValue('paydockConnectionType').value === 'paydockKey' ?
  currentSite.getCustomPreferenceValue('paydockPrivateAPIKey') :
  currentSite.getCustomPreferenceValue('paydockAPIToken');

base.paydock = {
    version: "1.0",
    paydockRawErrorMessaging: currentSite.getCustomPreferenceValue('paydockRawErrorMessaging'),
    paydockPublicAPIKey: widgetAccess,
    paydockGatewayID: currentSite.getCustomPreferenceValue('paydockGatewayID'),
    paydockPrivateAPIKey: APIAccess,
    paydockChargeCapture: currentSite.getCustomPreferenceValue('paydockChargeCapture'),
    paydockWidgetStyles: paydockWidgetStyles,
    paydockSaveCardMethod: currentSite.getCustomPreferenceValue('paydockSaveCardMethod'),
    paydockEnableSaveCard: currentSite.getCustomPreferenceValue('paydockEnableSaveCard'),
    paydockEnvironment: currentSite.getCustomPreferenceValue('paydockEnvironment').value,
    paydockWalletButtonsApplePayChargeCapture: currentSite.getCustomPreferenceValue('paydockWalletButtonsApplePayChargeCapture'),
    paydockWalletButtonsApplePayGatewayID: currentSite.getCustomPreferenceValue('paydockWalletButtonsApplePayGatewayID'),
    paydockWalletButtonsApplePayFraudEnabled: currentSite.getCustomPreferenceValue('paydockWalletButtonsApplePayFraud'),
    paydockWalletButtonsApplePayFraudServiceID: currentSite.getCustomPreferenceValue('paydockWalletButtonsApplePayFraudServiceID'),
    paydockWalletButtonsApplePayMerchantIdDomainAssociation: currentSite.getCustomPreferenceValue('paydockWalletButtonsApplePayMerchantIdDomainAssociation'),
    paydockWalletButtonsGooglePayChargeCapture: currentSite.getCustomPreferenceValue('paydockWalletButtonsGooglePayChargeCapture'),
    paydockWalletButtonsGooglePayGatewayID: currentSite.getCustomPreferenceValue('paydockWalletButtonsGooglePayGatewayID'),
    paydockWalletButtonsGooglePayFraudEnabled: currentSite.getCustomPreferenceValue('paydockWalletButtonsGooglePayFraud'),
    paydockWalletButtonsGooglePayFraudServiceID: currentSite.getCustomPreferenceValue('paydockWalletButtonsGooglePayFraudServiceID'),
    paydockWalletButtonsPayPalChargeCapture: currentSite.getCustomPreferenceValue('paydockWalletButtonsPayPalChargeCapture'),
    paydockWalletButtonsPayPalGatewayID: currentSite.getCustomPreferenceValue('paydockWalletButtonsPayPalGatewayID'),
    paydockWalletButtonsPayPalFraudEnabled: currentSite.getCustomPreferenceValue('paydockWalletButtonsPayPalFraud'),
    paydockWalletButtonsPayPalFraudServiceID: currentSite.getCustomPreferenceValue('paydockWalletButtonsPayPalFraudServiceID'),
    paydockWalletButtonsPayPalPayLater: currentSite.getCustomPreferenceValue('paydockWalletButtonsPayPalPayLater'),
    paydockWalletButtonsAfterpayChargeCapture: currentSite.getCustomPreferenceValue('paydockWalletButtonsAfterpayChargeCapture'),
    paydockWalletButtonsAfterpayGatewayID: currentSite.getCustomPreferenceValue('paydockWalletButtonsAfterpayGatewayID'),
    paydockWalletButtonsAfterpayFraudEnabled: currentSite.getCustomPreferenceValue('paydockWalletButtonsAfterpayFraud'),
    paydockWalletButtonsAfterpayFraudServiceID: currentSite.getCustomPreferenceValue('paydockWalletButtonsAfterpayFraudServiceID'),
    paydockFraudType: currentSite.getCustomPreferenceValue('paydockFraudType'),
    paydockFraudServiceID: currentSite.getCustomPreferenceValue('paydockFraudServiceID'),
    paydockBMChargeOperationsAll: currentSite.getCustomPreferenceValue('paydockBMChargeOperationsAll'),
    paydockCheckoutButtonAfterpayGatewayID: currentSite.getCustomPreferenceValue('paydockCheckoutButtonAfterpayGatewayID'),
    paydockCheckoutButtonAfterpayChargeCapture: false,
    paydockCheckoutButtonAfterpayFraudEnabled: currentSite.getCustomPreferenceValue('paydockCheckoutButtonAfterpayFraud'),
    paydockCheckoutButtonAfterpayFraudServiceID: currentSite.getCustomPreferenceValue('paydockCheckoutButtonAfterpayFraudServiceID'),
    paydockCheckoutButtonZipMoneyGatewayID: currentSite.getCustomPreferenceValue('paydockCheckoutButtonZipMoneyGatewayID'),
    paydockCheckoutButtonZipMoneyChargeCapture: currentSite.getCustomPreferenceValue('paydockCheckoutButtonZipMoneyChargeCapture'),
    paydockCheckoutButtonZipMoneyFraudEnabled: currentSite.getCustomPreferenceValue('paydockCheckoutButtonZipMoneyFraud'),
    paydockCheckoutButtonZipMoneyFraudServiceID: currentSite.getCustomPreferenceValue('paydockCheckoutButtonZipMoneyFraudServiceID'),
    paydock3DSType: currentSite.getCustomPreferenceValue('paydock3DSType'),
	  paydock3DSFlow: currentSite.getCustomPreferenceValue('paydock3DSFlow'),
	  paydock3DSServiceID: currentSite.getCustomPreferenceValue('paydock3DSServiceID'),
    paydockConnectionType: currentSite.getCustomPreferenceValue('paydockConnectionType'),
    paydockCardScheme: currentSite.getCustomPreferenceValue('paydockCardScheme')
};

module.exports = base;
