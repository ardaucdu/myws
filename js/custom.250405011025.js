
$(function() {
	if (!$('body').is('.edit')) {
		$('.horizontal-form').each(function() {
			$(this).click(function() {
				$('.ed-form-captcha', this).addClass('show');
				$('.ed-form-checkbox.privacy', this).addClass('show');
			});
		});
	}
});
(function() {
	$(function() {
		$('.menu-wrapper').each(function() {
			initMenu($(this))
		});
	});
	document.addEventListener("touchstart", function() {}, false);
	var initMenu = function($menuWrapper) {
		var $body = $('body');
		var $menu = $('.ed-menu', $menuWrapper);
		var $menuLinks = $('a', $menu);
		var $menuTrigger = $('.menu-trigger', $menuWrapper);
		var $banner = $('.banner').first();
		var menuWrapperHeight = $menuWrapper.outerHeight();
		var bannerHeight = $banner.length ? $banner.outerHeight() : 0;
		var smoothScrollOffset = 20;
		toggleClassOnClick($body.add($menu), $menuTrigger, null, 'open open-menu');
		activateSmoothScroll($menuLinks.add($('.scroll a')), smoothScrollOffset);
		addClassOnVisibleLinkTargets($menuLinks, 'active', 2 / 3);
		handleSticky($menuWrapper, 'sticky', $banner);
	};
	var observeHeightChange = function(elm, callback) {
		if (!('ResizeObserver' in window) || elm == null) return;
		var ro = new ResizeObserver(callback);
		ro.observe(elm);
	}
	var toggleClassOnClick = function($target, $trigger, $closeTrigger, cssClass) {
		$target.removeClass(cssClass);
		$trigger.removeClass(cssClass);
		$trigger.off('.toggle').on('click.toggle', function() {
			$(this).toggleClass(cssClass);
			$target.toggleClass(cssClass);
		});
		$target.find('a').click(function() {
			$target.removeClass(cssClass);
			$trigger.removeClass(cssClass);
		});
		if (!$closeTrigger || !$closeTrigger.length) {
			return;
		}
		$closeTrigger.click(function() {
			$target.removeClass(cssClass);
			$trigger.removeClass(cssClass);
		});
	};
	var activateSmoothScroll = function($scrollLinks, scrollOffset) {
		if (typeof scrollOffset === 'undefined') {
			scrollOffset = 0;
		}
		var determineTarget = function($trigger, hash) {
			if (hash == '#!next') {
				return $trigger.closest('.ed-element').next();
			}
			return $(hash);
		}
		$scrollLinks.click(function(e) {
			var $target = determineTarget($(this), this.hash);
			if (!$target.length) return;
			e.preventDefault();
			viewport.scrollTo($target, 'top', 500, 0);
		});
	};
	var getStickyMode = function($element) {
		var fillValue = getComputedStyle($element[0]).fill;
		return fillValue === 'rgb(255, 0, 0)' ?
			'sticky_banner' :
			fillValue === 'rgb(0, 255, 0)' ?
			'sticky_menu' :
			fillValue === 'rgb(0, 0, 255)' ?
			'sticky_instant' :
			fillValue === 'rgb(255, 255, 255)' ?
			'sticky_reverse' :
			'sticky_none';
	};
	var handleSticky = function($element, cssClass, $banner) {
		var triggerPos = 0,
			offset = 0;
		var menuWrapperHeight = $element.outerHeight();
		var mode;
		var prevScroll = 0;
		$element.removeClass(cssClass);
		var toggleSpacer = function(toggle) {
			document.body.style.setProperty('--spacer-height', toggle ? menuWrapperHeight + 'px' : '');
		};
		var handleScroll = function() {
			if (!$element.length || mode === 'sticky_none') return;
			var isReverse = mode === 'sticky_reverse',
				curScroll = viewport.getScrollTop();
			if (triggerPos <= curScroll && (!isReverse || prevScroll > curScroll)) {
				$element.addClass(cssClass);
				toggleSpacer(true);
			} else {
				$element.removeClass(cssClass);
				toggleSpacer(false);
			}
			prevScroll = curScroll;
		};
		var updateOffset = function() {
			mode = getStickyMode($element);
			menuWrapperHeight = $element.outerHeight();
			if (!$element.hasClass(cssClass)) {
				offset = $element.offset().top;
			}
			if (mode === 'sticky_banner' && !$banner.length) {
				mode = 'sticky_menu';
			}
			if (mode === 'sticky_banner') {
				triggerPos = $banner.offset().top + ($banner.length ? $banner.outerHeight() : $element.outerHeight());
			}
			if (mode === 'sticky_menu' || mode === 'sticky_reverse') {
				triggerPos = offset + $element.outerHeight();
			}
			if (mode === 'sticky_instant') {
				triggerPos = offset;
			}
			handleScroll();
		}
		viewport.observe('resize', updateOffset);
		viewport.observe('animation.end', updateOffset);
		observeHeightChange($element[0], updateOffset);
		updateOffset();
		viewport.observe('scroll', handleScroll);
		handleScroll();
	};
	var addClassOnVisibleLinkTargets = function($links, cssClass, sectionViewportRatio) {
		if (typeof sectionViewportRatio === 'undefined') {
			sectionViewportRatio = 1 / 2;
		}
		var menuTargets = [];
		var activeLink = $links.filter('.active:not(.wv-link-elm)').eq(0);
		var links = $links.filter(function() {
			var $target = $(this.hash);
			if (!$target.length) {
				return false;
			}
			var updateOffset = function() {
				$target.data('offset', $target.offset().top);
			};
			viewport.observe('resize', updateOffset);
			viewport.observe('animation.end', updateOffset);
			updateOffset();
			menuTargets.push($target);
			return true;
		});
		if (!links.length) {
			return;
		}
		var checkVisibility = function() {
			$links.removeClass('active');
			for (var i = menuTargets.length - 1; i >= 0; i--) {
				var desiredScrollPosition = menuTargets[i].data('offset') - viewport.getHeight() * (1 - sectionViewportRatio);
				if (viewport.getScrollTop() >= desiredScrollPosition && menuTargets[i][0].offsetParent !== null) {
					links.eq(i).addClass(cssClass);
					return;
				}
			}
			activeLink.addClass(cssClass);
		};
		viewport.observe('scroll', checkVisibility);
		checkVisibility();
	};
})();
$(function() {
	var isIE11 = !!window.MSInputMethodContext && !!document.documentMode,
		isSafari =
		navigator.userAgent.toLowerCase().indexOf('safari') > -1 &&
		navigator.userAgent.toLowerCase().indexOf('chrome') === -1;
	var slice = Array.prototype.slice;
	var valid = true;
	var ready = function(callback) {
		var fn = function() {
			if (document.body.classList.contains('edit')) {
				return;
			}
			callback();
		};
		if (window.readyState !== 'loading') {
			fn();
			return;
		}
		document.addEventListener('DOMContentLoaded', fn);
	}
	var countdown = function(date, tick) {
		var now = new Date().getTime(),
			running = false,
			days = 0,
			hours = 0,
			minutes = 0,
			seconds,
			interval;
		var updateCounter = function() {
			if (!running) return;
			now = new Date().getTime();
			seconds = Math.round((date - now) / 1000);
			if (seconds > 86400) {
				days = Math.floor(seconds / 86400);
				seconds %= 86400;
			}
			if (seconds > 3600) {
				hours = Math.floor(seconds / 3600);
				seconds %= 3600;
			}
			if (seconds > 60) {
				minutes = Math.floor(seconds / 60);
				seconds %= 60;
			}
			tick(days, hours, minutes, seconds);
		};
        if (isNaN(Date.parse(date))) {
		    date = date.replace(/\-/g, '/');
		}
		if (isNaN(Date.parse(date))) {
		    date = date.replace(/\s/, 'T');
		}
		date = new Date(date).getTime();
		if (now >= date) {
			valid = false;
			return;
		}
		tick = tick || (function() {});
		return {
			start: function() {
				interval = window.setInterval(updateCounter, 1000);
				running = true;
				updateCounter();
			},
			stop: function() {
				if (interval) window.clearInterval(interval);
				interval = undefined;
				running = false;
			}
		}
	};
	var writeCountdown = function(element, days, hours, minutes, seconds) {
		var daysElm = element.querySelector(".countdown-days"),
			hoursElm = element.querySelector('.countdown-hours'),
			minutesElm = element.querySelector('.countdown-minutes'),
			secondsElm = element.querySelector('.countdown-seconds');
		if (daysElm) daysElm.innerHTML = days;
		if (hoursElm) hoursElm.innerHTML = hours;
		if (minutesElm) minutesElm.innerHTML = minutes;
		if (secondsElm) secondsElm.innerHTML = seconds;
	}
	var buildCountdown = function(e) {
		var instances = slice.call(document.querySelectorAll('.countdown-instance')),
			len = instances.length,
			i = 0,
			element, 
			dataContent;
		for (; i < len; i++) {
			element = instances[i];
			dataContent = window.getComputedStyle(instances[i], ':before').content.slice(1, -1);
			var date = dataContent;
			element.countdown = countdown(date, function(days, hours, minutes, seconds) {
				writeCountdown(
					element, parseInt(days),
					("0" + parseInt(hours)).slice(-2),
					("0" + parseInt(minutes)).slice(-2),
					("0" + parseInt(seconds)).slice(-2)
				);
			});
			if (valid) {
				element.countdown.start();
			}
		}
	};
	var destroyCountdown = function(e) {
		var instances = slice.call(document.querySelectorAll('.countdown-instance')),
			len = instances.length,
			i = 0,
			element;
		for (; i < len; i++) {
			element = instances[i];
			writeCountdown(element, "0", "0", "0", "0");
			element.countdown.stop();
		}
	}
	var preview = false;
	var listener = function() {
		if (valid) {
			if (!preview && document.body.classList.contains('preview')) {
				buildCountdown();
				preview = true;
			} else if (preview && !document.body.classList.contains('preview')) {
				destroyCountdown();
				preview = false;
			}
		}
		requestAnimationFrame(listener);
	};
	requestAnimationFrame(listener);
	ready(function() {
		buildCountdown();
	});
});
