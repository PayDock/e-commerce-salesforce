'use strict';

var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var Resource = require('dw/web/Resource');
var PaymentMgr = require('dw/order/PaymentMgr');

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

  var chargeCapture = paymentMethodID === 'PAYDOCK_CHECKOUT_BUTTON_AFTERPAY' ?
    preferences.paydock.paydockCheckoutButtonAfterpayChargeCapture :
    preferences.paydock.paydockCheckoutButtonZipMoneyChargeCapture;

  Transaction.wrap(function () {
    var paymentInstrument = paydockCheckoutHelper.createPaydockPaymentInstrument(basket, paymentMethodID, {
      paydockChargeCapture: chargeCapture
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
  var fraudEnabled = paymentInstrument.paymentMethod === 'PAYDOCK_CHECKOUT_BUTTON_AFTERPAY' ?
    preferences.paydock.paydockCheckoutButtonAfterpayFraudEnabled :
    preferences.paydock.paydockCheckoutButtonZipMoneyFraudEnabled;
  var fraudServiceID = paymentInstrument.paymentMethod === 'PAYDOCK_CHECKOUT_BUTTON_AFTERPAY' ?
    preferences.paydock.paydockCheckoutButtonAfterpayFraudServiceID :
    preferences.paydock.paydockCheckoutButtonZipMoneyFraudServiceID;

  // add fraud details
  if (fraudEnabled && fraudServiceID) {
    chargeReqObj.fraud = {
      service_id: fraudServiceID
    };
  }

  var chargeCapture = paymentInstrument.paymentTransaction.type.value === dw.order.PaymentTransaction.TYPE_CAPTURE;

  try {
    if (paymentInstrument.paymentMethod === 'PAYDOCK_CHECKOUT_BUTTON_AFTERPAY') {
      paydockCheckoutHelper.addChargePayloadDetails(chargeReqObj, order);

      chargeResult = paydockService.charges.create(chargeReqObj);
    }
    else {
      chargeResult = paydockService.charges.create(chargeReqObj, chargeCapture);
    }
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
      paymentInstrument.custom.paydockToken = pst;
      paymentInstrument.custom.paydockToken = paymentInstrument.custom.paydockToken && paymentInstrument.custom.paydockToken.length > 32 ? paymentInstrument.custom.paydockToken.substring(0, 31) : paymentInstrument.custom.paydockToken;
      if (chargeResult.resource.data._id) {
        paymentInstrument.custom.paydockChargeID = chargeResult.resource.data._id;
        order.custom.paydockChargeID = chargeResult.resource.data._id;
        paymentInstrument.paymentTransaction.setTransactionID(chargeResult.resource.data._id);
      }

      // update payment details
      var customerSource = chargeResult.resource.data.customer;
      paymentInstrument.creditCardHolder = customerSource.first_name + ' ' + customerSource.last_name;
      paymentInstrument.paymentTransaction.setAccountType(customerSource.payment_source.gateway_type);

      var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
      order.custom.paydockPaymentMethod = paymentMethod.getName();

      if (chargeResult.resource.data.status === 'complete') {
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
      }
      else if (chargeResult.resource.data.status === 'failed') {
        serverErrors.push(Resource.msg('error.technical', 'checkout', null));
      }

      // update Paydock Payment Instrument with charge details
      paydockCheckoutHelper.updatePaydockPaymentInstrumentWithChargeDetails(paymentInstrument, chargeResult);
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
