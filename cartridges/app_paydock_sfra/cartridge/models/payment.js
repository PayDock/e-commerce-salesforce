"use strict";

var PaymentMgr = require('dw/order/PaymentMgr');
var Resource = require('dw/web/Resource');
var collections = require('*/cartridge/scripts/util/collections');

var base = module.superModule;

/**
 * Creates an array of objects containing applicable payment methods
 * @param {dw.util.ArrayList<dw.order.dw.order.PaymentMethod>} paymentMethods - An ArrayList of
 *      applicable payment methods that the user could use for the current basket.
 * @returns {Array} of object that contain information about the applicable payment methods for the
 *      current cart
 */
function applicablePaymentMethods(paymentMethods) {
  return collections.map(paymentMethods, function (method) {
      return {
          ID: method.ID,
          name: method.name,
          description: method.description,
          image: method.image ? method.image.httpsURL.toString() : null
      };
  });
}

/*
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */

function getSelectedPaymentInstruments(selectedPaymentInstruments, countryCode) {
  var BasketMgr = require('dw/order/BasketMgr');
  var paydockCheckoutHelper = require('*/cartridge/scripts/paydock/helpers/checkoutHelper');
  var preferences = require('*/cartridge/config/preferences');

  return collections.map(selectedPaymentInstruments, function (paymentInstrument) {
    var results = {
        paymentMethod: paymentInstrument.paymentMethod,
        amount: paymentInstrument.paymentTransaction.amount.value
    };

    if (paymentInstrument.paymentMethod === 'PAYDOCK') {
        results.lastFour = paymentInstrument.creditCardNumberLastDigits;
        results.owner = paymentInstrument.creditCardHolder;
        results.expirationYear = paymentInstrument.creditCardExpirationYear;
        results.type = paymentInstrument.creditCardType;
        results.maskedCreditCardNumber = paymentInstrument.maskedCreditCardNumber;
        results.expirationMonth = paymentInstrument.creditCardExpirationMonth;
        results.canvasToken = paymentInstrument.custom.paydock3DSToken || '';
        results.env = preferences.paydock.paydockEnvironment;
    }
    else if (['PAYDOCK_WALLET_BUTTONS_APPLE_PAY', 'PAYDOCK_WALLET_BUTTONS_GOOGLE_PAY', 'PAYDOCK_WALLET_BUTTONS_PAYPAL', 'PAYDOCK_WALLET_BUTTONS_AFTERPAY'].indexOf(paymentInstrument.paymentMethod) !== -1) {
      results.gatewayType = paymentInstrument.custom.paydockGatewayType;
      results.token = paymentInstrument.custom.paydockToken;
      results.amountLabel = Resource.msg('paydock.checkout.billing.wallet.buttons.amount.label', 'paydock', null);
      results.country = countryCode;
      results.payLater = (paymentInstrument.paymentMethod === 'PAYDOCK_WALLET_BUTTONS_PAYPAL') ?
        preferences.paydock.paydockWalletButtonsPayPalPayLater :
        false;

      results.owner = paymentInstrument.creditCardHolder;

      if (paymentInstrument.paymentTransaction) {
        results.accountType = paymentInstrument.paymentTransaction.accountType;
      }

      results.env = preferences.paydock.paydockEnvironment;
    }
    else if (paymentInstrument.paymentMethod === 'PAYDOCK_CHECKOUT_BUTTON_AFTERPAY') {
      var currentBasket = BasketMgr.getCurrentOrNewBasket();
      var meta = null;
      var error = false;

      results.owner = paymentInstrument.creditCardHolder;

      if (paymentInstrument.paymentTransaction) {
        results.accountType = paymentInstrument.paymentTransaction.accountType;
      }
      
      // get meta
      try {
        meta = paydockCheckoutHelper.getCheckoutButtonAfterpayMeta(currentBasket);
      }
      catch (e) {
        error = true;
        meta = null;
      }

      results.gatewayId = preferences.paydock.paydockCheckoutButtonAfterpayGatewayID;
      results.publicKey = preferences.paydock.paydockPublicAPIKey;
      results.meta = meta;
      results.error = error;

      results.owner = paymentInstrument.creditCardHolder;

      if (paymentInstrument.paymentTransaction) {
        results.accountType = paymentInstrument.paymentTransaction.accountType;
      }

      results.env = preferences.paydock.paydockEnvironment;
    }
    else if (paymentInstrument.paymentMethod === 'PAYDOCK_CHECKOUT_BUTTON_ZIPMONEY') {
      var currentBasket = BasketMgr.getCurrentOrNewBasket();
      var meta = null;
      var error = false;
      
      // get meta
      try {
        meta = paydockCheckoutHelper.getCheckoutButtonZipMoneyMeta(currentBasket);
      }
      catch (e) {
        error = true;
        meta = null;
      }

      results.gatewayId = preferences.paydock.paydockCheckoutButtonZipMoneyGatewayID;
      results.publicKey = preferences.paydock.paydockPublicAPIKey;
      results.meta = meta;
      results.error = error;

      results.owner = paymentInstrument.creditCardHolder;

      if (paymentInstrument.paymentTransaction) {
        results.accountType = paymentInstrument.paymentTransaction.accountType;
      }

      results.env = preferences.paydock.paydockEnvironment;
    }

    return results;
  });
}

/*
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */


function Payment(currentBasket, currentCustomer, countryCode) {
  base.call(this, currentBasket, currentCustomer, countryCode);

  var paymentAmount = currentBasket.totalGrossPrice;
  var paymentMethods = PaymentMgr.getApplicablePaymentMethods(
    currentCustomer,
    countryCode,
    paymentAmount.value
  );
  var paymentInstruments = currentBasket.paymentInstruments;

  this.applicablePaymentMethods = paymentMethods ? applicablePaymentMethods(paymentMethods) : null;
  this.selectedPaymentInstruments = paymentInstruments ? getSelectedPaymentInstruments(paymentInstruments, countryCode) : null;
}

module.exports = Payment;
