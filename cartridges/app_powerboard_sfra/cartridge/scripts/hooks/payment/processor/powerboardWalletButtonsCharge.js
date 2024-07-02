'use strict';

var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var Resource = require('dw/web/Resource');
var PaymentMgr = require('dw/order/PaymentMgr');

var preferences = require('*/cartridge/config/preferences');

var powerboardCheckoutHelper = require('*/cartridge/scripts/powerboard/helpers/checkoutHelper');
var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');

function processForm(req, paymentForm, viewFormData) {
  var viewData = viewFormData;

  viewData.paymentMethod = {
    value: paymentForm.paymentMethod.value,
    htmlName: paymentForm.paymentMethod.value
  };

  return {
    error: false,
    viewData: viewData
  }
}

function Handle(basket, paymentInformation, paymentMethodID, req) {
  var currentBasket = basket;
  var cardErrors = {};
  var serverErrors = [];

  // defaults
  var walletButtons = null;

  var walletButtonsConfig = powerboardCheckoutHelper.getPowerboardWalletButtonPaymentMethodConfig(paymentMethodID, preferences.powerboard);

  if (!walletButtonsConfig) {
    return { fieldErrors: [cardErrors], serverErrors: [Resource.msgf('powerboard.checkout.billing.wallet.buttons.misconfiguration.error', 'powerboard', null, paymentMethodID)], error: true };
  }

  try {
    walletButtons = powerboardCheckoutHelper.initializePowerboardChargeWallet(currentBasket, walletButtonsConfig.gatewayId, walletButtonsConfig.chargeCapture, walletButtonsConfig.fraudEnabled, walletButtonsConfig.fraudServiceID);
  }
  catch (e) {
    var t = e;
    return { fieldErrors: [cardErrors], serverErrors: [preferences.powerboard.powerboardRawErrorMessaging ? e.message : Resource.msg('powerboard.checkout.billing.error', 'powerboard', null)], error: true };
  }

  if (!walletButtons) {
    return { fieldErrors: [cardErrors], serverErrors: [Resource.msgf('powerboard.checkout.billing.wallet.buttons.initialization.error', 'powerboard', null, paymentMethodID)], error: true };
  }

  Transaction.wrap(function () {
    var paymentInstrument = powerboardCheckoutHelper.createPowerboardPaymentInstrument(basket, paymentMethodID, {
      powerboardChargeCapture: walletButtonsConfig.chargeCapture,
      gatewayType: walletButtons.gatewayType,
      token: walletButtons.token,
      chargeId: walletButtons.chargeId
    });
  });

  return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
  var serverErrors = [];
  var fieldErrors = {};
  var error = false;

  var order = OrderMgr.getOrder(orderNumber);
  var chargeResult;

  try {
    chargeResult = powerboardService.charges.get(paymentInstrument.custom.powerboardChargeID);
  } catch (e) {
    var t = e.message; 
    error = true;
    serverErrors.push(
      preferences.powerboard.powerboardRawErrorMessaging ? e.message : Resource.msg('error.technical', 'checkout', null)
    );
  }

  if (!error) {
    Transaction.wrap(function () {
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
      paymentInstrument.custom.powerboardChargeStatus = chargeResult.resource.data.status;
      paymentInstrument.custom.powerboardToken = paymentInstrument.custom.powerboardToken && paymentInstrument.custom.powerboardToken.length > 32 ? paymentInstrument.custom.powerboardToken.substring(0, 31) : paymentInstrument.custom.powerboardToken;
      if (chargeResult.resource.data._id) {
        paymentInstrument.paymentTransaction.setTransactionID(chargeResult.resource.data._id);
      }

      // update payment details
      var customerSource = chargeResult.resource.data.customer;
      paymentInstrument.creditCardHolder = customerSource.first_name + ' ' + customerSource.last_name;
      paymentInstrument.paymentTransaction.setAccountType(customerSource.payment_source.gateway_type);

      var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
      order.custom.powerboardPaymentMethod = paymentMethod.getName();
  
      if (chargeResult.resource.data.status === 'complete') {
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
      }
      else if (chargeResult.resource.data.status === 'failed') {
        error = true;
        serverErrors.push(Resource.msg('error.technical', 'checkout', null));
      }

      // update PowerBoard Payment Instrument with charge details
      if (!error) powerboardCheckoutHelper.updatePowerboardPaymentInstrumentWithChargeDetails(paymentInstrument, chargeResult);
    });
  }

  return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

function savePaymentInformation(req, basket, billingData) {

}

function fraudDetection(order) {
  var errorCode;
  var errorMessage;
  var status = 'success';

  if (powerboardCheckoutHelper.getPowerboardPaymentInstrument(order) && !preferences.powerboard.powerboardChargeCapture) {
    status = 'flag';
  }

  return {
      status: status,
      errorCode: errorCode,
      errorMessage: errorMessage
  };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
exports.fraudDetection = fraudDetection;
