angular.module('bump', ['ngResource', 'auth'])

  .value('IMG_ENDPOINT', 'http://s3.amazonaws.com/bump-pictures')

  .controller('HomeController', ['$scope', '$rootScope', '$http', '$timeout', '$q', 'HOST', 'FB', 'image', 'category', 'platform', 'IMG_ENDPOINT',
    function($scope, $rootScope, $http, $timeout, $q, HOST, FB, image, category, platform, IMG_ENDPOINT) {
      var currentUser = {};
      var currentFbUserId; 
      var currentFbAccessToken;

      var defer = $q.defer();
      $scope.categories = category.query();
      $scope.categoryIdsByName = {};


      $scope.ENDPOINT = IMG_ENDPOINT;
      $scope.category = 'Landscape';


      function initializeApp() {
        $scope.categories.map(function(cat) {
          $scope.categoryIdsByName[cat.name] = cat.id;
        });

        forceLoadImages();
      }

      function authFB(res) {

        currentFbUserId = res.authResponse.userID;
        currentFbAccessToken = res.authResponse.accessToken;
        if (res.status === 'connected') {
          $http.post(HOST + '/login', { user: res.authResponse.userID, access_token: res.authResponse.accessToken })
            .success(function(data) {
              if (data.active) {
                currentUser = data;
              } else {
                $scope.newUser = data;
                $scope.tempUserId = data.username;
                $rootScope.preview = 'new-user';
              }
              $scope.authd = true;
              defer.resolve();
            }); 
        } 

        console.log('fb status', res);
      }

      function bootstrap() {

        FB.getLoginStatus(authFB, function(res) {
          console.log('fb err', res); 
        });

        $scope.$apply(function() {
          $scope.loaded = true;
        });

        console.log('device loaded');
      }

      document.addEventListener("deviceready", bootstrap, false);

      $q.all([ defer.promise, $scope.categories.$promise ])
        .then(initializeApp);


      $scope.$watch('alert', function(state) {
        if (state && !~state.indexOf('...')) {
          $timeout(function() {
            $scope.alert = false;
          }, 2500);
        }
      });

      function getCategoryId() {
        if ($scope.categories.$resolved)
          return $scope.categoryIdsByName[$scope.category];
        return 1;
      }

      function forceLoadImages() {
        if (!$scope.authd)
          return false;
        $rootScope.loading = true;
        $scope.picList = image.query({ category: getCategoryId(), current_user: currentUser.id }, function() {
          $rootScope.loaded = true;
          $timeout(function() {
            $rootScope.loading = $rootScope.loaded = false;
          }, 300);
        });
      }

      $scope.$watch('category', forceLoadImages);

      $scope.refreshMain = function() {
        console.log('refreshing main');
        return image.query({ category: getCategoryId(), current_user: currentUser.id }, function(data) {
          $scope.picList = data;
        }).$promise;
      };

      $scope.loginWithFB = function() {
        FB.login(['email'], authFB, function(res) {
          console.log(JSON.stringify(res)) 
        }, function(res) {
          console.log('login err', res);
        });
      };

      $scope.toggleView = function() {
        switch ($scope.grid) {
          case 3:
            $scope.grid = 2;
            break;
          case 2:
            $scope.grid = 1;
            break;
          case 1:
            $scope.grid = 3;
            break;
        }
      };

      $scope.toggleOrder = function() {
        if ($scope.order === 'bumps') {
          $scope.order = 'added';
        } else {
          $scope.order = 'bumps';
        }
      };

      $scope.getImageSize = [null, 720, 360, 360];

      $scope.openCategories = function() {
        $rootScope.preview = 'category';
      };

      $scope.catSelect = function(category) {
        $scope.category = category.name;
        $rootScope.preview = false;
      };

      $scope.openPreview = function(img) {
        img.images = image.query({ id: img.user_id, action: 'by_user', current_user: currentUser.id });
        $rootScope.preview = 'image';
        $scope.focusedImage = img;
      };

      $scope.closePreview = function(newPreview) {
        $rootScope.preview = newPreview || false;
      };

      window.scope = $scope;

      $scope.openProfile = function() {
        $rootScope.preview = 'profile';
        $scope.profile = currentUser;
        $scope.profile.token = currentFbAccessToken;
      };

      $scope.getIconWidth = function() {
        return $(window).width() / 10;
      };

      $scope.getTop = function(idx) {
        var w = $(window).width();
        return Math.floor(idx / $scope.grid) * (w / $scope.grid);
      };
      $scope.getLeft = function(idx) {
        var w = $(window).width();
        return Math.floor(idx % $scope.grid) * (w / $scope.grid);
      };

      $scope.bump = function(image) {
        if (!image.bumped) {
          image.bumps += 1;
          image.bumped = true;
        }
        $http.post(HOST + '/bump', { image: image.id, user: 1 })
          .success(function(data) {
            console.log(data);
          });
      }


      $scope.submitUsername = function(username) {
        $scope.usernameTaken = false;

        $http.get(HOST + '/name_available/' + username)
          .success(function(data) {
            if (data.available) {
              $scope.wizardLoading = true;
              $http.post(HOST + '/username/', { temp: $scope.tempUserId, username: username })
                .success(function(data) {
                  if (data.available === false) {
                    $scope.usernameTaken = username;
                  } else {
                    $scope.tempUserId = username;
                    $scope.pickedUsername = username;
                    $scope.usernameTaken = false;
                    $scope.wizardLoading = false;
                    currentUser = data;
                  }
                });
            } else {
              $scope.usernameTaken = username;
            }
          });
      };

      $scope.openCamera = function() {
        $timeout(function() {
          $rootScope.preview = 'upload';
          $scope.uploadParams = {};
          $scope.pendingUploadCategory = 'Category';
        }, 500);
        navigator.camera.getPicture(loadPhoto, function(message) {
          console.log('get picture cancelled'); 
          $scope.$apply(function() {
            $rootScope.preview = false;
          });
        },{
          quality: 50, 
          destinationType: navigator.camera.DestinationType.FILE_URI,
          sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
        });
      };

      function loadPhoto(imageURI) {
        console.log(imageURI);
        $scope.$apply(function() {
          $scope.pendingUploadImage = imageURI;
        });
        // uploadPhotoToServer(imageURI);
      }

      $scope.selectUploadCategory = function() {
        $rootScope.preview = 'select-category-for-upload';
      };

      $scope.submitUploadCategory = function(cat) {
        $scope.uploadParams.category = cat.id;
        $scope.pendingUploadCategory = cat.name;
        $rootScope.preview = 'upload';
      };

      $scope.uploadPhotoToServer = function() {
        var imageURI = $scope.pendingUploadImage;
        var ft = new FileTransfer();
        var options = {};

        options.fileKey = "file";
        options.fileName = imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType = "image/jpeg";
        options.params = $scope.uploadParams;
        options.chunkedMode = false;
        $timeout(function() {
          $scope.alert = 'Uploading...';
          $rootScope.preview = false;
        });
        ft.upload(imageURI, HOST + "/upload", function(res) {
          $scope.$apply(function() {
            var imageList = JSON.parse(res.response);
            $scope.alert = 'Uploaded successfully';
          });
        }, function(error) {
          console.log("An error has occurred: Code = " + error.code);
        }, options);
      }
 

      $scope.grid = 3;
      $scope.order = 'bumps';

      if (platform == 'browser' || platform == 'phone-simulator') {
        $scope.authd = true; $scope.loaded = true;
        $rootScope.preview = 'new-user';
      }

    }
  ])

  .directive('animate', ['$rootScope', function($rootScope) {
    return {
      link: function(scope, element, attrs) {
        // var h = $(window).height();
        // $rootScope.$watch('preview', function(state) {
        //   element.css({ 'margin-top': h + 'px' })
        //     .animate({ 'margin-top': '0' }, 300)
        // });
      }
    };
  }])

  .directive('toggle', [function() {
    return {
      scope: {
        toggle: '='
      },
      link: function(scope, element, attrs) {
        function hide() {
          var height = element.height();
          element.height(height);
          element.animate({ height: 0 }, 250, function() {
            element.hide();
            element.css({ height: 'auto' });
          });
        }

        function show() {
          element.show();
          var height = element.height();
          element.animate({ height: height + 'px' }, 250, function() {
            element.css({ height: 'auto' });
          });
        }

        scope.$watch('toggle', function(state) {
          if (state) {
            show();
          } else {
            hide();
          }
        });
      }
    };
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
  }])

  .factory('platform', [function() {
    var platform;
    console.log(document.URL);
    if (!!~document.URL.indexOf('Simulator')) {
      platform = 'desktop-simulator';
    } else if (!!~document.URL.indexOf(':3000')) {
      platform = 'phone-simulator';
    } else if (!window.cordova) {
      console.log = console._log;
      platform = 'browser';
    } else {
      platform = 'ios';
    }
    return platform;
  }])

  .factory('HOST', ['platform', function(platform) {
    if (platform == 'desktop-simulator' || platform == 'browser' || platform == 'phone-simulator')
      return 'http://localhost:8081/api/v1.0';
    else
      return 'http://app.pikbump.com/api/v1.0';
  }])

  .factory('image', ['$resource', 'HOST', function($resource, HOST) {
    var image = $resource(HOST + '/image/:category/:id/:action', {}, {});
    return image;
  }])

  .factory('category', ['$resource', 'HOST', function($resource, HOST) {
    var category = $resource(HOST + '/category', {}, {});
    return category;
  }])

  .filter('commas', function() {
    return function(item) {
      return (item+'').replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
  });
