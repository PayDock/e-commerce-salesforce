'use strict';

var baseBilling = require('base/checkout/billing');
var paydockWidget;

function paydockWidgetInit() {
    // early returns
    if (typeof paydock === 'undefined' || !paydock) return;

    var paydockPublicKey = document.getElementById("paydockWidget").dataset.publicKey;
    var paydockGatewayId = document.getElementById("paydockWidget").dataset.gatewayId;
    var paydockTokenName = document.getElementById("paydockWidget").dataset.dwfrmName;
    var paydockReferenceId = document.getElementById("paydockWidget").dataset.referenceId;
    var paydockWidgetStyles = document.getElementById("paydockWidget").dataset.styles;
    var cartShemasString = document.getElementById("paydockWidget").dataset.cartScheme;
    var paydockTokenNameSelector = paydockTokenName ? 'input[name="' + paydockTokenName + '"]' : null;
    var paydockTokenNameElement = paydockTokenNameSelector ? document.querySelector(paydockTokenNameSelector) : null;

    if (paydockPublicKey && paydockGatewayId && paydockTokenNameElement) {
        paydockWidget = new paydock.HtmlWidget('#paydockWidget', paydockPublicKey, paydockGatewayId);
        var browserDetailsResp = new paydock.Api(paydockPublicKey).setEnv('production').getBrowserDetails();
        document.getElementById("paydock_browser_details").value = JSON.stringify(browserDetailsResp);
        paydockWidget.onFinishInsert(paydockTokenNameSelector, 'payment_source');

        if (paydockReferenceId) {
            paydockWidget.setRefId(paydockReferenceId);
        }

        if (paydockWidgetStyles) {
            try {
                paydockWidgetStyles = JSON.parse(paydockWidgetStyles);
                paydockWidget.setStyles(paydockWidgetStyles);   
            }
            catch (e) {
                console.log(e);
            }
        }

        if (cartShemasString) {
          var shemaArr = cartShemasString.split(',');
          paydockWidget.setSupportedCardIcons(shemaArr, true);
        }

        paydockWidget.setHiddenElements(['submit_button']);

        paydockWidget.on('afterLoad', function() {
            $(paydockTokenNameSelector).val('');
        });

        paydockWidget.on('finish', function (data) {
            $('.submit-payment').trigger('click');
        });

        paydockWidget.load();
    }
}

function paydockWidgetFormSubmit() {
    $('.submit-payment').on('click', function(e) {
        if ($('.payment-information').data('payment-method-id') === 'PAYDOCK'
          && (
            !$('.saved-payment-instrument.selected-payment').length
            || $('.user-payment-instruments').hasClass('checkout-hidden')
          )
        ) {
            var paydockTokenName = document.getElementById("paydockWidget").dataset.dwfrmName;
            var paydockTokenNameSelector = paydockTokenName ? 'input[name="' + paydockTokenName + '"]' : null;

            if (typeof paydockWidget !== 'undefined' && paydockWidget && paydockTokenNameSelector && $(paydockTokenNameSelector).length === 1 && !$(paydockTokenNameSelector).val()) {
                e.preventDefault();
                paydockWidget.trigger('submit_form');
                return false;
            }
        }
    });
}

function paydockWidgetReload() {
    if (typeof paydockWidget !== 'undefined' && paydockWidget) {
        paydockWidget.reload();
    }
}

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaydockPaymentInformation(order) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';
    var paydockWalletButtonsPaymentInstrument = null;
    var paydockCheckoutButtonAfterpayPaymentInstrument = null;
    var paydockCheckoutButtonZipMoneyPaymentInstrument = null;
    var paydockPaymentInstrument = null;

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments
        && order.billing.payment.selectedPaymentInstruments.length > 0) {
            paydockWalletButtonsPaymentInstrument = order.billing.payment.selectedPaymentInstruments.find(function(paymentInstrument) {
                return ['PAYDOCK_WALLET_BUTTONS_APPLE_PAY', 'PAYDOCK_WALLET_BUTTONS_GOOGLE_PAY', 'PAYDOCK_WALLET_BUTTONS_PAYPAL', 'PAYDOCK_WALLET_BUTTONS_AFTERPAY'].indexOf(paymentInstrument.paymentMethod) !== -1;
            });

            paydockCheckoutButtonAfterpayPaymentInstrument = order.billing.payment.selectedPaymentInstruments.find(function(paymentInstrument) {
                return paymentInstrument.paymentMethod === 'PAYDOCK_CHECKOUT_BUTTON_AFTERPAY';
            });

            paydockCheckoutButtonZipMoneyPaymentInstrument = order.billing.payment.selectedPaymentInstruments.find(function(paymentInstrument) {
                return paymentInstrument.paymentMethod === 'PAYDOCK_CHECKOUT_BUTTON_ZIPMONEY';
            });

            paydockPaymentInstrument = order.billing.payment.selectedPaymentInstruments.find(function(paymentInstrument) {
                return paymentInstrument.paymentMethod === 'PAYDOCK';
            });

            if (paydockWalletButtonsPaymentInstrument) {
                htmlToAppend = '<div '
                    + 'id="paydockWalletButtonsWidget' + paydockWalletButtonsPaymentInstrument.gatewayType + '" '
                    + 'class="paydockWalletButtonsWidget mt-2 mb-4" '
                    + 'data-wallet-buttons-token="' + paydockWalletButtonsPaymentInstrument.token + '" '
                    + 'data-wallet-buttons-amount-label="' + paydockWalletButtonsPaymentInstrument.amountLabel + '" '
                    + 'data-wallet-buttons-country="' + paydockWalletButtonsPaymentInstrument.country + '" '
                    + 'data-wallet-buttons-pay-later="' + paydockWalletButtonsPaymentInstrument.payLater + '" '
                    + '></div>';

                $('.btn.place-order').addClass('d-none');
            }
            else if (paydockCheckoutButtonAfterpayPaymentInstrument) {
                htmlToAppend = '<button '
                    + 'id="paydockCheckoutButtonAfterpay" '
                    + 'class="mt-2 mb-4" '
                    + 'style="width: 120px; background: none; border-radius: 5px;"'
                    + 'data-gateway-id="' + paydockCheckoutButtonAfterpayPaymentInstrument.gatewayId + '" '
                    + 'data-public-key="' + paydockCheckoutButtonAfterpayPaymentInstrument.publicKey + '" '
                    + (paydockCheckoutButtonAfterpayPaymentInstrument.meta ? 'data-meta=\'' + JSON.stringify(paydockCheckoutButtonAfterpayPaymentInstrument.meta) + '\' ' : '')
                    + '><svg fill="#000000" width="110px" height="80px" viewBox="0 0 14 14" role="img" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="m 1.6688886,10.40235 c -0.42637,-0.1202 -0.74189001,-0.6205 -0.65418,-1.0373 0.041,-0.1951 0.38294,-0.8122 1.68245,-3.0361 1.04718,-1.792 0.95525,-1.655 1.20332,-1.7945 0.386401,-0.2171 0.826887,-0.1384 1.14514,0.2048 0.137872,0.1486 2.135918,3.5732 2.473667,4.2397 0.290631,0.5735 0.148477,1.1013 -0.366724,1.3616 -0.232734,0.1176 -0.333307,0.1285 -1.184442,0.1285 l -0.930111,0 0,-0.7111 0,-0.711 0.356898,-0.017 c 0.308411,-0.015 0.359154,-0.033 0.3735,-0.1331 0.02511,-0.1753 -1.263565,-2.3923 -1.403135,-2.4139 -0.09093,-0.014 -0.241541,0.2064 -0.810723,1.1858 -0.78854,1.357 -0.79139,1.3726 -0.25121,1.3726 l 0.30708,0 0,0.7138 0,0.7138 -0.87083,-0.01 c -0.47896,0 -0.96077,-0.03 -1.0707,-0.062 z m 7.690946,-0.8707 c -0.119855,-0.044 -0.268399,-0.1253 -0.330098,-0.1811 -0.113886,-0.1032 -1.048273,-1.6755 -1.013003,-1.7047 0.08512,-0.071 1.132193,-0.6597 1.16991,-0.6584 0.02667,9e-4 0.119269,0.1185 0.205778,0.2609 0.25871,0.4261 0.305515,0.385 1.0776254,-0.9476 0.372933,-0.6438 0.67806,-1.1999 0.67806,-1.2359 0,-0.12 -0.171119,-0.1349 -1.5482634,-0.1349 -1.572597,0 -1.548598,-0.01 -1.289223,0.4776 0.08368,0.1568 0.14605,0.2888 0.138602,0.2931 -0.938775,0.5404 -1.148038,0.6569 -1.179698,0.6569 -0.02108,0 -0.249138,-0.3666 -0.506785,-0.8146 -0.418379,-0.7275 -0.468449,-0.8456 -0.468449,-1.105 0,-0.3212 0.136986,-0.5792 0.418189,-0.7875 0.158343,-0.1174 0.210364,-0.1195 2.91229,-0.1195 2.5679574,0 2.7624694,0.01 2.9223784,0.1048 0.360766,0.2206 0.528102,0.632 0.420755,1.0345 -0.05385,0.2019 -2.309571,4.1849 -2.574704,4.5462 -0.231194,0.3151 -0.6684764,0.4484 -1.0333644,0.3152 z"/></svg>'
                    + '</button> '
                    + '<input name="payment_source_token_afterpay" id="payment_source_token_afterpay" type="hidden" />';

                $('.btn.place-order').addClass('d-none');
            }
            else if (paydockCheckoutButtonZipMoneyPaymentInstrument) {
                htmlToAppend = '<button '
                    + 'id="paydockCheckoutButtonZipMoney" '
                    + 'class="mt-2 mb-4" '
                    + 'style="width: 120px; background: none; border-radius: 5px;" '
                    + 'data-gateway-id="' + paydockCheckoutButtonZipMoneyPaymentInstrument.gatewayId + '" '
                    + 'data-public-key="' + paydockCheckoutButtonZipMoneyPaymentInstrument.publicKey + '" '
                    + (paydockCheckoutButtonZipMoneyPaymentInstrument.meta ? 'data-meta=\'' + JSON.stringify(paydockCheckoutButtonZipMoneyPaymentInstrument.meta) + '\' ' : '')
                    + '><svg viewBox="0 0 70 36" fill="none" xmlns="http://www.w3.org/2000/svg">'
                    + '<path d="M1.57138 21.8984L2.18053 26.8613H23.5065L22.8087 21.1777H12.8655L12.7786 20.4734L21.937 14.0736L21.3251 9.10059H0L0.697879 14.7842H10.6575L10.7453 15.4949L1.57138 21.8984Z" fill="#1A0826"></path>'
                    + '<path d="M23.8027 9.10059L25.9842 26.8613H47.3267L45.1452 9.10059H23.8027Z" fill="#AA8FFF"></path>'
                    + '<path d="M69.7072 15.495C69.2151 11.5026 66.0787 9.0833 61.8165 9.10068H47.6211L49.8007 26.8605H56.1868L55.7496 23.3089H62.508C67.8285 23.3089 70.2624 19.9942 69.7072 15.495ZM61.8192 18.3304L55.1423 18.3378L54.6191 14.0755L61.3335 14.081C62.9131 14.0993 63.7208 14.9883 63.8507 16.2057C63.9311 16.9877 63.5726 18.3295 61.8192 18.3295V18.3304Z" fill="#1A0826"></path>'
                    + '<path d="M30.3076 6.81633C31.439 5.61278 31.2519 3.59906 29.8897 2.31855C28.5276 1.03804 26.5061 0.975643 25.3747 2.17919C24.2433 3.38273 24.4304 5.39646 25.7926 6.67697C27.1548 7.95748 29.1762 8.01987 30.3076 6.81633Z" fill="#1A0826"></path>'
                    + '</svg></button> '
                    + '<input name="payment_source_token_zipmoney" id="payment_source_token_zipmoney" type="hidden" />';

                $('.btn.place-order').addClass('d-none');
            }
            else if (paydockPaymentInstrument 
                      && $paymentSummary.attr('data-three-ds-type') === 'inbuilt3DS'
                      && paydockPaymentInstrument.canvasToken
                      && paydockPaymentInstrument.canvasToken.length > 0
                    ) {
                htmlToAppend = '<div '
                      + 'id="paydock3DSCanvasWidget" '
                      + 'class="mt-2 mb-4" '
                      + 'data-canvas-token="' + paydockPaymentInstrument.canvasToken + '" '
                      + '></div>';
                  
                  $('.btn.place-order').addClass('d-none');
            }
            else if (paydockPaymentInstrument
                      && $paymentSummary.attr('data-three-ds-type') === 'standalone3DS'
                      && $paymentSummary.attr('data-three-ds-flow') === 'vault'
                      && paydockPaymentInstrument.canvasToken
                      && paydockPaymentInstrument.canvasToken.length > 0
                    ) {
                htmlToAppend += '<span>' + order.resources.cardType + ' '
                    + order.billing.payment.selectedPaymentInstruments[0].type
                    + '</span><div>'
                    + order.billing.payment.selectedPaymentInstruments[0].maskedCreditCardNumber
                    + '</div><div><span>'
                    + order.resources.cardEnding + ' '
                    + order.billing.payment.selectedPaymentInstruments[0].expirationMonth
                    + '/' + order.billing.payment.selectedPaymentInstruments[0].expirationYear
                    + '</span></div>'
                    + '<div '
                    + 'id="paydock3DSCanvasWidget" '
                    + 'class="mt-2 mb-4" '
                    + 'data-canvas-token="' + paydockPaymentInstrument.canvasToken + '" '
                    + '></div>';

                    $('.btn.place-order').removeClass('d-none');
                    $('.btn.place-order').attr('disabled', true);
            }
            else {
                htmlToAppend += '<span>' + order.resources.cardType + ' '
                    + order.billing.payment.selectedPaymentInstruments[0].type
                    + '</span><div>'
                    + order.billing.payment.selectedPaymentInstruments[0].maskedCreditCardNumber
                    + '</div><div><span>'
                    + order.resources.cardEnding + ' '
                    + order.billing.payment.selectedPaymentInstruments[0].expirationMonth
                    + '/' + order.billing.payment.selectedPaymentInstruments[0].expirationYear
                    + '</span></div>';

                    $('.btn.place-order').removeClass('d-none');
            }
    }

    $paymentSummary.empty().append(htmlToAppend);
}

function selectSavedPaymentInstrument() {
    $(document).on('click', '.saved-payment-instrument', function (e) {
        e.preventDefault();
        $('.saved-payment-security-code').val('');
        $('.saved-payment-instrument').removeClass('selected-payment');
        $(this).addClass('selected-payment');
    });
}

function paymentTabs() {
    $('.payment-options .nav-item').on('click', function (e) {
        e.preventDefault();
        var methodID = $(this).data('method-id');
        $('.payment-information').data('payment-method-id', methodID);

        // accordion for items
        var tabsContent = $('.payment-options').find('.tab-pane');
        for (let i = 0; i < tabsContent.length; i++) {
            var element = tabsContent[i];
            var contentID = element.getAttribute('content-id');

            if (contentID != methodID) {
                element.classList.remove('active');
            }
        }
    });
};

var customBilling = {
    methods: {
        updatePaymentInformation: updatePaydockPaymentInformation,
        paydockWidgetInit: paydockWidgetInit,
        paydockWidgetReload: paydockWidgetReload
    },
    paydockWidgetFormSubmit: paydockWidgetFormSubmit,
    paymentTabs: paymentTabs,
    selectSavedPaymentInstrument: selectSavedPaymentInstrument
};
  
[customBilling].forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (typeof library[item] === 'object') {
            baseBilling[item] = $.extend({}, baseBilling[item], library[item]);
        } else {
            baseBilling[item] = library[item];
        }
    });
});

module.exports = baseBilling;
