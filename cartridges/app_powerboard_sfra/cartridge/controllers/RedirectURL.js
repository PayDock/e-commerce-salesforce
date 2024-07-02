'use strict';

/**
 * @namespace RedirectURL
 */

var server = require('server');

server.extend(module.superModule);

/**
 * RedirectURL-Start : The RedirectURL-Start endpoint handles URL redirects
 * @name Base/RedirectURL-Start
 * @function
 * @memberof RedirectURL
 * @param {category} - non-sensitive
 * @param {serverfunction} - get
 */
server.replace('Start', function (req, res, next) {
    var URLRedirectMgr = require('dw/web/URLRedirectMgr');

    var redirect = URLRedirectMgr.redirect;
    var location = redirect ? redirect.location : null;
    var redirectStatus = redirect ? redirect.getStatus() : null;

    if (
        (URLRedirectMgr.getRedirectOrigin() === '/.well-known/apple-developer-merchantid-domain-association.txt') ||
        (
            !empty(request.httpHeaders["x-is-path_info"]) &&
            (
                request.httpHeaders['x-is-path_info'] == 'apple-developer-merchantid-domain-association.txt' ||
                request.httpHeaders['x-is-path_info'] == '.well-known/apple-developer-merchantid-domain-association.txt' ||
                request.httpHeaders['x-is-path_info'] == '/.well-known/apple-developer-merchantid-domain-association.txt'
            )
        )
    ) {
        res.render('apple-developer-merchantid-domain-association');
    }
    else {
        if (!location) {
            res.setStatusCode(404);
            res.render('error/notFound');
        } else {
            if (redirectStatus) {
                res.setRedirectStatus(redirectStatus);
            }
            res.redirect(location);
        }
    }

    next();
});

module.exports = server.exports();
