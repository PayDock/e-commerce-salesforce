'use strict';

var Site = require('dw/system/Site');

var base = module.superModule || {};

var currentSite = Site.getCurrent();

// defaults
var powerboardWidgetStyles = null;

try {
  if (currentSite.getCustomPreferenceValue('powerboardWidgetStyles')) {
    powerboardWidgetStyles = JSON.parse(currentSite.getCustomPreferenceValue('powerboardWidgetStyles'));
  }
}
catch (e) {
  powerboardWidgetStyles = null;
}

var widgetAccess = currentSite.getCustomPreferenceValue('powerboardConnectionType').value === 'powerboardKey' ?
  currentSite.getCustomPreferenceValue('powerboardPublicAPIKey') :
  currentSite.getCustomPreferenceValue('powerboardWidgetToken');

var APIAccess = currentSite.getCustomPreferenceValue('powerboardConnectionType').value === 'powerboardKey' ?
  currentSite.getCustomPreferenceValue('powerboardPrivateAPIKey') :
  currentSite.getCustomPreferenceValue('powerboardAPIToken');

base.powerboard = {
    version: "1.0",
    powerboardRawErrorMessaging: currentSite.getCustomPreferenceValue('powerboardRawErrorMessaging'),
    powerboardPublicAPIKey: widgetAccess,
    powerboardGatewayID: currentSite.getCustomPreferenceValue('powerboardGatewayID'),
    powerboardPrivateAPIKey: APIAccess,
    powerboardChargeCapture: currentSite.getCustomPreferenceValue('powerboardChargeCapture'),
    powerboardWidgetStyles: powerboardWidgetStyles,
    powerboardSaveCardMethod: currentSite.getCustomPreferenceValue('powerboardSaveCardMethod'),
    powerboardEnableSaveCard: currentSite.getCustomPreferenceValue('powerboardEnableSaveCard'),
    powerboardWalletButtonsApplePayChargeCapture: currentSite.getCustomPreferenceValue('powerboardWalletButtonsApplePayChargeCapture'),
    powerboardWalletButtonsApplePayGatewayID: currentSite.getCustomPreferenceValue('powerboardWalletButtonsApplePayGatewayID'),
    powerboardWalletButtonsApplePayFraudEnabled: currentSite.getCustomPreferenceValue('powerboardWalletButtonsApplePayFraud'),
    powerboardWalletButtonsApplePayFraudServiceID: currentSite.getCustomPreferenceValue('powerboardWalletButtonsApplePayFraudServiceID'),
    powerboardWalletButtonsGooglePayChargeCapture: currentSite.getCustomPreferenceValue('powerboardWalletButtonsGooglePayChargeCapture'),
    powerboardWalletButtonsGooglePayGatewayID: currentSite.getCustomPreferenceValue('powerboardWalletButtonsGooglePayGatewayID'),
    powerboardWalletButtonsGooglePayFraudEnabled: currentSite.getCustomPreferenceValue('powerboardWalletButtonsGooglePayFraud'),
    powerboardWalletButtonsGooglePayFraudServiceID: currentSite.getCustomPreferenceValue('powerboardWalletButtonsGooglePayFraudServiceID'),
    powerboardWalletButtonsPayPalChargeCapture: currentSite.getCustomPreferenceValue('powerboardWalletButtonsPayPalChargeCapture'),
    powerboardWalletButtonsPayPalGatewayID: currentSite.getCustomPreferenceValue('powerboardWalletButtonsPayPalGatewayID'),
    powerboardWalletButtonsPayPalFraudEnabled: currentSite.getCustomPreferenceValue('powerboardWalletButtonsPayPalFraud'),
    powerboardWalletButtonsPayPalFraudServiceID: currentSite.getCustomPreferenceValue('powerboardWalletButtonsPayPalFraudServiceID'),
    powerboardWalletButtonsPayPalPayLater: currentSite.getCustomPreferenceValue('powerboardWalletButtonsPayPalPayLater'),
    powerboardWalletButtonsAfterpayChargeCapture: currentSite.getCustomPreferenceValue('powerboardWalletButtonsAfterpayChargeCapture'),
    powerboardWalletButtonsAfterpayGatewayID: currentSite.getCustomPreferenceValue('powerboardWalletButtonsAfterpayGatewayID'),
    powerboardWalletButtonsAfterpayFraudEnabled: currentSite.getCustomPreferenceValue('powerboardWalletButtonsAfterpayFraud'),
    powerboardWalletButtonsAfterpayFraudServiceID: currentSite.getCustomPreferenceValue('powerboardWalletButtonsAfterpayFraudServiceID'),
    powerboardFraudType: currentSite.getCustomPreferenceValue('powerboardFraudType'),
    powerboardFraudServiceID: currentSite.getCustomPreferenceValue('powerboardFraudServiceID'),
    powerboardBMChargeOperationsAll: currentSite.getCustomPreferenceValue('powerboardBMChargeOperationsAll'),
    powerboardCheckoutButtonAfterpayGatewayID: currentSite.getCustomPreferenceValue('powerboardCheckoutButtonAfterpayGatewayID'),
    powerboardCheckoutButtonAfterpayChargeCapture: currentSite.getCustomPreferenceValue('powerboardCheckoutButtonAfterpayChargeCapture'),
    powerboardCheckoutButtonAfterpayFraudEnabled: currentSite.getCustomPreferenceValue('powerboardCheckoutButtonAfterpayFraud'),
    powerboardCheckoutButtonAfterpayFraudServiceID: currentSite.getCustomPreferenceValue('powerboardCheckoutButtonAfterpayFraudServiceID'),
    powerboardCheckoutButtonZipMoneyGatewayID: currentSite.getCustomPreferenceValue('powerboardCheckoutButtonZipMoneyGatewayID'),
    powerboardCheckoutButtonZipMoneyChargeCapture: currentSite.getCustomPreferenceValue('powerboardCheckoutButtonZipMoneyChargeCapture'),
    powerboardCheckoutButtonZipMoneyFraudEnabled: currentSite.getCustomPreferenceValue('powerboardCheckoutButtonZipMoneyFraud'),
    powerboardCheckoutButtonZipMoneyFraudServiceID: currentSite.getCustomPreferenceValue('powerboardCheckoutButtonZipMoneyFraudServiceID'),
    powerboard3DSType: currentSite.getCustomPreferenceValue('powerboard3DSType'),
	  powerboard3DSFlow: currentSite.getCustomPreferenceValue('powerboard3DSFlow'),
	  powerboard3DSServiceID: currentSite.getCustomPreferenceValue('powerboard3DSServiceID'),
    powerboardConnectionType: currentSite.getCustomPreferenceValue('powerboardConnectionType'),
    powerboardCardScheme: currentSite.getCustomPreferenceValue('powerboardCardScheme')
};

module.exports = base;
