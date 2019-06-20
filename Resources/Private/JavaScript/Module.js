define(['jquery'], function($) {
	'use strict';

	/**
	 * LuxBackend functions
	 *
	 * @class LuxletterBackend
	 */
	function LuxletterBackend($) {
		'use strict';

		/**
		 * @type {LuxletterBackend}
		 */
		var that = this;

		/**
		 * @type {boolean}
		 */
		var newsletterPreview = false;

		/**
		 * @type {boolean}
		 */
		var userPreview = false;

		/**
		 * Initialize
		 *
		 * @returns {void}
		 */
		this.initialize = function() {
			addDatePickers();
			addWizardForm();
			addWizardUserPreview();
			addWizardNewsletterPreview();
			testMailListener();
		};

		/**
		 * @returns {void}
		 */
		var addWizardForm = function() {
			var fieldsets = document.querySelectorAll('.wizardform > fieldset');
			var buttons = document.querySelectorAll('[data-wizardform-gotostep]');
			var wizardLinks = document.querySelectorAll('.wizard > a');

			for (var i = 1; i < fieldsets.length; i++) {
				hideElement(fieldsets[i]);
			}
			for (var j = 0; j < buttons.length; j++) {
				buttons[j].addEventListener('click', function(event) {
					event.preventDefault();
					var step = this.getAttribute('data-wizardform-gotostep');

					removeClassFromElements(wizardLinks, 'current');
					wizardLinks[step-1].classList.add('current');

					for (var k = 0; k < fieldsets.length; k++) {
						hideElement(fieldsets[k]);
					}
					showElement(fieldsets[step-1]);
				});
			}
		};

		/**
		 * @param {string} elements
		 * @param {string} className
		 * @returns {void}
		 */
		var removeClassFromElements = function(elements, className) {
			for (var i = 0; i < elements.length; i++) {
				elements[i].classList.remove(className);
			}
		};

		/**
		 * @returns {void}
		 */
		var addDatePickers = function() {
			if (document.querySelector('.t3js-datetimepicker') !== null) {
				require(['TYPO3/CMS/Backend/DateTimePicker'], function(DateTimePicker) {
					DateTimePicker.initialize();
				});
			}
		};

		/**
		 * @returns {void}
		 */
		var addWizardUserPreview = function() {
			var select = document.querySelector('[data-luxletter-wizardpreviewevent="users"]');
			if (select !== null) {
				select.addEventListener('change', function() {
					ajaxConnection(TYPO3.settings.ajaxUrls['/luxletter/wizardUserPreview'], {
						usergroup: this.value,
					}, 'addWizardUserPreviewCallback');
				});
			}
		};

		/**
		 * @returns {void}
		 */
		var addWizardNewsletterPreview = function() {
			var input = document.querySelector('[data-luxletter-wizardpreviewevent="newsletter"]');
			if (input !== null) {
				input.addEventListener('blur', function() {
					var container = document.querySelector('[data-luxletter-wizardpreview="newsletter"]');
					if (container !== null) {
						container.innerHTML = '';
						var iframe = document.createElement('iframe');
						iframe.setAttribute(
							'src',
							'//' + window.location.host + '/?type=1560777975&tx_luxletter_fe[origin]='
							+ encodeURIComponent(this.value)
						);
						iframe.setAttribute('class', 'luxletter-iframepreview');
						container.appendChild(iframe);
						newsletterPreview = true;
						showIfNewsletterIsReady();
					}
				});
			}
		};

		/**
		 * @returns {void}
		 */
		var testMailListener = function() {
			var input = document.querySelector('[data-luxletter-testmail="submit"]');
			if (input !== null) {
				input.addEventListener('click', function(event) {
					event.preventDefault();
					var origin = document.querySelector('[data-luxletter-wizardpreviewevent="newsletter"]').value;
					var email = document.querySelector('[data-luxletter-testmail="email"]').value;
					var subject = document.querySelector('[data-luxletter-testmail="subject"]').value;
					if (origin && email && subject) {
						ajaxConnection(TYPO3.settings.ajaxUrls['/luxletter/testMail'], {
							origin: origin,
							email: email,
							subject: subject,
						}, 'testMailListenerCallback');
					}
				});
			}
		};

		/**
		 * @param response
		 * @returns {void}
		 */
		this.addWizardUserPreviewCallback = function(response) {
			var container = document.querySelector('[data-luxletter-wizardpreview="users"]');
			if (container !== null) {
				container.innerHTML = response.html;
				userPreview = true;
				showIfNewsletterIsReady();
			}
		};

		/**
		 * @param response
		 * @returns {void}
		 */
		this.testMailListenerCallback = function(response) {
			var messageElement = document.querySelector('[data-luxletter-testmail="message"]');
			if (messageElement !== null) {
				showElement(messageElement);
			}
			var fieldElements = document.querySelector('[data-luxletter-testmail="fields"]');
			if (fieldElements !== null) {
				hideElement(fieldElements);
			}
		};

		/**
		 * @params {string} uri
		 * @params {object} parameters
		 * @params {string} target callback function name
		 * @returns {void}
		 */
		var ajaxConnection = function(uri, parameters, target) {
			if (uri !== undefined && uri !== '') {
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function() {
					if (this.readyState === 4 && this.status === 200) {
						if (target !== null) {
							that[target](JSON.parse(this.responseText));
						}
					}
				};
				xhttp.open('POST', mergeUriWithParameters(uri, parameters), true);
				xhttp.send();
			} else {
				console.log('No ajax URI given!');
			}
		};

		/**
		 * @returns {void}
		 */
		var showIfNewsletterIsReady = function() {
			if (isNewsletterReady()) {
				var statusElements = document.querySelectorAll('[data-luxletter-wizardstatus="ready"]');
				for (var i = 0; i < statusElements.length; i++) {
					showElement(statusElements[i]);
				}
			}
		};

		/**
		 * @returns {boolean}
		 */
		var isNewsletterReady = function() {
			return newsletterPreview && userPreview;
		};

		/**
		 * Build an uri string for an ajax call together with params from an object
		 * 		{
		 * 			'x': 123,
		 * 			'y': 'abc'
		 * 		}
		 *
		 * 		=>
		 *
		 * 		"?x=123&y=abc"
		 *
		 * @params {string} uri
		 * @params {object} parameters
		 * @returns {string} e.g. "index.php?id=123&type=123&x=123&y=abc"
		 */
		var mergeUriWithParameters = function(uri, parameters) {
			for (var key in parameters) {
				if (parameters.hasOwnProperty(key)) {
					if (uri.indexOf('?') !== -1) {
						uri += '&';
					} else {
						uri += '?';
					}
					uri += key + '=' + encodeURIComponent(parameters[key]);
				}
			}
			return uri;
		};

		/**
		 * @param element
		 * @returns {void}
		 */
		var hideElement = function(element) {
			element.style.display = 'none';
		};

		/**
		 * @param element
		 * @returns {void}
		 */
		var showElement = function(element) {
			element.style.display = 'block';
		};
	}


	/**
	 * Init
	 */
	$(document).ready(function () {
		var LuxletterBackendObject = new LuxletterBackend($);
		LuxletterBackendObject.initialize();
	})
});