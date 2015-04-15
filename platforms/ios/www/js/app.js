angular.module('bump', ['ngResource', 'ngAnimate', 'ngSanitize', 'directives', 'utils', 'auth'])

  .value('IMG_ENDPOINT', 'http://s3.amazonaws.com/bump-pictures')

  .value('APP_ID', '554449381361750')

  .value('API_VERSION', '1.0')

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

  // cordova emulate ios --target="iPhone-5"

  .controller('HomeController', ['$scope', '$rootScope', '$http', '$timeout', '$q', 'HOST', 'FB', 'currentUser', 'imageFactory', 'userFactory', 'categoryFactory', 'notificationFactory', 'platform', 'IMG_ENDPOINT', 'APP_ID',
    function($scope, $rootScope, $http, $timeout, $q, HOST, FB, currentUser, imageFactory, userFactory, categoryFactory, notificationFactory, platform, IMG_ENDPOINT, APP_ID) {
      var defer = $q.defer();
      $scope.categories = categoryFactory.query();
      $scope.categoryIdsByName = {};
      $scope.list = {
        grid: 2,
        order: 'bumps',
        count: 36,
        _increment: 18
      };
      $scope.list._count = $scope.list.count;


      $rootScope.previews = [];
      $rootScope.ENDPOINT = IMG_ENDPOINT;
      $rootScope.ww = function() { return $(window).width() };
      $scope.category = 'Landscape';


      function initializeApp() {
        $scope.categories.map(function(cat) {
          $scope.categoryIdsByName[cat.name] = cat.id;
        });

        forceLoadImages();
      }

      function authFB(res) {
        $scope.networkError = null;
        if (res.status === 'connected') {
          FB.api('/me', [], function(r) { 
            $http.post(HOST.open + '/login', { user: r.id, access_token: res.authResponse.accessToken })
              .success(function(data) {
                if (data.active) {
                  currentUser.set(data);
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
                $scope.networkError = 'The Bump server';
              }); 
          }, function(err) {
            $scope.networkError = 'Facebook';
          });
        } 
      }

      function FBerror(err) {
        $timeout(function() {
          $scope.networkError = 'Facebook';
        });
      }

      function bootstrap() {

        FB.getLoginStatus(authFB, function(res) {
          $timeout(function() {
            $scope.networkError = 'Facebook';
          });
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

      var first = true;
      $scope.$watch('list.order', function(state) {
        if (first)
          return first = false;

        if (state == 'bumps')
          $scope.alert = 'Order by popularity';
        else
          $scope.alert = 'Order by date';

        forceLoadImages();
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
        $scope.picList = imageFactory.get({ category: getCategoryId(), order: $scope.list.order, count: $scope.list.count, uid: currentUser.uid, api_token: currentUser.api_token }, function(data) {
          $rootScope.loaded = true;
          $timeout(function() {
            $rootScope.loading = $rootScope.loaded = false;
          }, 300);
        }, function(err) {
          $scope.networkError = 'The Bump server';
        });
      }

      $scope.$watch('category', function() {
        $scope.list.count = $scope.list._count;
        forceLoadImages();
      });

      $scope.refreshMain = function(reset) {
        if (reset)
          $scope.list.count = $scope.list._count;

        return imageFactory.get({ category: getCategoryId(), order: $scope.list.order, count: $scope.list.count, uid: currentUser.uid, api_token: currentUser.api_token }, function(data) {
          $scope.picList = data;
        }, function(err) {
          $scope.networkError = 'The Bump server';
        }).$promise;
      };

      $scope.loginWithFB = function() {
        FB.login([''], authFB, function(err) {
          $scope.networkError = 'Facebook';
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
        image.images = imageFactory.get({ id: image.uid, action: 'by_user', uid: currentUser.uid, count: 12, order: 'bumps', api_token: currentUser.api_token }, function() {}, function(err) {
          $scope.networkError = 'The Bump server';
        });
        $rootScope.previews.push('image');
        $scope.focusedImage = image;
      };

      $scope.closePreview = function() {
        $rootScope.previews.pop();
      };

      function setUser(user) {
        $scope.profile = user;
        $scope.profile.list = {
          grid: 1,
          order: 'added',
          count: 18,
          _count: 18,
          _increment: 12,
          $mine: currentUser.uid == user.uid
        };
        $scope.profile.refresh = function() {
          return imageFactory.get({ id: user.uid, action: 'by_user', order: $scope.profile.list.order, count: $scope.profile.list.count, uid: currentUser.uid, api_token: currentUser.api_token }, function(data) {
            $scope.profile.images = data;
          }, function(err) {
            $scope.networkError = 'The Bump server';
          }).$promise;
        };
        $scope.profile.refresh();
      }

      $rootScope.openProfile = function(uid) {
        uid = uid || currentUser.uid;
        $rootScope.previews = ['profile'];
        userFactory.get({ id: uid, uid: currentUser.uid, api_token: currentUser.api_token }, setUser);
      };

      $scope.openNotifications = function() {
        $rootScope.previews.push('notifications');
        $scope.notif = {
          tab: 'bumps'
        };
        $scope.notif.refresh = function() {
          return notificationFactory.query({ action: 'bumps', uid: currentUser.uid, api_token: currentUser.api_token }, function(data) {
            $scope.notif.bumps = data;
          }, function(err) {
            $scope.networkError = 'The Bump server';
          }).$promise;
        };
        $scope.notif.refresh();
      };
      $rootScope.dismissNotification = function(notification) {
        notification.new = 0;
        notificationFactory.delete({ id: notification.id, uid: currentUser.uid, api_token: currentUser.api_token }, function(data) {
          notification.new = data.success ? 0 : 1;
        }, function(err) {
          $scope.networkError = 'The Bump server';
        });
      };

      $rootScope.openHelp = function(group) {
        // TODO
      };

      $scope.retryConnection = function() {
        $scope.retrying = true;
        $timeout(function() {
          $http.get(HOST.open + '/status')
            .success(function() {
              $scope.retrying = false;
              $scope.networkError = null;
            })
            .error(function() {
              $scope.retrying = false;
              $scope.networkError = 'The Bump server';
            });
        }, 500);
      };

      $rootScope.getImageSrc = function(image) {
        return $scope.ENDPOINT + '/' + $scope.getImageSize[$scope.list.grid] + '_' + image;
      };

      $rootScope.bump = function(image, upOnly) {
        if ($rootScope.isMyImage(image) || image.$updating || (upOnly && image.bumped))
          return false;

        image.$updating = true;

        if (!image.bumped) {
          image.bumps += 1;
          image.bumped = true;
          $http.post(HOST.api + '/bump?uid=' + currentUser.uid + '&api_token=' + currentUser.api_token, { image: image.key, ownerUid: image.uid })
            .success(function(data) {
              image.$updating = false;
              console.log(data);
            })
            .error(function(err) {
              $scope.networkError = 'The Bump server';
            });
        } else {
          image.bumps -= 1;
          image.bumped = false;
          $http.delete(HOST.api + '/bump/' + image.key + '?uid=' + currentUser.uid + '&api_token=' + currentUser.api_token)
            .success(function(data) {
              image.$updating = false;
              console.log(data);
            })
            .error(function(err) {
              $scope.networkError = 'The Bump server';
            });
        }
      }
      $rootScope.isMyImage = function(image) {
        return image.uid == currentUser.uid;
      };

      $scope.report = function(image) {
        if (image.$updating)
          return;
        if (!image.reported) {
          image.reports += 1;
          image.reported = true;
          $http.post(HOST.api + '/report/' + image.key + '?uid=' + currentUser.uid + '&api_token=' + currentUser.api_token, { ownerUid: image.uid })
            .success(function(data) {
              console.log(data);
            })
            .error(function(err) {
              $scope.networkError = 'The Bump server';
            });
        } else {
          $rootScope.cancelReport(image);
        }
      }

      $rootScope.cancelReport = function(image) {
        if (image.$updating)
          return;
        $http.delete(HOST.api + '/report/' + image.key + '?uid=' + currentUser.uid + '&api_token=' + currentUser.api_token)
          .success(function(data) {
            image.reported = false;
            image.$updating = false;
          })
          .error(function(err) {
            $scope.networkError = 'The Bump server';
          });
      };

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
          $http.get(HOST.open + '/name_available/' + username)
            .success(function(data) {
              if (data.available) {
                $scope.wizardLoading = true;
                $scope.pickedUsername = username;
                setTimeout(function() {
                  $http.post(HOST.open + '/username/', { uid: $scope.newUser.uid, username: username, api_token: currentUser.api_token })
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
            })
            .error(function(err) {
              $scope.networkError = 'The Bump server';
            });
          }
      };

      $scope.openCamera = function() {
        $timeout(function() {
          $rootScope.post_to_fb = currentUser.post_to_fb;
          $rootScope.previews = [];
          $rootScope.previews.push('upload');
          $scope.uploadParams = {
            uid: currentUser.uid,
            api_token: currentUser.api_token
          };
          $scope.pendingUploadImage = $rootScope.defaultImage = 'images/default.png';
          $scope.pendingUploadCategory = 'Category';
        }, 500);
        navigator.camera.getPicture(loadPhoto, function(message) {
          $scope.$apply(function() {
            $rootScope.previews.pop();
          });
        },{
          quality: 50, 
          destinationType: navigator.camera.DestinationType.FILE_URI,
          sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
        });
      };

      $scope.authPostToFb = function() {
        if (!currentUser.post_to_fb) {
          FB.login(['publish_actions'], function(res) {
            $http.post(HOST.api + '/user/' + currentUser.uid + '/post_to_facebook?uid=' + currentUser.uid + '&api_token=' + currentUser.api_token, {})
              .success(function(res) {
                currentUser.post_to_fb = $rootScope.post_to_fb = true;
                console.log('updated user');
              })
              .error(function(err) {
                $scope.networkError = 'The Bump server';
              });
          }, function(err) {
            $scope.networkError = 'Facebook';
          });
        }
      };

      $scope.postToFb = function() {
        $scope.uploadParams.postToFb = !$scope.uploadParams.postToFb;
      };

      function loadPhoto(imageURI) {
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
        ft.upload(imageURI, HOST.api + '/upload?uid=' + currentUser.uid + '&api_token=' + currentUser.api_token, function(res) {
          res = JSON.parse(res.response);
          $scope.$apply(function() {
            $scope.alert = 'Uploaded successfully';
          });
          if ($scope.uploadParams.postToFb) {
            FB.showDialog({
              app_id: APP_ID,
              caption: $scope.pendingUploadCategory,
              method: 'feed',
              picture: IMG_ENDPOINT + '/720_' + res.filename,  
              description: $scope.uploadParams.caption
            }, function(res) {
              console.log('success', res);
            }, function(res) {
              console.log('error', res);
            });
          }
        }, function(err) {
          $scope.networkError = 'Bump upload server';
        }, options);
      }
 


      if (platform == 'browser' || platform == 'phone-simulator') {
        $scope.loaded = true;
        $scope.authd = true;
        currentUser = { uid: '040544ce-1b6f-4060-8129-38844a681bd1', api_token: 'e7488675-d945-4acc-95e7-de525e3dcb97' };
        defer.resolve();
        // $scope.newUser = {};
        // $rootScope.previews.push('new-user');
        // $scope.wizard = 0;
      }

    }
  ]);
