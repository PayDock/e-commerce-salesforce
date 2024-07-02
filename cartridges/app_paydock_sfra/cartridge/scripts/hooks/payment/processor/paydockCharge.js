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

var paydockCheckoutHelper = require('*/cartridge/scripts/paydock/helpers/checkoutHelper');
var paydockService = require('*/cartridge/scripts/paydock/services/paydockService');

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
    paydockToken: paymentForm.paydockToken.value,
    paydockSaveCard: paymentForm.savePaydockCard.checked,
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
  var token = paymentInformation.paydockToken;
  var amount = paydockCheckoutHelper.getNonGiftCertificateAmount(currentBasket).value;
  var currency = currentBasket.currencyCode;
  session.privacy.fraudInreview = false;
  
  try {
    if (req.currentCustomer.raw.authenticated
      && req.currentCustomer.raw.registered
    ) {
      var customer = currentBasket.getCustomer().profile;
      if (empty(paymentInformation.selectedStoredPaymentInstrument)
          && preferences.paydock.paydock3DSFlow.value === 'vault'
      ) {
        vaultsReqObj = {
          token: token
        }

        if (!paymentInformation.paydockSaveCard) {
          vaultsReqObj.vault_type = "session"
        }

        session.privacy.paydockSaveCard = paymentInformation.paydockSaveCard;
  
        vaultResponse = paydockService.vaults.create(vaultsReqObj);
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
          paymentInstrumentObj.paydockCardDetails = paymentSource.card_number_bin
            + '-'
            + paymentSource.card_number_last4
            + '_'
            + paymentSource.expire_month
            + '/'
            + paymentSource.expire_year
        }

        if (preferences.paydock.paydockSaveCardMethod.value === 'customerWithGatewayID'
          && paymentInformation.paydockSaveCard
          && preferences.paydock.paydockFraudType.value === 'disabledFraud'
          && preferences.paydock.paydock3DSType.value === 'disabled3DS'
        ) {
          var billingAddress = currentBasket.getBillingAddress();
          customerToken = paydockService.customers.create({
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
              gateway_id: preferences.paydock.paydockGatewayID,
              vault_token: vaultResponse.resource.data.vault_token,
            }
          });
          paymentInstrumentObj.customerID = customerToken.resource.data._id;
        }

        if (preferences.paydock.paydockSaveCardMethod.value === 'customerWithoutGatewayID'
          && paymentInformation.paydockSaveCard
          && preferences.paydock.paydockFraudType.value === 'disabledFraud'
          && preferences.paydock.paydock3DSType.value === 'disabled3DS'
        ) {
          var billingAddress = currentBasket.getBillingAddress();
          customerToken = paydockService.customers.create({
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
          vaultToken:  selectedPaymentInstr.raw.custom.paydockVaultToken,
          vaultType: 'permanent',
          customerID: selectedPaymentInstr.raw.custom.paydockCustomerID || null
        };
      } else {
        paymentInstrumentObj = {};
      }

    } else {

      if (preferences.paydock.paydock3DSFlow.value === 'ott'
      ) {
        paymentInstrumentObj = {};
      } else {

        vaultsReqObj = {
          token: token,
          vault_type: "session"
        }
        paydockCheckoutHelper.addChargePayloadDetails(vaultsReqObj, currentBasket);
        vaultResponse = paydockService.vaults.create(vaultsReqObj);
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

    if (preferences.paydock.paydockFraudType.value === 'standaloneFraud'
        && empty(paymentInstrumentObj.customerID)
        && preferences.paydock.paydock3DSFlow.value === 'vault'
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
            service_id: preferences.paydock.paydockFraudServiceID
        }
      };
      paydockCheckoutHelper.addChargePayloadDetails(fraudReqObj, currentBasket);
      var fraudResult = paydockService.charges.fraud(fraudReqObj);
      session.privacy.fraudID = fraudResult.resource.data._id;
      session.privacy.fraudInreview = fraudResult.resource.data.status === 'inreview';
      paymentInstrumentObj.paydockFraudID = fraudResult.resource.data._id;
      paymentInstrumentObj.paydockFraudStatus = fraudResult.resource.data.status
    }

    if (preferences.paydock.paydock3DSType.value === 'inbuilt3DS'
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
                gateway_id: preferences.paydock.paydockGatewayID
            }
        },
        _3ds: {
            browser_details: paymentInformation.browserDetails
        }
      }

      if (preferences.paydock.paydock3DSFlow.value === 'ott') {
        preAuthReqObj.token = token;
      } else {
        preAuthReqObj.customer.payment_source.vault_token = paymentInstrumentObj.vaultToken
      }

      paydockCheckoutHelper.addChargePayloadDetails(preAuthReqObj, currentBasket);
      var result = paydockService.charges.preAuth(preAuthReqObj);
      session.privacy.threeDSChargeID = result.resource.data._id
      paymentInstrumentObj.paydock3DSToken = result.resource.data._3ds.token;
    }

    if (preferences.paydock.paydock3DSFlow.value === 'ott'
        && preferences.paydock.paydock3DSType.value !== 'inbuilt3DS'
    ) {
      paymentInstrumentObj.token = token;
    }

    if (preferences.paydock.paydock3DSType.value === 'standalone3DS'
    && empty(paymentInstrumentObj.customerID)
    && preferences.paydock.paydock3DSFlow.value === 'vault'
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
                gateway_id: preferences.paydock.paydockGatewayID
            }
        },
        _3ds: {
            service_id: preferences.paydock.paydock3DSServiceID,
            authentication: {
                type: '01',
                date: date
            }
        }
      };
      var result = paydockService.charges.standalone3DS(standAloneReqObj)
      session.privacy.threeDSChargeID = result.resource.data._3ds.id;
      paymentInstrumentObj.paydock3DSToken = result.resource.data._3ds.token;
    }


    Transaction.wrap(function () {
      var paymentInstrument = paydockCheckoutHelper.createPaydockPaymentInstrument(basket, paymentMethodID, paymentInstrumentObj);
    });
  }
  catch (e) {
    var t = e.message;
    return { fieldErrors: [cardErrors], serverErrors: [preferences.paydock.paydockRawErrorMessaging ? e.message : Resource.msg('paydock.checkout.billing.error', 'paydock', null)], error: true };
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
      && !empty(paymentInstrument.custom.paydockCustomerID)
      && (
        preferences.paydock.paydockSaveCardMethod.value === 'customerWithGatewayID'
        || preferences.paydock.paydockSaveCardMethod.value === 'customerWithoutGatewayID'
      )) {
        chargeReqObj = {
          amount: paymentAmount,
          currency: paymentCurrency,
          reference: orderNumber,
          customer_id: paymentInstrument.custom.paydockCustomerID
        }

        if (preferences.paydock.paydockSaveCardMethod.value === 'customerWithoutGatewayID') {
          chargeReqObj.customer = { payment_source: {
            gateway_id: preferences.paydock.paydockGatewayID
          }}
        }

        paydockCheckoutHelper.addChargePayloadDetails(chargeReqObj, order);
        chargeResult = paydockService.charges.create(chargeReqObj, preferences.paydock.paydockChargeCapture);
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
            gateway_id: preferences.paydock.paydockGatewayID
          }
        }
      }

      if (paymentInstrument.custom.paydockVaultToken) {
        chargeReqObj.customer.payment_source.vault_token = paymentInstrument.custom.paydockVaultToken
      }

      if (preferences.paydock.paydock3DSType.value === 'inbuilt3DS') {
        var token = request.httpParameterMap.threeDSToken.stringValue
        chargeReqObj._3ds = {
          id: token
        }
      }

      if (preferences.paydock.paydock3DSFlow.value === 'ott'
        && preferences.paydock.paydock3DSType.value !== 'inbuilt3DS'
      ) {
        chargeReqObj.token = paymentInstrument.custom.paydockToken;
      }

      if (preferences.paydock.paydock3DSType.value === 'standalone3DS'
        && preferences.paydock.paydock3DSFlow.value === 'vault'
      ) {
        var token = request.httpParameterMap.threeDSToken.stringValue
        chargeReqObj._3ds_charge_id = token;
      }

      if (preferences.paydock.paydockFraudType.value === 'inbuiltFraud') {
        chargeReqObj.fraud = {
          service_id: preferences.paydock.paydockFraudServiceID
        }
      }

      paydockCheckoutHelper.addChargePayloadDetails(chargeReqObj, order);

      if (!session.privacy.fraudInreview) {
        chargeResult = paydockService.charges.create(chargeReqObj, preferences.paydock.paydockChargeCapture);
      }

      if (preferences.paydock.paydockFraudType.value === 'standaloneFraud'
          && preferences.paydock.paydock3DSFlow.value === 'vault'
          && !session.privacy.fraudInreview
      ) {
        var attachFraudResult = paydockService.charges.attachFraud(chargeResult.resource.data._id, {
          fraud_charge_id: session.privacy.fraudID
        });
      }

      if (customer.registered
          && (
            !(preferences.paydock.paydockFraudType.value === 'disabledFraud')
            || !(preferences.paydock.paydock3DSType.value === 'disabled3DS')
          )
          && session.privacy.paydockSaveCard
        ) {
          var customerToken;
          var customerID;
          var billingAddress = order.getBillingAddress();

          if (preferences.paydock.paydockSaveCardMethod.value === 'customerWithGatewayID') {
            customerToken = paydockService.customers.create({
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
                gateway_id: preferences.paydock.paydockGatewayID,
                vault_token: paymentInstrument.custom.paydockVaultToken,
              }
            });
            customerID = customerToken.resource.data._id;
          }

          if (preferences.paydock.paydockSaveCardMethod.value === 'customerWithoutGatewayID') {
            customerToken = paydockService.customers.create({
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
                vault_token: paymentInstrument.custom.paydockVaultToken
              }
            });
            customerID = customerToken.resource.data._id;
          }

          if (!empty(customerID)) {
            var paymentInstrs = customer.getProfile().getWallet().paymentInstruments;
            var paymentInstr = array.find(paymentInstrs, function (item) {
                return paymentInstrument.custom.paydockVaultToken === item.custom.paydockVaultToken;
            });

            if (!empty(paymentInstr)) {
              Transaction.wrap(function () {
                paymentInstr.custom.paydockCustomerID = customerID;
              });
            }
          }
      }
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

      if (request.httpParameterMap.threeDSToken && request.httpParameterMap.threeDSToken.stringValue) {
        paymentInstrument.custom.paydockCharge3DSToken = request.httpParameterMap.threeDSToken.stringValue;
      }

      if (chargeResult) {
        paymentInstrument.custom.paydockChargeStatus = chargeResult.resource.data.status;
  
        if (chargeResult.resource.data._id) {
          paymentInstrument.custom.paydockChargeID = chargeResult.resource.data._id;
          order.custom.paydockChargeID = chargeResult.resource.data._id;
          var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
          order.custom.paydockPaymentMethod = paymentMethod.getName();
          paymentInstrument.paymentTransaction.setTransactionID(chargeResult.resource.data._id);
        }
    
        if (chargeResult.resource.data.status === 'complete') {
          order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        }
  
        // update Paydock Payment Instrument with charge details
        paydockCheckoutHelper.updatePaydockPaymentInstrumentWithChargeDetails(paymentInstrument, chargeResult);
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
    && billingData.paymentInformation.paydockSaveCard
    && (billingData.paymentMethod.value === 'PAYDOCK')
    && empty(billingData.storedPaymentUUID)
  ) {
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var wallet = customer.getProfile().getWallet();
    var paymentInstr = basket.paymentInstrument;
    var storedPaymentCollection = wallet.getPaymentInstruments(billingData.paymentMethod.value);
    var alreadyExistingPaymentInstrument = collections.find(storedPaymentCollection, function (item) {
      return item.custom.paydockCardDetails === paymentInstr.custom.paydockCardDetails;
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

      if (paymentInstr.custom.paydockVaultToken) {
        storedPaymentInstrument.custom.paydockVaultToken = paymentInstr.custom.paydockVaultToken;
      }

      if (paymentInstr.custom.paydockCustomerID) {
        storedPaymentInstrument.custom.paydockCustomerID = paymentInstr.custom.paydockCustomerID;
      }

      if (paymentInstr.custom.paydockCardDetails) {
        storedPaymentInstrument.custom.paydockCardDetails = paymentInstr.custom.paydockCardDetails;
      }
    });
  }
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
