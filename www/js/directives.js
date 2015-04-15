angular.module('directives', [])

  .directive('imageLoad', [function() {
    return {
      scope: {
        className: '=imageLoad'
      },
      link: function(scope, element, attrs) {
        element.on('load', function() {
          element.addClass(scope.className);
        });
      }
    };
  }])

  .directive('fixedHeight', [function() {
    return {
      link: function(scope, element, attrs) {
        var top = element.offset().top + 15;
        var totalHeight = $(window).height();
        element.height(totalHeight - top + parseInt(attrs.fixedHeight));
      }
    };
  }])
  
  .directive('toggle', [function() {
    return {
      scope: {
        toggle: '='
      },
      link: function(scope, element, attrs) {
        function hide(first) {
          if (first)
            element.hide();
          var height = element.height();
          element.height(height);
          element.animate({ height: 0 }, 250, function() {
            element.hide();
            element.css({ height: 'auto' });
          });
        }

        function show(first) {
          element.show();
          var height = element.height();
          element.animate({ height: height + 'px' }, 250, function() {
            element.css({ height: 'auto' });
          });
        }

        var first = true;
        scope.$watch('toggle', function(state) {
          if (state) {
            show(first);
          } else {
            hide(first);
          }
          first = false;
        });
      }
    };
  }])

  .directive('loadWhenVisible', [function() {
    return {
      scope: {
        src: '=loadWhenVisible'
      },
      link: function(scope, element, attrs) {
        var $wrapper = element.parents('.ptr-wrapper');
        var $parent = element.parents('.load-visible-item');

        function isVisible() {
          if ($parent.offset().top - $wrapper.scrollTop() - $wrapper.height() <= 50) {
            element.attr('src', scope.src);
          }
        }

        function load() {
          element.addClass('image-loaded');
        }

        element.on('load', load);

        $wrapper.on('scroll', isVisible);

        scope.$watch('src', isVisible);

        scope.$on('$destroy', function() {
          element.off('load');
        });
      }
    };
  }])

  .directive('pullRefresh', [function() {
    return {
      templateUrl: 'partials/ptr.html',
      scope: {
        refresh: '&pullRefresh',
        distance: '=',
        list: '=',
        template: '=',
        config: '='
      },
      link: function(scope, element, attrs) {
        element.addClass('ptr-wrapper');

        var drag = {
          enabled: false,
          distance: 0,
          startingPositionY: 0
        };
        var infiniteScroll = attrs.hasOwnProperty('infinite');
        var moreInfiniteAvailable = false;
        var loadingInfinite = false;
        var $wrapper = element;
        var $content = element.find('.ptr-content');
        var $arrow = element.find('.ptr-arrow');
        var h = new Hammer($content.context);

        $wrapper.on('scroll', function() {
          var diff = $content.height() - $wrapper.scrollTop() - $wrapper.height();

          if (infiniteScroll && moreInfiniteAvailable && diff < 30) {
            loadInfinite();
          }
        });

        scope.$watch('list.more', function(state) {
          moreInfiniteAvailable = state;
        });

        function loadInfinite() {
          if (!loadingInfinite) {
            loadingInfinite = true;
            console.log('loading!');
            scope.config.count += scope.config._increment;
            scope.refresh().then(function() {
              loadingInfinite = false;
            });
          }
        }

        function dragStart() {
          drag.startingPositionY = $wrapper.scrollTop();

          if (drag.startingPositionY === 0) {
            drag.enabled = true;
            $wrapper.addClass('ptr-pull');
          }
        }
        function dragDown(e) {
          if (!drag.enabled && e.gesture.distance > 0)
            return;

          drag.distance = e.gesture.distance / 2.5; // Provide feeling of resistance

          // $arrow.css({ opacity: drag.distance / scope.distance });

          if (drag.distance > scope.distance) {
            $wrapper.addClass('ptr-refresh');
          } else {
            $wrapper.removeClass('ptr-refresh');
          }
        }
        function dragEnd() {
          if (!drag.enabled)
            return;

          $wrapper.removeClass('ptr-pull');

          if ($wrapper.hasClass('ptr-refresh')) {
            load();
          }

          drag.enabled = false;
        }

        function load() {
          h.off('dragstart');
          h.off('dragdown' );
          h.off('dragend');

          $wrapper.addClass('ptr-loading');

          scope.refresh({ reset: true }).then(function() {
            setTimeout(reset, 750);
          });
        }

        function reset() {
          function wrapperRemove() {
            $wrapper.removeClass('ptr-reset');
            $wrapper.removeClass('ptr-loading');
            $wrapper.removeClass('ptr-collapse');
            document.body.removeEventListener('transitionend', wrapperRemove, false);
          };

          document.body.addEventListener('transitionend', wrapperRemove, false);

          $wrapper.addClass('ptr-reset');
          $wrapper.removeClass('ptr-refresh');
          $wrapper.addClass('ptr-collapse');

          h.on('dragstart', dragStart);
          h.on('dragdown', dragDown);
          h.on('dragend', dragEnd);
        }

        h.on('dragstart', dragStart);
        h.on('dragdown', dragDown);
        h.on('dragend', dragEnd);
      }
    }
  }])
  
  .directive('triggerRefresh', [function() {
    return {
      scope: {
        refresh: '&triggerRefresh'
      },
      link: function(scope, element, attrs) {
        WebPullToRefresh.init({
          loadingFunction: function() {
            return new Promise(function(resolve, reject) {
              scope.refresh().then(function() {
                resolve();
              });
            });
          }
        });
      }
    };
  }]);