/*
 * ISC License
 *
 * Copyright (c) 2024 idnovate.com
 * idnovate is a Registered Trademark & Property of idnovate.com, innovación y desarrollo SCP
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 *
 * @author    idnovate
 * @copyright 2024 idnovate
 * @license   https://www.isc.org/licenses/ https://opensource.org/licenses/ISC ISC License
 */
var cookiesPlusBlockedScripts = cookiesPlusBlockedScripts || [];

var cookieGdpr = {
    init: function () {
        this.loadedScriptsCount = 0;
        this.loadedScriptsTotal = 0;
        this.consentsGiven = 0;

        if (document.cookie.indexOf('cookiesplus=') === -1) {
            // cookiesplus cookie doesn't exist, initialize it
            // cookiesplusVars = [];
            // cookiesplusVars['C_P_DISPLAY_MODAL'] = false;

            if (typeof C_P_EXPIRY === 'undefined') {
                console.log('%cC_P_EXPIRY is not defined', 'background: red; color: white');
                return;
            }

            var expireTime = new Date();
            expireTime.setDate(expireTime.getDate() + C_P_EXPIRY);
            var expires = "expires=" + expireTime.toUTCString();

            var cookieString = "cookiesplus={}; " + expires + "; path=/; SameSite=" + PS_COOKIE_SAMESITE + ";";

            if (PS_COOKIE_SECURE === 1) {
                cookieString += " Secure;";
            }

            document.cookie = cookieString;
        }

        // mode DIVs before </body>
        $('.cookiesplus-move').appendTo(document.body);

        let cookiesplusVars = cookieGdpr.tryParseJSONObject(decodeURIComponent(cookieGdpr.getCookiesPlusCookieValue('cookiesplus')));

        // Initialize values
        if (typeof cookiesplusVars.consents === 'object' && cookiesplusVars.consents !== null) {
            cookiesplusFinalities = Object.keys(cookiesplusVars.consents).filter(v => v.startsWith('cookiesplus-finality'));

            this.consentsGiven = false;
            var self = this; // Store reference to 'this'
            cookiesplusFinalities.forEach(function (key) {
                self.consentsGiven = true;
                if (cookiesplusVars.consents[key] === 'on') {
                    $("label[for='" + key + '-' + cookiesplusVars.consents[key] + "']").click()
                }
            })
        }

        cookieGdpr.removeCookies();

        cookieGdpr.loadJs();
        cookieGdpr.executeScriptsAndCss();
        //cookieGdpr.executeCustomScripts();

        // Don't display modal in Cookies CMS
        if ($('body#cms').length) {
            id = $('body#cms').attr('class').match(/cms-[\w-]*\b/);
            if (id) {
                id = id[0].replace(/[^0-9]/gi, '');
                if (typeof cookiesplusVars.C_P_CMS_PAGE !== 'undefined'
                    && (typeof cookiesplusVars.C_P_CMS_PAGE === id)) {
                    return;
                }
            }
        }

        if (typeof cookiesplusVars.C_P_DISPLAY_MODAL === 'undefined'
            || (typeof cookiesplusVars.C_P_DISPLAY_MODAL !== 'undefined'
                && cookiesplusVars.C_P_DISPLAY_MODAL == true)) {
            cookieGdpr.displayModal();
        }

    },
    displayModal: function () {
        if (typeof $.uniform !== "undefined" && typeof $.uniform.update !== "undefined") {
            $.uniform.update(".cookiesplus-finality-checkbox");
            $.uniform.restore(".cookiesplus-finality-checkbox");
        }

        if (typeof C_P_FINALITIES_COUNT === 'undefined'
            || C_P_FINALITIES_COUNT <= 1) {
            console.log('%cC_P_FINALITIES_COUNT is empty', 'background: red; color: white');
            return;
        }

        if (typeof C_P_NOT_AVAILABLE_OUTSIDE_EU !== 'undefined'
            && C_P_NOT_AVAILABLE_OUTSIDE_EU === 0) {
            console.log('%cC_P_NOT_AVAILABLE_OUTSIDE_EU', 'background: red; color: white');
            return;
        } else {
            this.displayOverlay();

            $('.cookiesplus-actions .first-layer').show();

            $('.cookiesplus-finalities').hide();
            $('.cookiesplus-actions .second-layer').hide();

            $('#cookiesplus-modal .cookiesplus-close-and-save').show();
            $('#cookiesplus-modal .cookiesplus-close').hide();

            $('#cookiesplus-modal').fadeIn('fast');
        }

        // this.checkEvenDimensions('#cookiesplus-modal');
        /*$(window).resize(function () {
            cookieGdpr.checkEvenDimensions('#cookiesplus-modal');
        });*/
    },
    displayModalAdvanced: function (fromFirstLayer) {
        if (typeof $.uniform !== "undefined" && typeof $.uniform.update !== "undefined") {
            $.uniform.update(".cookiesplus-finality-checkbox");
            $.uniform.restore(".cookiesplus-finality-checkbox");
        }

        /*if (C_P_FINALITIES_COUNT === 0) {
            return;
        }*/
        this.displayOverlay();

        if (typeof C_P_NOT_AVAILABLE_OUTSIDE_EU !== 'undefined'
            && C_P_NOT_AVAILABLE_OUTSIDE_EU === 0) {
            $('#cookiesplus-modal-not-available').fadeIn('fast');
             $('#cookiesplus-overlay').click(function() {
                cookieGdpr.close();
             })
        } else {
            $('#cookiesplus-modal').fadeIn('fast');

            $('.cookiesplus-actions .first-layer').hide();

            $('.cookiesplus-finalities').show();
            $('.cookiesplus-actions .second-layer').show();

            if (!fromFirstLayer) {
                $('#cookiesplus-modal .cookiesplus-close-and-save').hide();
                $('#cookiesplus-modal .cookiesplus-close').show();
            }
        }

        // this.checkEvenDimensions('#cookiesplus-modal');
    },
    save: function () {
        return cookieGdpr.sendForm();
    },
    acceptAllCookies: function () {
        $('input:radio:not(:disabled)[name^=cookiesplus-finality-][value=on]').prop('checked', true);

        return cookieGdpr.sendForm();
    },
    rejectAllCookies: function () {
        $('input:radio:not(:disabled)[name^=cookiesplus-finality-][value=off]').prop('checked', true);

        return cookieGdpr.sendForm();
    },
    displayOverlay: function () {
        if (typeof C_P_OVERLAY !== 'undefined'
            && C_P_OVERLAY === '1') {
            $('#cookiesplus-overlay').fadeIn('fast');
            $('#cookiesplus-overlay').css('background-color', 'rgba(0, 0, 0, ' + C_P_OVERLAY_OPACITY + ')');
        }
        $('#cookiesplus-overlay').click(function(){
            cookieGdpr.shake($('#cookiesplus-modal'), 4, 2, 20);
        });
    },
    close: function () {
        $('#cookiesplus-modal, #cookiesplus-modal-not-available, #cookiesplus-overlay').hide();
        // $('.cookiesplus-save').prop('disabled', true);
    },
    checkEvenDimensions: function (div) {
        // $(div).css('height', '');
        var styleObject = $(div).prop('style');
        styleObject.removeProperty('height');
        if ($(div).height() % 2 === 1) {
            $(div).height(2 * Math.round(($(div).height() - 1) / 2));
        }

        styleObject.removeProperty('width');
        $(div).css('width', '');
        if ($(div).width() % 2 === 1) {
            $(div).width(2 * Math.round(($(div).width() - 1) / 2));
        }
    },
    shake: function (div, shakes, distance, duration) {
        if (shakes > 0) {
            div.each(function () {
                var $el = $(this);
                var left = $el.css('left');
                $el.animate({left: "-=" + distance}, duration, function () {
                    $el.animate({left: "+=" + distance * 2}, duration, function () {
                        $el.animate({left: left}, duration, function () {
                            cookieGdpr.shake($el, shakes - 1, distance, duration);
                        });
                    });
                });
            });
        }
    },
    sendForm: function() {
        this.consentsGiven = true;

        // Read cookie value
        let cookiesplusVars = cookieGdpr.tryParseJSONObject(decodeURIComponent(cookieGdpr.getCookiesPlusCookieValue('cookiesplus')));

        if (cookiesplusVars instanceof Array) {
            cookiesplusVars = Object.assign({}, cookiesplusVars);
        }

        // Save new info
        cookiesplusVars['C_P_DISPLAY_MODAL'] = false;

        cookiesplusVars['consents'] = {};
        $('#cookiesplus-form input:checked').each(function() {
            cookiesplusVars['consents'][$(this).attr('name')] = $(this).val();
        });

        cookiesplusVars['consent_date'] = C_P_DATE;

        var expireTime = new Date();
        expireTime.setDate(expireTime.getDate() + C_P_EXPIRY);
        var expires = "expires=" + expireTime.toUTCString();

        var cookieString = "cookiesplus=" + encodeURIComponent(JSON.stringify(cookiesplusVars)) + "; " + expires + "; path=/; SameSite=" + PS_COOKIE_SAMESITE + ";";

        if (PS_COOKIE_SECURE === 1) {
            cookieString += " Secure;";
        }

        document.cookie = cookieString;

        cookieGdpr.removeCookies();

        if (typeof C_P_REFRESH !== 'undefined'
            && !C_P_REFRESH) {
            $.ajax({
                type: "POST",
                cache : false,
                async : true,
                url : $('#cookiesplus-form').attr('action'),
                data: 'saveCookiesPlusPreferences=&ajax=1&'+$('#cookiesplus-form').serialize(),
                dataType: 'json',
                headers: {
                    "cache-control": "no-cache"
                },
                success: function(data) {
                    if (data.consent_link && data.consent_hash) {
                        $('.cookiesplus-consent-hash a').attr('href', data.consent_link);
                        $('.cookiesplus-consent-hash a').text(data.consent_hash);
                        $('.cookiesplus-consent-hash').show();

                        cookiesplusVars['consent_hash'] = data.consent_hash;

                        var cookieString = "cookiesplus=" + encodeURIComponent(JSON.stringify(cookiesplusVars)) + "; " + expires + "; path=/; SameSite=" + PS_COOKIE_SAMESITE + ";";

                        if (PS_COOKIE_SECURE === 1) {
                            cookieString += " Secure;";
                        }

                        document.cookie = cookieString;
                    }

                    /*var d = new Date();
                    d.setTime(d.getTime() + (365 * 1000));
                    var expires = "expires=" + d.toUTCString();*/
                    // document.cookie = "cookiesplus=" + data.cookie + "; " + expires + ";path=/";

                    cookieGdpr.loadJs();
                    cookieGdpr.executeScriptsAndCss();
                    //cookieGdpr.executeCustomScripts();
                    cookieGdpr.fireGTMEvents();
                    //cookieGdpr.fireFBPixel();
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    console.log(errorThrown);
                }
            });

            cookieGdpr.close();

            return false;
        } else {
            cookieGdpr.close();

            return true;
        }
    },
    removeCookies : function() {
        $('#cookiesplus-form input:checked').each(function() {
            if ($(this).val() !== 'on') {
                // Save preferences
                let finalityId = $(this).data('finality-id');
                if (typeof C_P_THEOBJECT[finalityId] !== 'undefined'
                    && typeof C_P_THEOBJECT[finalityId].cookies !== 'undefined') {
                    Object.keys(C_P_THEOBJECT[finalityId].cookies).forEach(function (key) {
                        if (C_P_THEOBJECT[finalityId].cookies[key].name.includes('#')) {
                            let cookieValue = C_P_THEOBJECT[finalityId].cookies[key].name;
                            let hashIndex = cookieValue.indexOf("#");
                            let prefix = cookieValue.substr(0, hashIndex);
                            let suffix = cookieValue.substr(hashIndex + 1);
                            console.log('Removing cookies starting with ' + prefix + ' and ending with ' + suffix);
                            document.cookie.split(";").forEach(function(cookie) {
                                let cookieName = cookie.trim().split("=")[0];
                                if (cookieName.indexOf(prefix) === 0 && cookieName.endsWith(suffix)) {
                                    var urlParts = location.hostname.split('.');
                                    for (var i = 2; i < urlParts.length + 1; i++) {
                                        console.log('Removing cookie ' + cookieName);
                                        document.cookie = cookieName + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;Max-Age=0; path=/;';
                                        document.cookie = cookieName + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;Max-Age=0; path=/; domain='+urlParts.slice(-i).join('.');
                                        document.cookie = cookieName + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;Max-Age=0; path=/; domain=.'+urlParts.slice(-i).join('.');
                                    }
                                }
                            });
                        } else {
                            console.log('Removing cookie ' + C_P_THEOBJECT[finalityId].cookies[key].name);
                            var urlParts = location.hostname.split('.');
                            for (var i = 2; i < urlParts.length + 1; i++) {
                                document.cookie = C_P_THEOBJECT[finalityId].cookies[key].name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;Max-Age=0; path=/;';
                                document.cookie = C_P_THEOBJECT[finalityId].cookies[key].name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;Max-Age=0; path=/; domain='+urlParts.slice(-i).join('.');
                                document.cookie = C_P_THEOBJECT[finalityId].cookies[key].name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;Max-Age=0; path=/; domain=.'+urlParts.slice(-i).join('.');
                            }
                        }
                    })
                }
            }
        });
    },
    loadJs : function() {
        // Don't execute scripts if the user has not given the consent yet
        if (!self.consentsGiven) {
            return;
        }

        // Append blocked script, js and css
        for (var i = 0; i < cookiesPlusBlockedScripts.length; i++) {
            let cookiesPlusBlockedScript = cookiesPlusBlockedScripts[i];
            let finalities = cookiesPlusBlockedScript['finalities'].split(',');
            let allFinalitiesAccepted = true;
            for (var j = 0; j < finalities.length; j++) {
                if (!$('#cookiesplus-form input#cookiesplus-finality-' + finalities[j] + '-on:checked').val()) {
                    allFinalitiesAccepted = false;
                    break;
                }
            }

            if (allFinalitiesAccepted) {
                // Append JS and scripts
                // We add JS first because it's possible that the scripts need the JS library
                if (!$.isEmptyObject(cookiesPlusBlockedScript['js'])) {
                    // Counter to keep track of the loaded scripts

                    Object.keys(cookiesPlusBlockedScript['js']).forEach((key) => {
                        this.loadedScriptsTotal += Object.keys(cookiesPlusBlockedScript['js']).length;
                        var s = document.createElement( 'script');
                        s.setAttribute( 'src', cookiesPlusBlockedScript['js'][key] );
                        //s.setAttribute('defer', '');

                        s.onload = () => {
                            // Increment the loaded scripts count
                            this.loadedScriptsCount++;
                        };

                        document.body.appendChild(s);
                    })

                    // Reset the js array after all scripts are added
                    cookiesPlusBlockedScripts[i]['js'] = [];
                }
            }
        }

        return true;
    },
    executeScriptsAndCss : function() {
        // Store reference to 'this'
        var self = this;

        // Don't execute scripts if the user has not given the consent yet
        if (!self.consentsGiven) {
            return;
        }

        cookieGdpr.tryParseJSONObject(decodeURIComponent(cookieGdpr.getCookiesPlusCookieValue('cookiesplus')))

        if (self.loadedScriptsCount === self.loadedScriptsTotal) {
            self.executeScriptsAndCssLoaded();
            self.executeCustomScripts();
            self.fireFBPixel();
        } else {
            // Check again after a delay
            setTimeout(function () {
                self.executeScriptsAndCss();
            }, 100); // Adjust the delay as needed
        }
    },
    executeScriptsAndCssLoaded : function() {
        // Append blocked script, js and css
        for (var i = 0; i < cookiesPlusBlockedScripts.length; i++) {
            let cookiesPlusBlockedScript = cookiesPlusBlockedScripts[i];
            let finalities = cookiesPlusBlockedScript['finalities'].split(',');
            let allFinalitiesAccepted = true;
            for (var j = 0; j < finalities.length; j++) {
                if (!$('#cookiesplus-form input#cookiesplus-finality-' + finalities[j] + '-on:checked').val()) {
                    allFinalitiesAccepted = false;
                    break;
                }
            }

            if (allFinalitiesAccepted) {
                if (cookiesPlusBlockedScript['script']) {
                    $(cookiesPlusBlockedScript['location']).replaceWith(cookiesPlusBlockedScript['script']);
                    cookiesPlusBlockedScripts[i]['script'] = [];
                }


                // Append CSS
                Object.keys(cookiesPlusBlockedScript['css']).forEach(function(key) {
                    var s = document.createElement('link');
                    s.setAttribute('rel', 'stylesheet');
                    s.setAttribute('href', cookiesPlusBlockedScript['css'][key] );
                    document.head.appendChild(s);
                })
                cookiesPlusBlockedScripts[i]['css'] = [];
            }
        }

        return true;
    },
    executeCustomScripts : function() {
        // For each checked finality, execute associated script
        $('#cookiesplus-form input:checked').each(function() {
            if ($(this).val() === 'on') {
                // Execute finality script
                if (typeof C_P_THEOBJECT !== 'undefined'
                    && C_P_THEOBJECT[$(this).data('finality-id')]
                    && C_P_THEOBJECT[$(this).data('finality-id')].script) {
                    $('body').append('<div style="display: none;" id="cookiesplus-scripts-' + $(this).data('finality-id') + '"></div>');
                    cookieGdpr.setInnerHTML(document.querySelector('#cookiesplus-scripts-' + $(this).data('finality-id')), C_P_THEOBJECT[$(this).data('finality-id')].script);

                    // Remove script to avoid execute it more than once
                    C_P_THEOBJECT[$(this).data('finality-id')].script = [];
                }
            } else if ($(this).val() === 'off') {
                // Execute finality script
                if (typeof C_P_THEOBJECT !== 'undefined'
                    && C_P_THEOBJECT[$(this).data('finality-id')]
                    && C_P_THEOBJECT[$(this).data('finality-id')].script_not) {
                    $('body').append('<div style="display: none;" id="cookiesplus-scripts-' + $(this).data('finality-id') + '"></div>');
                    cookieGdpr.setInnerHTML(document.querySelector('#cookiesplus-scripts-' + $(this).data('finality-id')), C_P_THEOBJECT[$(this).data('finality-id')].script_not);

                    // Remove script to avoid execute it more than once
                    C_P_THEOBJECT[$(this).data('finality-id')].script_not = [];
                }
            }
        });

        return true;
    },
    fireGTMEvents : function() {
        // For each checked finality, execute associated script
        let consentUpdateObject = {}; // Create an empty object to accumulate keys and values
        $('#cookiesplus-form input:checked').each(function () {
            if (typeof C_P_THEOBJECT !== 'undefined'
                && C_P_THEOBJECT[$(this).data('finality-id')]
                && C_P_THEOBJECT[$(this).data('finality-id')].consent_type) {
                Object.keys(C_P_THEOBJECT[$(this).data('finality-id')].consent_type).forEach(key => {
                    if ($(this).val() === 'on') {
                        // Grant consent
                        console.log('Granting consent ' + key);
                        consentUpdateObject[key] = 'granted';
                    } else {
                        // Deny consent
                        console.log('Denying consent ' + key);
                        consentUpdateObject[key] = 'denied';
                    }
                });
            }
        });

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }

        // Send all the accumulated keys and values to gtag
        console.log('Consent update object:', consentUpdateObject);
        gtag('consent', 'update', consentUpdateObject);

        $('#cookiesplus-form input:checked').each(function() {
            if ($(this).val() === 'on') {
                // Fire GTM events
                if (typeof C_P_THEOBJECT !== 'undefined'
                    && C_P_THEOBJECT[$(this).data('finality-id')]
                    && C_P_THEOBJECT[$(this).data('finality-id')].firingEvent) {
                        console.log('Firing event '+[C_P_THEOBJECT[$(this).data('finality-id')].firingEvent]);
                        dataLayer.push({'event': [C_P_THEOBJECT[$(this).data('finality-id')].firingEvent]});
                }
            }
        });
        //dataLayer.push({'event': 'gtm.init_consent'});

        return true;
    },
    fireFBPixel : function() {
        if (typeof C_P_THEOBJECT === 'undefined'
            || !C_P_THEOBJECT[$(this).data('finality-id')]
            || !C_P_THEOBJECT[$(this).data('finality-id')].fb) {
            return false;
        }

        let fbAllConsents = false;

        // For each finality, execute associated script
        $('#cookiesplus-form input:checked').each(function() {
            // Fire FB Pixel
            fbAllConsents = true;
            if ($(this).val() !== 'on' && C_P_THEOBJECT[$(this).data('finality-id')].fb) {
                fbAllConsents = false;
                return false;
            }
        });

        if (fbAllConsents) {
            console.log('Firing FB Pixel');
            if (typeof fbq !== 'undefined') {
            	fbq('consent', 'grant');
            }
        }

        return true;
    },
    setInnerHTML : function(elm, html) {
        elm.innerHTML = html;
        Array.from(elm.querySelectorAll("script")).forEach( function(oldScript) {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes)
                .forEach( function(attr) {
                    newScript.setAttribute(attr.name, attr.value)
                });
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    },
    tryParseJSONObject: function(jsonString) {
        try {
            var o = JSON.parse(jsonString);

            // Handle non-exception-throwing cases:
            // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
            // but... JSON.parse(null) returns null, and typeof null === "object",
            // so we must check for that, too. Thankfully, null is falsey, so this suffices:
            if (o && typeof o === "object") {
                return o;
            }
        }
        catch (e) { }

        return {};
    },
    getCookiesPlusCookieValue: function(name) {
        // return document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '';
        var match = document.cookie.match(RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
        return match ? match[1] : null;
    }
}

function checkAndExecute() {
    if (typeof jQuery !== 'undefined') {
        // jQuery is loaded, you can use it here
        $(document).ready(function() {
            cookieGdpr.init();

            $('.cookiesplus-displaymodal').on('click', function() {
                cookieGdpr.displayModal();
            })

            $('.cookiesplus-displaymodaladvanced').on('click', function() {
                cookieGdpr.displayModalAdvanced();
            })

            $('a[href*="#cookiesplus-displaymodaladvanced"]').click(function(e) {
                e.preventDefault();
                cookieGdpr.displayModalAdvanced();
            });
        });
    } else {
        // jQuery is not loaded, retry after a delay
        setTimeout(checkAndExecute, 100);
    }
}

checkAndExecute();
