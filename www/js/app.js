angular.module('bump', ['ngResource', 'auth'])

  .controller('HomeController', ['$scope', '$rootScope', '$http', '$timeout', '$q', 'HOST', 'FB', 'image', 'platform',
    function($scope, $rootScope, $http, $timeout, $q, HOST, FB, image, platform) {
      var currentUser, currentFbUserId, currentFbAccessToken;

      $scope.ENDPOINT = 'http://s3.amazonaws.com/bump-pictures';

      $scope.title = 'Bump';
      $scope.category = 'Architecture';
      $scope.grid = 3;
      $scope.order = 'bumps';

      $scope.$watch('alert', function(state) {
        if (state && !~state.indexOf('...')) {
          $timeout(function() {
            $scope.alert = false;
          }, 2500);
        }
      });

      $rootScope.refresh = function(list) {
        var deferred = $q.defer();
        ({
          'image-list': function() {
            image.query(function(data) {
              $scope.picList = data;
              deferred.resolve(null);
            });
          }
        })[list]();
        return deferred.promise;
      };

      $scope.picList = image.query();

      if (platform == 'browser' || platform == 'phone-simulator')
        $scope.authd = true;

      function authRequest(res) {
        currentFbUserId = res.authResponse.userID;
        currentFbAccessToken = res.authResponse.accessToken;
        if (res.status === 'connected') {
          $http.post(HOST + '/api/v1.0/login', { user: res.authResponse.userID, accessToken: res.authResponse.accessToken })
            .success(function(data) {
              currentUser = data;
            }); 

          $scope.$apply(function() {
            $scope.authd = true;
          });
        } 
        console.log('fb status', res);
      }

      function bootstrap() {
        console.log('device loaded');

        FB.getLoginStatus(authRequest, function (res) {
          console.log('fb err', res); 
        });

        $scope.$apply(function() {
          $scope.loaded = true;
        });
      }

      document.addEventListener("deviceready", bootstrap, false);


      $scope.loginWithFB = function() {
        FB.login(['email'], authRequest, function (res) {
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

      $scope.categories = function() {
        $rootScope.preview = 'category';
      };

      $scope.catSelect = function(category) {
        $scope.category = category.name;
        $rootScope.preview = false;
      };

      $scope.openPreview = function(image) {
        image.images = $scope.picList;
        $rootScope.preview = 'image';
        $scope.focusedImage = image;
      };

      $scope.closePreview = function(newPreview) {
        $rootScope.preview = newPreview || false;
      };

      $scope.openProfile = function() {
        $rootScope.preview = 'profile';
        $scope.profile = currentUser;
        $scope.profile.token = currentFbAccessToken;
      };

      $scope.getIconWidth = function() {
        return $(window).width() / 10;
      };

      $scope.bump = function(image) {
        if (!image.bumped) {
          image.bumps += 1;
          image.bumped = true;
        }
        $http.post(HOST + '/api/v1.0/bump', { image: image.id, user: 1 })
          .success(function(data) {
            console.log(data);
          });
      }

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
        ft.upload(imageURI, HOST + "/api/v1.0/upload", function(res) {
          $scope.$apply(function() {
            var imageList = JSON.parse(res.response);
            $scope.alert = 'Uploaded successfully';
            $scope.openPreview(imageList[0]);
          });
        }, function(error) {
          console.log("An error has occurred: Code = " + error.code);
        }, options);
      }
 
    
      $http.get(HOST + '/api/v1.0/category')
        .success(function(data) {
          $scope.catList = data;   
        })
        .error(function(err) {
          console.log('failed to load images');
        });

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

  .directive('triggerRefresh', ['$rootScope', function($rootScope) {
    return {
      scope: {
        list: '=triggerRefresh'
      },
      link: function(scope, element, attrs) {
        WebPullToRefresh.init({
          loadingFunction: function() {
            return new Promise(function(resolve, reject) {
              $rootScope.refresh(scope.list).then(function(err) {
                if (err) {
                  reject();
                } else {
                  resolve();
                }
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
      return 'http://localhost:8081';
    else
      return 'http://app.pikbump.com';
  }])

  .factory('image', ['$resource', 'HOST', function($resource, HOST) {
    var image = $resource(HOST + '/api/v1.0/image/:id/:action', {}, {});
    return image;
  }])

  .filter('commas', function() {
    return function(item) {
      return (item+'').replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
  });
