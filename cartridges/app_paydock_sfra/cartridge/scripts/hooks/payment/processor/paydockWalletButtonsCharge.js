'use strict';

var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var Resource = require('dw/web/Resource');

var preferences = require('*/cartridge/config/preferences');

var paydockCheckoutHelper = require('*/cartridge/scripts/paydock/helpers/checkoutHelper');
var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');

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

  var walletButtonsConfig = paydockCheckoutHelper.getPaydockWalletButtonPaymentMethodConfig(paymentMethodID, preferences.paydock);

  if (!walletButtonsConfig) {
    return { fieldErrors: [cardErrors], serverErrors: [Resource.msgf('paydock.checkout.billing.wallet.buttons.misconfiguration.error', 'paydock', null, paymentMethodID)], error: true };
  }

  try {
    walletButtons = paydockCheckoutHelper.initializePaydockChargeWallet(currentBasket, walletButtonsConfig.gatewayId, walletButtonsConfig.chargeCapture, walletButtonsConfig.fraudEnabled, walletButtonsConfig.fraudServiceID);
  }
  catch (e) {
    var t = e;
    return { fieldErrors: [cardErrors], serverErrors: [preferences.paydock.paydockRawErrorMessaging ? e.message : Resource.msg('paydock.checkout.billing.error', 'paydock', null)], error: true };
  }

  if (!walletButtons) {
    return { fieldErrors: [cardErrors], serverErrors: [Resource.msgf('paydock.checkout.billing.wallet.buttons.initialization.error', 'paydock', null, paymentMethodID)], error: true };
  }

  Transaction.wrap(function () {
    var paymentInstrument = paydockCheckoutHelper.createPaydockPaymentInstrument(basket, paymentMethodID, {
      paydockChargeCapture: walletButtonsConfig.chargeCapture,
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
    chargeResult = paydockService.charges.get(paymentInstrument.custom.paydockChargeID);
  } catch (e) {
    var t = e.message; 
    error = true;
    serverErrors.push(
      preferences.paydock.paydockRawErrorMessaging ? e.message : Resource.msg('error.technical', 'checkout', null)
    );
  }

  if (!error) {
    Transaction.wrap(function () {
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
      paymentInstrument.custom.paydockChargeStatus = chargeResult.resource.data.status;
      paymentInstrument.custom.paydockToken = paymentInstrument.custom.paydockToken && paymentInstrument.custom.paydockToken.length > 32 ? paymentInstrument.custom.paydockToken.substring(0, 31) : paymentInstrument.custom.paydockToken;
      if (chargeResult.resource.data._id) {
        paymentInstrument.paymentTransaction.setTransactionID(chargeResult.resource.data._id);
      }

      // update payment details
      var customerSource = chargeResult.resource.data.customer;
      paymentInstrument.creditCardHolder = customerSource.first_name + ' ' + customerSource.last_name;
      paymentInstrument.paymentTransaction.setAccountType(customerSource.payment_source.gateway_type);

      order.custom.paydockPaymentMethod = paymentInstrument.getPaymentMethod();

      if (chargeResult.resource.data.status === 'complete') {
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
      }
      else if (chargeResult.resource.data.status === 'failed') {
        error = true;
        serverErrors.push(Resource.msg('error.technical', 'checkout', null));
      }

      // update Paydock Payment Instrument with charge details
      if (!error) paydockCheckoutHelper.updatePaydockPaymentInstrumentWithChargeDetails(paymentInstrument, chargeResult);
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

  if (paydockCheckoutHelper.getPaydockPaymentInstrument(order) && !preferences.paydock.paydockChargeCapture) {
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
