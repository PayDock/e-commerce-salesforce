'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Site = require('dw/system/Site');
const System = require('dw/system/System');

var preferences = require('*/cartridge/config/preferences');

/**
 * Traverses a payload object to collect parameters and values to be passed
 * as key/value pairs either as query string or application/x-www-form-urlencoded
 * body.
 *
 * @param {Object} collector - An object to collect key/value pairs. Must provide
 *   addParam(name, value) method. Could be dw.svc.Service.
 * @param {Object} payload - Payload to collect parameters from. Can be acutal
 *   payload or an object containing query string parameters.
 * @param {string} prefix - Prefix to append to parameter names. Used recursively,
 *   not needed for the intial call.
 */
function collectParams(collector, payload, prefix) {
	// params normalization
	prefix = prefix || '';

    if (payload && typeof payload === 'object') {
        Object.entries(payload).forEach(([key, value]) => {
            let paramName = prefix ? `${prefix}[${Array.isArray(payload) ? '' : key}]` : key;
            let paramValue = value ? value : '';

            if (typeof paramValue === 'object') {
                collectParams(collector, paramValue, paramName);
            } else {
                collector.addParam(paramName, paramValue);
            }
        });
    }
}

/**
 * Creates a Local Services Framework service definition
 *
 * @returns {dw.svc.Service} - The created service definition.
 */
function getPowerboardServiceDefinition() {
	return LocalServiceRegistry.createService('powerboard.http.service', {
		createRequest: function (svc, requestObject) {
			const apiSecretKey = preferences.powerboard.powerboardPrivateAPIKey;

			if (preferences.powerboard.powerboardConnectionType.value === 'powerboardKey') {
				svc.addHeader('x-user-secret-key', apiSecretKey);
			} else {
				svc.addHeader('x-access-token', apiSecretKey);
			}

			var sfccHeader = 'V' + preferences.powerboard.version + '_B2C_' + System.getCompatibilityMode();
			svc.addHeader('X-Salesforce-Meta', sfccHeader);
			svc.addHeader("Content-Type", "application/json");

			var URL = svc.configuration.credential.URL;
			URL += requestObject.endpoint;

			svc.setURL(URL);

			if (requestObject.httpMethod) {
				svc.setRequestMethod(requestObject.httpMethod);
			}

			if (requestObject.queryString) {
				collectParams(svc, requestObject.queryString);
			}

			if (requestObject.payload) {
				return JSON.stringify(requestObject.payload);
			}

			return null;
		},

		/**
		 * A callback function to parse PowerBoard web service response
		 *
		 * @param {dw.svc.Service} svc - Service instance
		 * @param {dw.net.HTTPClient} httpClient - HTTP client instance
		 * @returns {string} - Response body in case of a successful request or null
		 */
		parseResponse: function (svc, httpClient) {
			return JSON.parse(httpClient.text);
		},

		/**
		 * A callback function to filter PowerBoard web service communication messaging
		 *
		 * @param {string} msg - Communication message
		 * @returns {string} - Filtered communication message
		 */
		filterLogMessage: function(msg) {
			return msg.replace(/CreditCardNo\: \".*?\"/, "CreditCardNo:********");
		}
	});
}


/**
 * Makes a call to PowerBoard web service given a request object.
 * Throws an error (PowerBoardServiceError, which will have the call dw.svc.Result
 * object in callResult property) in case the result of a call is not ok.
 *
 * @param {Object} requestObject - An object having details for the request to
 *   be made, including endpoint, payload etc.
 * @return {dw.svc.Result} - Result returned by the call.
 */
function callService(requestObject) {
	if (!requestObject) {
		throw new Error('Required requestObject parameter missing or incorrect.');
	}

	var callResult = getPowerboardServiceDefinition().call(requestObject);

	if (!callResult.ok) {
		var errorMessage = callResult.errorMessage;

		try {
			errorMessage = JSON.parse(callResult.errorMessage);
			errorMessage = errorMessage.error.message;
		}
		catch (e) {
			errorMessage = callResult.errorMessage;
		}

		throw new Error(errorMessage);
	}

	return callResult.object;
}

module.exports.call = callService;

module.exports.tokens = {
	create: function(tokenPayload) {
		var requestObject = {
			endpoint: '/v1/payment_sources/tokens',
			httpMethod: 'POST',
			payload: tokenPayload
		};

		return callService(requestObject);
	}
};

module.exports.vaults = {
	create: function(vaultPayload) {
		var requestObject = {
			endpoint: '/v1/vault/payment_sources',
			httpMethod: 'POST',
			payload: vaultPayload
		};

		return callService(requestObject);
	}
};

module.exports.charges = {
	get: function(chargeId) {
		var requestObject = {
			endpoint: '/v1/charges/' + chargeId,
			httpMethod: 'GET'
		};

		return callService(requestObject);
	},
	create: function(chargePayload, chargeCapture) {
		var requestObject = {
			endpoint: '/v1/charges',
			httpMethod: 'POST',
			payload: chargePayload,
      		queryString: {
        		capture: (!!chargeCapture).toString()
			}
		};

		return callService(requestObject);
	},
	refund: function(chargeId, refundPayload) {
		var requestObject = {
			endpoint: '/v1/charges/' + chargeId + '/refunds',
			httpMethod: 'POST',
			payload: refundPayload
		};

		return callService(requestObject);
	},
	capture: function(chargeId, capturePayload) {
		var requestObject = {
			endpoint: '/v1/charges/' + chargeId + '/capture',
			httpMethod: 'POST',
			payload: capturePayload
		};

		return callService(requestObject);
	},
	wallet: function(chargePayload, chargeCapture) {
		var requestObject = {
			endpoint: '/v1/charges/wallet',
			httpMethod: 'POST',
			payload: chargePayload,
			queryString: {
				capture: (!!chargeCapture).toString()
			}
		};
		
		return callService(requestObject);
	},
	fraud: function(fraudPayload) {
		var requestObject = {
			endpoint: '/v1/charges/fraud',
			httpMethod: 'POST',
			payload: fraudPayload
		};

		return callService(requestObject);
	},
	cancel: function(chargeId) {
		var requestObject = {
			endpoint: '/v1/charges/' + chargeId + '/capture',
			httpMethod: 'DELETE'
		};

		return callService(requestObject);
	},
	archive: function(chargeId) {
		var requestObject = {
			endpoint: '/v1/charges/' + chargeId,
			httpMethod: 'DELETE'
		};
		
		return callService(requestObject);
	},
	attachFraud: function(chargeId, fraudPayload) {
		var requestObject = {
			endpoint: '/v1/charges/' + chargeId + '/fraud/attach',
			httpMethod: 'POST',
			payload: fraudPayload
		};

		return callService(requestObject);
	},
  preAuth: function (payload) {
    var requestObject = {
			endpoint: '/v1/charges/3ds',
			httpMethod: 'POST',
			payload: payload
		};

		return callService(requestObject);
  },
  standalone3DS: function (payload) {
    var requestObject = {
			endpoint: '/v1/charges/standalone-3ds',
			httpMethod: 'POST',
			payload: payload
		};

		return callService(requestObject);
  }
};

module.exports.customers = {
	create: function(customersPayload) {
		var requestObject = {
			endpoint: '/v1/customers',
			httpMethod: 'POST',
			payload: customersPayload
		};

		return callService(requestObject);
	}
};
