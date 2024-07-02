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

  var chargeCapture = paymentMethodID === 'POWERBOARD_CHECKOUT_BUTTON_AFTERPAY' ?
    preferences.powerboard.powerboardCheckoutButtonAfterpayChargeCapture :
    preferences.powerboard.powerboardCheckoutButtonZipMoneyChargeCapture;

  Transaction.wrap(function () {
    var paymentInstrument = powerboardCheckoutHelper.createPowerboardPaymentInstrument(basket, paymentMethodID, {
      powerboardChargeCapture: chargeCapture
    });
  });

  return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using an Checkout Button APM.
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
  var chargeReqObj
  var chargeResult;

  var order = OrderMgr.getOrder(orderNumber);

  var pst = request.httpParameterMap.pst.value;
  var paymentAmount = paymentInstrument.paymentTransaction.amount.value;
  var paymentCurrency = paymentInstrument.paymentTransaction.amount.currencyCode;

  var chargeReqObj = {
    amount: paymentAmount,
    currency: paymentCurrency,
    reference: orderNumber,
    token: pst
  }

  // get fraud settings
  var fraudEnabled = paymentInstrument.paymentMethod === 'POWERBOARD_CHECKOUT_BUTTON_AFTERPAY' ?
    preferences.powerboard.powerboardCheckoutButtonAfterpayFraudEnabled :
    preferences.powerboard.powerboardCheckoutButtonZipMoneyFraudEnabled;
  var fraudServiceID = paymentInstrument.paymentMethod === 'POWERBOARD_CHECKOUT_BUTTON_AFTERPAY' ?
    preferences.powerboard.powerboardCheckoutButtonAfterpayFraudServiceID :
    preferences.powerboard.powerboardCheckoutButtonZipMoneyFraudServiceID;

  // add fraud details
  if (fraudEnabled && fraudServiceID) {
    chargeReqObj.fraud = {
      service_id: fraudServiceID
    };
  }

  var chargeCapture = paymentInstrument.paymentTransaction.type.value === dw.order.PaymentTransaction.TYPE_CAPTURE;

  try {
    if (paymentInstrument.paymentMethod === 'POWERBOARD_CHECKOUT_BUTTON_AFTERPAY') {
      powerboardCheckoutHelper.addChargePayloadDetails(chargeReqObj, order);
      chargeResult = powerboardService.charges.create(chargeReqObj);
    }
    else {
      chargeResult = powerboardService.charges.create(chargeReqObj, chargeCapture);
    }
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
      paymentInstrument.custom.powerboardToken = pst;
      paymentInstrument.custom.powerboardToken = paymentInstrument.custom.powerboardToken && paymentInstrument.custom.powerboardToken.length > 32 ? paymentInstrument.custom.powerboardToken.substring(0, 31) : paymentInstrument.custom.powerboardToken;
      if (chargeResult.resource.data._id) {
        paymentInstrument.custom.powerboardChargeID = chargeResult.resource.data._id;
        order.custom.powerboardChargeID = chargeResult.resource.data._id;
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
        serverErrors.push(Resource.msg('error.technical', 'checkout', null));
      }

      // update PowerBoard Payment Instrument with charge details
      powerboardCheckoutHelper.updatePowerboardPaymentInstrumentWithChargeDetails(paymentInstrument, chargeResult);
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
