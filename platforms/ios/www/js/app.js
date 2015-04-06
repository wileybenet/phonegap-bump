angular.module('bump', ['ngResource', 'ngAnimate', 'directives', 'utils', 'auth'])

  .value('IMG_ENDPOINT', 'http://s3.amazonaws.com/bump-pictures')

  .config([function() {
    console._log = console.log;
    console.log = function(args) {
      args = [].slice.call(arguments).map(function(arg) {
        arg = typeof arg == 'object' ? JSON.stringify(arg) : arg;
        return arg;
      }).join(' ');

      $.get('http://localhost:8081/debug', { data: args });
    };
  }])

  .controller('HomeController', ['$scope', '$rootScope', '$http', '$timeout', '$q', 'HOST', 'FB', 'imageFactory', 'userFactory', 'categoryFactory', 'platform', 'IMG_ENDPOINT',
    function($scope, $rootScope, $http, $timeout, $q, HOST, FB, imageFactory, userFactory, categoryFactory, platform, IMG_ENDPOINT) {
      var currentUser = {};
      var currentFbUserId; 

      var defer = $q.defer();
      $scope.categories = categoryFactory.query();
      $scope.categoryIdsByName = {};
      $scope.list = {};


      $rootScope.previews = [];
      $rootScope.ENDPOINT = IMG_ENDPOINT;
      $rootScope.WW = $(window).width();
      $rootScope.WH = $(window).height();
      $scope.category = 'Landscape';


      function initializeApp() {
        $scope.categories.map(function(cat) {
          $scope.categoryIdsByName[cat.name] = cat.id;
        });

        forceLoadImages();
      }

      function authFB(res) {
        if (res.status === 'connected') {
          FB.api('/me', [], function(r) { 
            $http.post(HOST + '/login', { user: r.id, access_token: res.authResponse.accessToken })
              .success(function(data) {
                if (data.active) {
                  currentUser = data;
                  $scope.authd = true;
                  defer.resolve();
                } else {
                  $timeout(function() {
                    $scope.newUser = data;
                    $rootScope.previews.push('new-user');
                    $scope.wizard = 0;
                    $scope.authd = true;
                    defer.resolve();
                  }, 500);
                }
              })
              .error(function() {
                alert('Bump server is down');
              }); 
          }, function(err) { console.log('err', err) });
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
        return 5;
      }

      function forceLoadImages() {
        if (!$scope.authd)
          return false;
        $rootScope.loading = true;
        imageFactory.query({ category: getCategoryId(), uid: currentUser.uid }, function(data) {
          $rootScope.loaded = true;
          $scope.picList = data;
          $timeout(function() {
            $rootScope.loading = $rootScope.loaded = false;
          }, 300);
        });
      }

      $scope.$watch('category', forceLoadImages);

      $scope.refreshMain = function() {
        console.log('refreshing main');
        return imageFactory.query({ category: getCategoryId(), uid: currentUser.uid }, function(data) {
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

      $scope.toggleView = function(config) {
        switch (config.grid) {
          case 3:
            config.grid = 2;
            break;
          case 2:
            config.grid = 1;
            break;
          case 1:
            config.grid = 3;
            break;
        }
      };

      $scope.toggleOrder = function(config) {
        if (config.order === 'bumps') {
          config.order = 'added';
        } else {
          config.order = 'bumps';
        }
      };

      $rootScope.getImageSize = [null, 720, 360, 360];

      $scope.openCategories = function() {
        $rootScope.previews.push('category');
      };

      $scope.catSelect = function(category) {
        $scope.category = category.name;
        $rootScope.previews.pop();
      };

      $rootScope.openPreview = function(image) {
        image.images = imageFactory.query({ id: image.uid, action: 'by_user', uid: currentUser.uid });
        $rootScope.previews.push('image');
        $scope.focusedImage = image;
      };

      $scope.closePreview = function() {
        $rootScope.previews.pop();
      };

      function setUser(user) {
        $scope.profile = user;
        $scope.profile.refresh = function() {
          return imageFactory.query({ id: user.uid, action: 'by_user', uid: currentUser.uid }, function(data) {
            $scope.profile.images = data;
          }).$promise;
        };
        $scope.profile.refresh();
        $scope.profile.list = {
          grid: 1,
          order: 'added'
        };
      }

      $rootScope.openProfile = function(user) {
        var uid = user ? user.uid : currentUser.uid;
        $rootScope.previews = ['profile'];
        userFactory.get({ id: uid }, setUser);
      };

      $scope.openNotifications = function() {
        $rootScope.previews.push('notifications');
        $scope.notifTab = 'trophies';
      };
      $scope.notifTabSelect = function(tab) {
        $scope.notifTab = tab;
      };

      $rootScope.getImageSrc = function(image) {
        return $scope.ENDPOINT + '/' + $scope.getImageSize[$scope.list.grid] + '_' + image;
      };

      $scope.bump = function(image) {
        if (!image.bumped) {
          image.bumps += 1;
          image.bumped = true;
        }
        $http.post(HOST + '/bump', { image: image.id, uid: currentUser.uid, ownerUid: image.uid })
          .success(function(data) {
            console.log(data);
          });
      }

      $scope.wizardNext = function() {
        $scope.wizard++;
      };
      $scope.wizardPrev = function() {
        $scope.wizard--;
      };


      $scope.submitUsername = function(username) {
        $scope.pickedUsername = false;
        if ((username || '').length <= 1) {
          $scope.usernameError = 'too short';
        } else {
          $scope.usernameError = false;
          $http.get(HOST + '/name_available/' + username)
            .success(function(data) {
              if (data.available) {
                $scope.wizardLoading = true;
                $scope.pickedUsername = username;
                setTimeout(function() {
                  $http.post(HOST + '/username/', { uid: $scope.newUser.uid, username: username })
                    .success(function(data) {
                      if (data.available === false) {
                        $scope.usernameError = username;
                      } else {
                        $scope.usernameError = false;
                        $scope.wizardLoading = false;
                        $scope.wizard = 2;
                        currentUser = data;
                        $scope.refreshMain();
                      }
                    });
                }, 1500);
              } else {
                $scope.usernameError = ' ';
              }
            });
          }
      };

      $scope.openCamera = function() {
        $timeout(function() {
          $rootScope.previews.push('upload');
          $scope.uploadParams = {
            uid: currentUser.uid
          };
          $scope.pendingUploadImage = null;
          $scope.pendingUploadCategory = 'Category';
        }, 500);
        navigator.camera.getPicture(loadPhoto, function(message) {
          console.log('get picture cancelled'); 
          $scope.$apply(function() {
            $rootScope.previews.pop();
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
      }

      $scope.readyToUpload = function() {
        return !!$scope.uploadParams.category;
      };

      $scope.selectUploadCategory = function() {
        $rootScope.previews.push('select-category-for-upload');
      };

      $scope.submitUploadCategory = function(cat) {
        $scope.uploadParams.category = cat.id;
        $scope.pendingUploadCategory = cat.name;
        $rootScope.previews.pop();
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
          $rootScope.previews.pop();
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
 

      $scope.list.grid = 1;
      $scope.list.order = 'bumps';

      if (platform == 'browser' || platform == 'phone-simulator') {
        $scope.loaded = true;
        $scope.authd = true;
        // $scope.newUser = {};
        // $rootScope.previews.push('new-user');
        // $scope.wizard = 0;
      }

    }
  ]);
