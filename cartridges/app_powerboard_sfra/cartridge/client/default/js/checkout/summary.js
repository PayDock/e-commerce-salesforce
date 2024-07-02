'use strict';

var baseSummary = require('base/checkout/summary');

function powerboardWalletButtonsWidgetInit() {
    // early returns
    if (typeof cba === 'undefined' || !cba) return;

    if (['POWERBOARD_WALLET_BUTTONS_APPLE_PAY', 'POWERBOARD_WALLET_BUTTONS_GOOGLE_PAY', 'POWERBOARD_WALLET_BUTTONS_PAYPAL', 'POWERBOARD_WALLET_BUTTONS_AFTERPAY'].indexOf($('.payment-information').data('payment-method-id')) === -1) return;
    
    var powerboardWalletButtonsWidgets = document.getElementsByClassName('powerboardWalletButtonsWidget');

    if (!powerboardWalletButtonsWidgets) return;

    for (var i = 0; i < powerboardWalletButtonsWidgets.length; i++) {
        var powerboardWalletButtonsWidget = powerboardWalletButtonsWidgets[i]; // shortcut

        var powerboardWalletButtonsToken = powerboardWalletButtonsWidget.dataset.walletButtonsToken;
        var powerboardWalletButtonsAmountLabel = powerboardWalletButtonsWidget.dataset.walletButtonsAmountLabel;
        var powerboardWalletButtonsCountry = powerboardWalletButtonsWidget.dataset.walletButtonsCountry;
        var powerboardWalletButtonsPayLater = powerboardWalletButtonsWidget.dataset.walletButtonsPayLater;

        var powerboardWalletButtonsEnv = powerboardWalletButtonsWidget.dataset.env;
        powerboardWalletButtonsEnv = ['sandbox', 'production'].indexOf(powerboardWalletButtonsEnv) !== -1 ?
            powerboardWalletButtonsEnv :
            'sandbox';

        if (powerboardWalletButtonsToken) {
            var button = new cba.WalletButtons(
                '#' + powerboardWalletButtonsWidget.id,
                powerboardWalletButtonsToken,
                {
                    amount_label: powerboardWalletButtonsAmountLabel,
                    country: powerboardWalletButtonsCountry,
                    pay_later: powerboardWalletButtonsPayLater
                }
            );

            button.setEnv(powerboardWalletButtonsEnv === 'sandbox' ? 'preproduction_cba' : 'production_cba');

            button.onPaymentSuccessful(function (data) {
                $('.btn.place-order').trigger('click');
            });
            button.onPaymentError(function (data) {
                $('.btn.place-order').trigger('click');
            });
            button.onPaymentInReview(function (data) {
                $('.btn.place-order').trigger('click');
            });

            button.load();
        }
    }
}

function powerboardCheckoutButtonAfterpayWidgetInit() {
    // early returns
    if (typeof cba === 'undefined' || !cba) return;

    if ($('.payment-information').data('payment-method-id') !== 'POWERBOARD_CHECKOUT_BUTTON_AFTERPAY') return;

    var powerboardCheckoutButton = document.getElementById('powerboardCheckoutButtonAfterpay');

    if (!powerboardCheckoutButton) return;

    var powerboardPublicKey = powerboardCheckoutButton.dataset.publicKey;
    var powerboardGatewayId = powerboardCheckoutButton.dataset.gatewayId;
    var powerboardMeta = powerboardCheckoutButton.dataset.meta;
    var powerboardTokenNameSelector = 'input[name="payment_source_token_afterpay"]';
    var powerboardTokenNameElement = powerboardTokenNameSelector ? document.querySelector(powerboardTokenNameSelector) : null;

    var powerboardCheckoutButtonEnv = powerboardCheckoutButton.dataset.env;
    powerboardCheckoutButtonEnv = ['sandbox', 'production'].indexOf(powerboardCheckoutButtonEnv) !== -1 ?
        powerboardCheckoutButtonEnv :
        'sandbox';

    try {
        powerboardMeta = JSON.parse(powerboardMeta);
    }
    catch (e) {
        powerboardMeta = null;
    }

    if (powerboardPublicKey && powerboardGatewayId && powerboardTokenNameElement && powerboardMeta) {
        var button = new cba.AfterpayCheckoutButton(
            '#powerboardCheckoutButtonAfterpay',
            powerboardPublicKey,
            powerboardGatewayId
        );

        button.setEnv(powerboardCheckoutButtonEnv === 'sandbox' ? 'preproduction_cba' : 'production_cba');

        button.onFinishInsert(powerboardTokenNameSelector, 'payment_source_token_afterpay');

        button.showEnhancedTrackingProtectionPopup(true);

        button.setMeta(powerboardMeta);

        button.on('finish', function (data) {
            var action = $('.btn.place-order').data('action');

            if (action.indexOf('?') === -1) {
                $('.btn.place-order').data('action', action + '?pst=' + data.payment_source_token);
            }
            else {
                $('.btn.place-order').data('action', action + '&pst=' + data.payment_source_token);
            }

            $('.btn.place-order').trigger('click');
        });
    }
}

function powerboardCheckoutButtonZipMoneyWidgetInit() {
    // early returns
    if (typeof cba === 'undefined' || !cba) return;

    if ($('.payment-information').data('payment-method-id') !== 'POWERBOARD_CHECKOUT_BUTTON_ZIPMONEY') return;

    var powerboardCheckoutButton = document.getElementById('powerboardCheckoutButtonZipMoney');

    if (!powerboardCheckoutButton) return;

    var powerboardPublicKey = powerboardCheckoutButton.dataset.publicKey;
    var powerboardGatewayId = powerboardCheckoutButton.dataset.gatewayId;
    var powerboardMeta = powerboardCheckoutButton.dataset.meta;
    var powerboardTokenNameSelector = 'input[name="payment_source_token_zipmoney"]';
    var powerboardTokenNameElement = powerboardTokenNameSelector ? document.querySelector(powerboardTokenNameSelector) : null;

    var powerboardCheckoutButtonEnv = powerboardCheckoutButton.dataset.env;
    powerboardCheckoutButtonEnv = ['sandbox', 'production'].indexOf(powerboardCheckoutButtonEnv) !== -1 ?
        powerboardCheckoutButtonEnv :
        'sandbox';

    try {
        powerboardMeta = JSON.parse(powerboardMeta);
    }
    catch (e) {
        powerboardMeta = null;
    }

    if (powerboardPublicKey && powerboardGatewayId && powerboardTokenNameElement && powerboardMeta) {
        var button = new cba.ZipmoneyCheckoutButton(
            '#powerboardCheckoutButtonZipMoney',
            powerboardPublicKey,
            powerboardGatewayId
        );

        button.setEnv(powerboardCheckoutButtonEnv === 'sandbox' ? 'preproduction_cba' : 'production_cba');

        button.onFinishInsert(powerboardTokenNameSelector, 'payment_source_token_zipmoney');

        button.setMeta(powerboardMeta);

        button.on('finish', function (data) {
            var action = $('.btn.place-order').data('action');

            if (action.indexOf('?') === -1) {
                $('.btn.place-order').data('action', action + '?pst=' + data.payment_source_token);
            }
            else {
                $('.btn.place-order').data('action', action + '&pst=' + data.payment_source_token);
            }

            $('.btn.place-order').trigger('click');
        });
    }
}

function powerboard3DSCanvasWidgetInit() {
  // early returns
  if (typeof cba === 'undefined' || !cba) return;

  if ($('.payment-information').data('payment-method-id') !== 'POWERBOARD') return;

  var powerboard3DSWidget = document.getElementById("powerboard3DSCanvasWidget");
  var threeDSWidgetType = $('.payment-details').attr('data-three-ds-type');

  if (!powerboard3DSWidget) return;

  var canvasToken = powerboard3DSWidget.dataset.canvasToken;

  if (canvasToken && canvasToken.length > 0) {
      var canvas = new cba.Canvas3ds('#powerboard3DSCanvasWidget', canvasToken);

      canvas.on('chargeAuthSuccess', function (data) {
          var existingData = $('.btn.place-order').attr("data-action");
          var newData = existingData + '?threeDSToken=' + data.charge_3ds_id;
          $('.btn.place-order').attr('data-action', newData);
          if (threeDSWidgetType === 'inbuilt3DS') {
            $('.btn.place-order').trigger('click');
          } else {
            $('.btn.place-order').removeAttr('disabled')
          }
      });

      canvas.on('chargeAuthReject', function (data) {
          console.log('chargeAuthReject', data);
      });

      canvas.load();
  }
}

var customSummary = {
    methods: {
        powerboardWalletButtonsWidgetInit: powerboardWalletButtonsWidgetInit,
        powerboardCheckoutButtonAfterpayWidgetInit: powerboardCheckoutButtonAfterpayWidgetInit,
        powerboardCheckoutButtonZipMoneyWidgetInit: powerboardCheckoutButtonZipMoneyWidgetInit,
        powerboard3DSCanvasWidgetInit: powerboard3DSCanvasWidgetInit
    }
};
  
[customSummary].forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (typeof library[item] === 'object') {
            baseSummary[item] = $.extend({}, baseSummary[item], library[item]);
        } else {
            baseSummary[item] = library[item];
        }
    });
});
  
module.exports = baseSummary;

