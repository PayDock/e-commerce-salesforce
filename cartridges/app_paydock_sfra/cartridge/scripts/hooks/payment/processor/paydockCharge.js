'use strict';

var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var Resource = require('dw/web/Resource');

var preferences = require('*/cartridge/config/preferences');
var collections = require('*/cartridge/scripts/util/collections');

var paydockCheckoutHelper = require('*/cartridge/scripts/paydock/helpers/checkoutHelper');
var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');

function processForm(req, paymentForm, viewFormData) {
  var viewData = viewFormData;

  viewData.paymentMethod = {
    value: paymentForm.paymentMethod.value,
    htmlName: paymentForm.paymentMethod.value
  };

  viewData.paymentInformation = {
    paydockToken: paymentForm.paydockToken.value
  }

  return {
    error: false,
    viewData: viewData
  }
}

function Handle(basket, paymentInformation, paymentMethodID, req) {
  var currentBasket = basket;
  var cardErrors = {};
  var serverErrors = [];

  // shortcuts
  var token = paymentInformation.paydockToken;
  var amount = currentBasket.totalGrossPrice.value;
  var currency = currentBasket.currencyCode;

  try {
    var vaultsReqObj = {
      token: token
    }
  
    if (preferences.paydock.paydockEnableVaultSession) {
      vaultsReqObj.vault_type = "session"
    }
  
    var vaultResponse = paydockService.vaults.create(vaultsReqObj);

  }
  catch (e) {
    return { fieldErrors: [cardErrors], serverErrors: [preferences.paydock.paydockRawErrorMessaging ? e.message : Resource.msg('paydock.checkout.billing.error', 'paydock', null)], error: true };
  }

  var paymentSource = vaultResponse.resource.data; // shortcut

  Transaction.wrap(function () {
    var paymentInstrument = paydockCheckoutHelper.createPaydockPaymentInstrument(basket, paymentMethodID, {
      cardHolder: paymentSource.card_name,
      cardNumber: '**** **** **** ' + paymentSource.card_number_last4,
      cardType: paymentSource.card_scheme,
      cardExpMonth: paymentSource.expire_month,
      cardExpYear: paymentSource.expire_year,
      token: token,
      vaultToken: paymentSource.vault_token,
      vaultType: paymentSource.vault_type
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

  var paymentAmount = paymentInstrument.paymentTransaction.amount.value;
  var paymentCurrency = paymentInstrument.paymentTransaction.amount.currencyCode;
  
  try {
    var chargeResult = paydockService.charges.create({
      amount: paymentAmount,
      currency: 'AUD',
      // currency: paymentCurrency,
      customer: {
        payment_source: {
          vault_token: paymentInstrument.custom.paydockVaultToken,
          gateway_id: preferences.paydock.paydockGatewayID
        }
      }
    });
  } catch (e) {
      error = true;
      serverErrors.push(
        preferences.paydock.paydockRawErrorMessaging ? e.message : Resource.msg('error.technical', 'checkout', null)
      );
  }

  if (!error) {
    Transaction.wrap(function () {
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
      paymentInstrument.custom.paydockChargeStatus = chargeResult.resource.data.status;
      if (chargeResult.resource.data._id) {
        paymentInstrument.paymentTransaction.setTransactionID(chargeResult.resource.data._id);
      }
  
      if (chargeResult.resource.data.status === 'complete') {
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
      }
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
