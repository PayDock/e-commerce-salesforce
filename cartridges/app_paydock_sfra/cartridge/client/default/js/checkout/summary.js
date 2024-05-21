'use strict';

var baseSummary = require('base/checkout/summary');

function paydockWalletButtonsWidgetInit() {
    // early returns
    if (typeof paydock === 'undefined' || !paydock) return;

    if (['PAYDOCK_WALLET_BUTTONS_APPLE_PAY', 'PAYDOCK_WALLET_BUTTONS_GOOGLE_PAY', 'PAYDOCK_WALLET_BUTTONS_PAYPAL', 'PAYDOCK_WALLET_BUTTONS_AFTERPAY'].indexOf($('.payment-information').data('payment-method-id')) === -1) return;
    
    var paydockWalletButtonsWidgets = document.getElementsByClassName('paydockWalletButtonsWidget');

    if (!paydockWalletButtonsWidgets) return;

    for (var i = 0; i < paydockWalletButtonsWidgets.length; i++) {
        var paydockWalletButtonsWidget = paydockWalletButtonsWidgets[i]; // shortcut

        var paydockWalletButtonsToken = paydockWalletButtonsWidget.dataset.walletButtonsToken;
        var paydockWalletButtonsAmountLabel = paydockWalletButtonsWidget.dataset.walletButtonsAmountLabel;
        var paydockWalletButtonsCountry = paydockWalletButtonsWidget.dataset.walletButtonsCountry;
        var paydockWalletButtonsPayLater = paydockWalletButtonsWidget.dataset.walletButtonsPayLater;

        if (paydockWalletButtonsToken) {
            var button = new paydock.WalletButtons(
                '#' + paydockWalletButtonsWidget.id,
                paydockWalletButtonsToken,
                {
                    amount_label: paydockWalletButtonsAmountLabel,
                    country: paydockWalletButtonsCountry,
                    pay_later: paydockWalletButtonsPayLater
                }
            );

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

function paydockCheckoutButtonAfterpayWidgetInit() {
    // early returns
    if (typeof paydock === 'undefined' || !paydock) return;

    if ($('.payment-information').data('payment-method-id') !== 'PAYDOCK_CHECKOUT_BUTTON_AFTERPAY') return;

    var paydockCheckoutButton = document.getElementById('paydockCheckoutButtonAfterpay');

    if (!paydockCheckoutButton) return;

    var paydockPublicKey = paydockCheckoutButton.dataset.publicKey;
    var paydockGatewayId = paydockCheckoutButton.dataset.gatewayId;
    var paydockMeta = paydockCheckoutButton.dataset.meta;
    var paydockTokenNameSelector = 'input[name="payment_source_token_afterpay"]';
    var paydockTokenNameElement = paydockTokenNameSelector ? document.querySelector(paydockTokenNameSelector) : null;

    try {
        paydockMeta = JSON.parse(paydockMeta);
    }
    catch (e) {
        paydockMeta = null;
    }

    if (paydockPublicKey && paydockGatewayId && paydockTokenNameElement && paydockMeta) {
        var button = new paydock.AfterpayCheckoutButton(
            '#paydockCheckoutButtonAfterpay',
            paydockPublicKey,
            paydockGatewayId
        );

        button.onFinishInsert(paydockTokenNameSelector, 'payment_source_token_afterpay');

        button.showEnhancedTrackingProtectionPopup(true);

        button.setMeta(paydockMeta);

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

function paydockCheckoutButtonZipMoneyWidgetInit() {
    // early returns
    if (typeof paydock === 'undefined' || !paydock) return;

    if ($('.payment-information').data('payment-method-id') !== 'PAYDOCK_CHECKOUT_BUTTON_ZIPMONEY') return;

    var paydockCheckoutButton = document.getElementById('paydockCheckoutButtonZipMoney');

    if (!paydockCheckoutButton) return;

    var paydockPublicKey = paydockCheckoutButton.dataset.publicKey;
    var paydockGatewayId = paydockCheckoutButton.dataset.gatewayId;
    var paydockMeta = paydockCheckoutButton.dataset.meta;
    var paydockTokenNameSelector = 'input[name="payment_source_token_zipmoney"]';
    var paydockTokenNameElement = paydockTokenNameSelector ? document.querySelector(paydockTokenNameSelector) : null;

    try {
        paydockMeta = JSON.parse(paydockMeta);
    }
    catch (e) {
        paydockMeta = null;
    }

    if (paydockPublicKey && paydockGatewayId && paydockTokenNameElement && paydockMeta) {
        var button = new paydock.ZipmoneyCheckoutButton(
            '#paydockCheckoutButtonZipMoney',
            paydockPublicKey,
            paydockGatewayId
        );

        button.onFinishInsert(paydockTokenNameSelector, 'payment_source_token_zipmoney');

        button.setMeta(paydockMeta);

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

function paydock3DSCanvasWidgetInit() {
  // early returns
  if (typeof paydock === 'undefined' || !paydock) return;

  if ($('.payment-information').data('payment-method-id') !== 'PAYDOCK') return;

  var paydock3DSWidget = document.getElementById("paydock3DSCanvasWidget");
  var threeDSWidgetType = $('.payment-details').attr('data-three-ds-type');

  if (!paydock3DSWidget) return;

  var canvasToken = paydock3DSWidget.dataset.canvasToken;

  if (canvasToken && canvasToken.length > 0) {
      var canvas = new paydock.Canvas3ds('#paydock3DSCanvasWidget', canvasToken);

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
        paydockWalletButtonsWidgetInit: paydockWalletButtonsWidgetInit,
        paydockCheckoutButtonAfterpayWidgetInit: paydockCheckoutButtonAfterpayWidgetInit,
        paydockCheckoutButtonZipMoneyWidgetInit: paydockCheckoutButtonZipMoneyWidgetInit,
        paydock3DSCanvasWidgetInit: paydock3DSCanvasWidgetInit
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

