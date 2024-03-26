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

base.paydock = {
    apiVersion: "1.0.0",
    paydockRawErrorMessaging: currentSite.getCustomPreferenceValue('paydockRawErrorMessaging'),
    paydockPublicAPIKey: currentSite.getCustomPreferenceValue('paydockPublicAPIKey'),
    paydockGatewayID: currentSite.getCustomPreferenceValue('paydockGatewayID'),
    paydockPrivateAPIKey: currentSite.getCustomPreferenceValue('paydockPrivateAPIKey'),
    paydockChargeCapture: currentSite.getCustomPreferenceValue('paydockChargeCapture'),
    paydockEnable3ds: currentSite.getCustomPreferenceValue('paydockEnable3ds'),
    paydockEnableVaultSession: currentSite.getCustomPreferenceValue('paydockEnableVaultSession'),
    paydockWidgetStyles: paydockWidgetStyles
};

module.exports = base;
