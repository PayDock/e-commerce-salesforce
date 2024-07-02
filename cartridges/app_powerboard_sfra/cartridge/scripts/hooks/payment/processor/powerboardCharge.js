'use strict';

var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var PaymentMgr = require('dw/order/PaymentMgr');

var preferences = require('*/cartridge/config/preferences');
var array = require('*/cartridge/scripts/util/array');

var powerboardCheckoutHelper = require('*/cartridge/scripts/powerboard/helpers/checkoutHelper');
var powerboardService = require('*/cartridge/scripts/powerboard/services/powerboardService');

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function processForm(req, paymentForm, viewFormData) {

  var viewData = viewFormData;

  viewData.paymentMethod = {
    value: paymentForm.paymentMethod.value,
    htmlName: paymentForm.paymentMethod.value
  };

  if (req.form.storedPaymentUUID) {
    viewData.storedPaymentUUID = req.form.storedPaymentUUID;
  }

  viewData.paymentInformation = {
    powerboardToken: paymentForm.powerboardToken.value,
    powerboardSaveCard: paymentForm.savePowerboardCard.checked,
    browserDetails: JSON.parse(paymentForm.browserDetails.htmlValue)
  };

  // process payment information
  if (viewData.storedPaymentUUID
      && req.currentCustomer.raw.authenticated
      && req.currentCustomer.raw.registered
  ) {
      var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
      var paymentInstrument = array.find(paymentInstruments, function (item) {
          return viewData.storedPaymentUUID === item.UUID;
      });

      viewData.paymentInformation.selectedStoredPaymentInstrument = paymentInstrument;
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
  var vaultResponse;
  var vaultsReqObj;
  var paymentSource;
  var customerToken;
  var paymentInstrumentObj;

  // shortcuts
  var token = paymentInformation.powerboardToken;
  var amount = powerboardCheckoutHelper.getNonGiftCertificateAmount(currentBasket).value;
  var currency = currentBasket.currencyCode;
  session.privacy.fraudInreview = false;
  
  try {
    if (req.currentCustomer.raw.authenticated
      && req.currentCustomer.raw.registered
    ) {
      var customer = currentBasket.getCustomer().profile;
      if (empty(paymentInformation.selectedStoredPaymentInstrument)
          && preferences.powerboard.powerboard3DSFlow.value === 'vault'
      ) {
        vaultsReqObj = {
          token: token
        }

        if (!paymentInformation.powerboardSaveCard) {
          vaultsReqObj.vault_type = "session"
        }

        session.privacy.powerboardSaveCard = paymentInformation.powerboardSaveCard;
  
        vaultResponse = powerboardService.vaults.create(vaultsReqObj);
        paymentSource = vaultResponse.resource.data;
  
        paymentInstrumentObj = {
          cardHolder: paymentSource.card_name,
          cardNumber: '**** **** **** ' + paymentSource.card_number_last4,
          cardType: capitalize(paymentSource.card_scheme),
          cardExpMonth: paymentSource.expire_month,
          cardExpYear: paymentSource.expire_year,
          token: token,
          vaultToken: paymentSource.vault_token,
          vaultType: paymentSource.vault_type
        }

        if (
          paymentSource.card_number_bin
          && paymentSource.card_number_last4
          && paymentSource.expire_month
          && paymentSource.expire_year
        ) {
          paymentInstrumentObj.powerboardCardDetails = paymentSource.card_number_bin
            + '-'
            + paymentSource.card_number_last4
            + '_'
            + paymentSource.expire_month
            + '/'
            + paymentSource.expire_year
        }

        if (preferences.powerboard.powerboardSaveCardMethod.value === 'customerWithGatewayID'
          && paymentInformation.powerboardSaveCard
          && preferences.powerboard.powerboardFraudType.value === 'disabledFraud'
          && preferences.powerboard.powerboard3DSType.value === 'disabled3DS'
        ) {
          var billingAddress = currentBasket.getBillingAddress();
          customerToken = powerboardService.customers.create({
            first_name: customer.firstName,
            last_name: customer.lastName,
            email: customer.email,
            phone: billingAddress.phone,
            payment_source: {
              address_country: billingAddress.countryCode.value,
              address_city: billingAddress.city,
              address_postcode: billingAddress.postalCode,
              address_state: billingAddress.stateCode || '',
              address_line1: billingAddress.address1,
              address_line2: billingAddress.address2 ? billingAddress.address2 : billingAddress.address1,
              gateway_id: preferences.powerboard.powerboardGatewayID,
              vault_token: vaultResponse.resource.data.vault_token,
            }
          });
          paymentInstrumentObj.customerID = customerToken.resource.data._id;
        }

        if (preferences.powerboard.powerboardSaveCardMethod.value === 'customerWithoutGatewayID'
          && paymentInformation.powerboardSaveCard
          && preferences.powerboard.powerboardFraudType.value === 'disabledFraud'
          && preferences.powerboard.powerboard3DSType.value === 'disabled3DS'
        ) {
          var billingAddress = currentBasket.getBillingAddress();
          customerToken = powerboardService.customers.create({
            first_name: customer.firstName,
            last_name: customer.lastName,
            email: customer.email,
            phone: billingAddress.phone,
            payment_source: {
              address_country: billingAddress.countryCode.value,
              address_city: billingAddress.city,
              address_postcode: billingAddress.postalCode,
              address_state: billingAddress.stateCode || '',
              address_line1: billingAddress.address1,
              address_line2: billingAddress.address2 ? billingAddress.address2 : billingAddress.address1,
              vault_token: vaultResponse.resource.data.vault_token
            }
          });
          paymentInstrumentObj.customerID = customerToken.resource.data._id;
        }

      } else if(!empty(paymentInformation.selectedStoredPaymentInstrument)) {
        var selectedPaymentInstr = paymentInformation.selectedStoredPaymentInstrument; //shortcut

        paymentInstrumentObj = {
          cardHolder: selectedPaymentInstr.creditCardHolder,
          cardNumber: selectedPaymentInstr.creditCardNumber,
          cardType: selectedPaymentInstr.raw.creditCardType,
          cardExpMonth: selectedPaymentInstr.creditCardExpirationMonth,
          cardExpYear: selectedPaymentInstr.creditCardExpirationYear,
          vaultToken:  selectedPaymentInstr.raw.custom.powerboardVaultToken,
          vaultType: 'permanent',
          customerID: selectedPaymentInstr.raw.custom.powerboardCustomerID || null
        };
      } else {
        paymentInstrumentObj = {};
      }

    } else {

      if (preferences.powerboard.powerboard3DSFlow.value === 'ott'
      ) {
        paymentInstrumentObj = {};
      } else {

        vaultsReqObj = {
          token: token,
          vault_type: "session"
        }
        powerboardCheckoutHelper.addChargePayloadDetails(vaultsReqObj, currentBasket);
        vaultResponse = powerboardService.vaults.create(vaultsReqObj);
        paymentSource = vaultResponse.resource.data;
  
        paymentInstrumentObj = {
          cardHolder: paymentSource.card_name,
          cardNumber: '**** **** **** ' + paymentSource.card_number_last4,
          cardType: capitalize(paymentSource.card_scheme),
          cardExpMonth: paymentSource.expire_month,
          cardExpYear: paymentSource.expire_year,
          token: token,
          vaultToken: paymentSource.vault_token,
          vaultType: paymentSource.vault_type,
        }
      }

    }

    if (preferences.powerboard.powerboardFraudType.value === 'standaloneFraud'
        && empty(paymentInstrumentObj.customerID)
        && preferences.powerboard.powerboard3DSFlow.value === 'vault'
    ) { 
      var customer = currentBasket.getBillingAddress();
      var fraudReqObj = {
        amount: amount,
        currency: currency,
        customer: {
          first_name: customer.firstName,
          last_name: customer.lastName,
            payment_source: {
                vault_token: paymentInstrumentObj.vaultToken
            }
        },
        fraud: {
            service_id: preferences.powerboard.powerboardFraudServiceID
        }
      };
      powerboardCheckoutHelper.addChargePayloadDetails(fraudReqObj, currentBasket);
      var fraudResult = powerboardService.charges.fraud(fraudReqObj);
      session.privacy.fraudID = fraudResult.resource.data._id;
      session.privacy.fraudInreview = fraudResult.resource.data.status === 'inreview';
      paymentInstrumentObj.powerboardFraudID = fraudResult.resource.data._id;
      paymentInstrumentObj.powerboardFraudStatus = fraudResult.resource.data.status
    }

    if (preferences.powerboard.powerboard3DSType.value === 'inbuilt3DS'
        && empty(paymentInstrumentObj.customerID)
    ) { 
      var customer = currentBasket.getBillingAddress();
      var preAuthReqObj = {
        amount: amount,
        currency: currency,
        customer: {
          first_name: customer.firstName,
          last_name: customer.lastName,
          payment_source: {
                gateway_id: preferences.powerboard.powerboardGatewayID
            }
        },
        _3ds: {
            browser_details: paymentInformation.browserDetails
        }
      }

      if (preferences.powerboard.powerboard3DSFlow.value === 'ott') {
        preAuthReqObj.token = token;
      } else {
        preAuthReqObj.customer.payment_source.vault_token = paymentInstrumentObj.vaultToken
      }

      powerboardCheckoutHelper.addChargePayloadDetails(preAuthReqObj, currentBasket);
      var result = powerboardService.charges.preAuth(preAuthReqObj);
      session.privacy.threeDSChargeID = result.resource.data._id
      paymentInstrumentObj.powerboard3DSToken = result.resource.data._3ds.token;
    }

    if (preferences.powerboard.powerboard3DSFlow.value === 'ott'
        && preferences.powerboard.powerboard3DSType.value !== 'inbuilt3DS'
    ) {
      paymentInstrumentObj.token = token;
    }

    if (preferences.powerboard.powerboard3DSType.value === 'standalone3DS'
    && empty(paymentInstrumentObj.customerID)
    && preferences.powerboard.powerboard3DSFlow.value === 'vault'
    ) { 
      var customer = currentBasket.getBillingAddress();
      var date = new Date().toISOString();
      var standAloneReqObj = {
        amount: amount,
        currency: currency,
        customer: {
            first_name: customer.firstName,
            last_name: customer.lastName,
            phone: customer.phone,
            payment_source: {
                vault_token: paymentInstrumentObj.vaultToken,
                gateway_id: preferences.powerboard.powerboardGatewayID
            }
        },
        _3ds: {
            service_id: preferences.powerboard.powerboard3DSServiceID,
            authentication: {
                type: '01',
                date: date
            }
        }
      };
      var result = powerboardService.charges.standalone3DS(standAloneReqObj)
      session.privacy.threeDSChargeID = result.resource.data._3ds.id;
      paymentInstrumentObj.powerboard3DSToken = result.resource.data._3ds.token;
    }


    Transaction.wrap(function () {
      var paymentInstrument = powerboardCheckoutHelper.createPowerboardPaymentInstrument(basket, paymentMethodID, paymentInstrumentObj);
    });
  }
  catch (e) {
    var t = e.message;
    return { fieldErrors: [cardErrors], serverErrors: [preferences.powerboard.powerboardRawErrorMessaging ? e.message : Resource.msg('powerboard.checkout.billing.error', 'powerboard', null)], error: true };
  }

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
  var chargeReqObj;
  var chargeResult;

  var order = OrderMgr.getOrder(orderNumber);
  var customer = order.getCustomer();

  var paymentAmount = paymentInstrument.paymentTransaction.amount.value;
  var paymentCurrency = paymentInstrument.paymentTransaction.amount.currencyCode;

  try {
    if (customer.registered
      && !empty(paymentInstrument.custom.powerboardCustomerID)
      && (
        preferences.powerboard.powerboardSaveCardMethod.value === 'customerWithGatewayID'
        || preferences.powerboard.powerboardSaveCardMethod.value === 'customerWithoutGatewayID'
      )) {
        chargeReqObj = {
          amount: paymentAmount,
          currency: paymentCurrency,
          reference: orderNumber,
          customer_id: paymentInstrument.custom.powerboardCustomerID
        }

        if (preferences.powerboard.powerboardSaveCardMethod.value === 'customerWithoutGatewayID') {
          chargeReqObj.customer = { payment_source: {
            gateway_id: preferences.powerboard.powerboardGatewayID
          }}
        }

        powerboardCheckoutHelper.addChargePayloadDetails(chargeReqObj, order);
        chargeResult = powerboardService.charges.create(chargeReqObj, preferences.powerboard.powerboardChargeCapture);
    } else {
      chargeReqObj = {
        amount: paymentAmount,
        currency: paymentCurrency,
        reference: orderNumber,
        customer: {
          first_name: order.billingAddress.firstName,
          last_name: order.billingAddress.lastName,
          email: order.customerEmail,
          payment_source: {
            gateway_id: preferences.powerboard.powerboardGatewayID
          }
        }
      }

      if (paymentInstrument.custom.powerboardVaultToken) {
        chargeReqObj.customer.payment_source.vault_token = paymentInstrument.custom.powerboardVaultToken
      }

      if (preferences.powerboard.powerboard3DSType.value === 'inbuilt3DS') {
        var token = request.httpParameterMap.threeDSToken.stringValue
        chargeReqObj._3ds = {
          id: token
        }
      }

      if (preferences.powerboard.powerboard3DSFlow.value === 'ott'
        && preferences.powerboard.powerboard3DSType.value !== 'inbuilt3DS'
      ) {
        chargeReqObj.token = paymentInstrument.custom.powerboardToken;
      }

      if (preferences.powerboard.powerboard3DSType.value === 'standalone3DS'
        && preferences.powerboard.powerboard3DSFlow.value === 'vault'
      ) {
        var token = request.httpParameterMap.threeDSToken.stringValue
        chargeReqObj._3ds_charge_id = token;
      }

      if (preferences.powerboard.powerboardFraudType.value === 'inbuiltFraud') {
        chargeReqObj.fraud = {
          service_id: preferences.powerboard.powerboardFraudServiceID
        }
      }

      powerboardCheckoutHelper.addChargePayloadDetails(chargeReqObj, order);

      if (!session.privacy.fraudInreview) {
        chargeResult = powerboardService.charges.create(chargeReqObj, preferences.powerboard.powerboardChargeCapture);
      }

      if (preferences.powerboard.powerboardFraudType.value === 'standaloneFraud'
          && preferences.powerboard.powerboard3DSFlow.value === 'vault'
          && !session.privacy.fraudInreview
      ) {
        var attachFraudResult = powerboardService.charges.attachFraud(chargeResult.resource.data._id, {
          fraud_charge_id: session.privacy.fraudID
        });
      }

      if (customer.registered
          && (
            !(preferences.powerboard.powerboardFraudType.value === 'disabledFraud')
            || !(preferences.powerboard.powerboard3DSType.value === 'disabled3DS')
          )
          && session.privacy.powerboardSaveCard
        ) {
          var customerToken;
          var customerID;
          var billingAddress = order.getBillingAddress();

          if (preferences.powerboard.powerboardSaveCardMethod.value === 'customerWithGatewayID') {
            customerToken = powerboardService.customers.create({
              first_name: customer.profile.firstName,
              last_name: customer.profile.lastName,
              email: customer.profile.email,
              phone: billingAddress.phone,
              payment_source: {
                address_country: billingAddress.countryCode.value,
                address_city: billingAddress.city,
                address_postcode: billingAddress.postalCode,
                address_state: billingAddress.stateCode || '',
                address_line1: billingAddress.address1,
                address_line2: billingAddress.address2 ? billingAddress.address2 : billingAddress.address1,
                gateway_id: preferences.powerboard.powerboardGatewayID,
                vault_token: paymentInstrument.custom.powerboardVaultToken,
              }
            });
            customerID = customerToken.resource.data._id;
          }

          if (preferences.powerboard.powerboardSaveCardMethod.value === 'customerWithoutGatewayID') {
            customerToken = powerboardService.customers.create({
              first_name: customer.profile.firstName,
              last_name: customer.profile.lastName,
              email: customer.profile.email,
              phone: billingAddress.phone,
              payment_source: {
                address_country: billingAddress.countryCode.value,
                address_city: billingAddress.city,
                address_postcode: billingAddress.postalCode,
                address_state: billingAddress.stateCode || '',
                address_line1: billingAddress.address1,
                address_line2: billingAddress.address2 ? billingAddress.address2 : billingAddress.address1,
                vault_token: paymentInstrument.custom.powerboardVaultToken
              }
            });
            customerID = customerToken.resource.data._id;
          }

          if (!empty(customerID)) {
            var paymentInstrs = customer.getProfile().getWallet().paymentInstruments;
            var paymentInstr = array.find(paymentInstrs, function (item) {
                return paymentInstrument.custom.powerboardVaultToken === item.custom.powerboardVaultToken;
            });

            if (!empty(paymentInstr)) {
              Transaction.wrap(function () {
                paymentInstr.custom.powerboardCustomerID = customerID;
              });
            }
          }
      }
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

      if (request.httpParameterMap.threeDSToken && request.httpParameterMap.threeDSToken.stringValue) {
        paymentInstrument.custom.powerboardCharge3DSToken = request.httpParameterMap.threeDSToken.stringValue;
      }

      if (chargeResult) {
        paymentInstrument.custom.powerboardChargeStatus = chargeResult.resource.data.status;
  
        if (chargeResult.resource.data._id) {
          paymentInstrument.custom.powerboardChargeID = chargeResult.resource.data._id;
          order.custom.powerboardChargeID = chargeResult.resource.data._id;
          var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
          order.custom.powerboardPaymentMethod = paymentMethod.getName();
          paymentInstrument.paymentTransaction.setTransactionID(chargeResult.resource.data._id);
        }
    
        if (chargeResult.resource.data.status === 'complete') {
          order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        }
  
        // update PowerBoard Payment Instrument with charge details
        powerboardCheckoutHelper.updatePowerboardPaymentInstrumentWithChargeDetails(paymentInstrument, chargeResult);
      }
    });
  }

  return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

function savePaymentInformation(req, basket, billingData) {
  var CustomerMgr = require('dw/customer/CustomerMgr');
  var collections = require('*/cartridge/scripts/util/collections');

  if (req.currentCustomer.raw.authenticated
    && req.currentCustomer.raw.registered
    && billingData.paymentInformation.powerboardSaveCard
    && (billingData.paymentMethod.value === 'POWERBOARD')
    && empty(billingData.storedPaymentUUID)
  ) {
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var wallet = customer.getProfile().getWallet();
    var paymentInstr = basket.paymentInstrument;
    var storedPaymentCollection = wallet.getPaymentInstruments(billingData.paymentMethod.value);
    var alreadyExistingPaymentInstrument = collections.find(storedPaymentCollection, function (item) {
      return item.custom.powerboardCardDetails === paymentInstr.custom.powerboardCardDetails;
    });

    Transaction.wrap(function () {
      if (alreadyExistingPaymentInstrument) {
        wallet.removePaymentInstrument(alreadyExistingPaymentInstrument)
      }

      var storedPaymentInstrument = wallet.createPaymentInstrument(billingData.paymentMethod.value);

      storedPaymentInstrument.setCreditCardHolder(
        paymentInstr.creditCardHolder
      );
      storedPaymentInstrument.setCreditCardNumber(
        paymentInstr.creditCardNumber
      );
      storedPaymentInstrument.setCreditCardType(
        paymentInstr.creditCardType
      );
      storedPaymentInstrument.setCreditCardExpirationMonth(
        paymentInstr.creditCardExpirationMonth
      );
      storedPaymentInstrument.setCreditCardExpirationYear(
        paymentInstr.creditCardExpirationYear
      );

      if (paymentInstr.custom.powerboardVaultToken) {
        storedPaymentInstrument.custom.powerboardVaultToken = paymentInstr.custom.powerboardVaultToken;
      }

      if (paymentInstr.custom.powerboardCustomerID) {
        storedPaymentInstrument.custom.powerboardCustomerID = paymentInstr.custom.powerboardCustomerID;
      }

      if (paymentInstr.custom.powerboardCardDetails) {
        storedPaymentInstrument.custom.powerboardCardDetails = paymentInstr.custom.powerboardCardDetails;
      }
    });
  }
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
