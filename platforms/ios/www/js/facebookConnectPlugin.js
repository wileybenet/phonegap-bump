"use strict";

/*
 * @author Ally Ogilvie
 * @copyright Wizcorp Inc. [ Incorporated Wizards ] 2014
 * @file - facebookConnectPlugin.js
 * @about - JavaScript interface for PhoneGap bridge to Facebook Connect SDK
 *
 *
 */
var require = cordova.require;

var exec = require("cordova/exec");

var fbConnect = {

  getLoginStatus: function (s, f) {
      exec(s, f, "FacebookConnectPlugin", "getLoginStatus", []);
  },

  showDialog: function (options, s, f) {
      exec(s, f, "FacebookConnectPlugin", "showDialog", [options]);
  },

  login: function (permissions, s, f) {
      exec(s, f, "FacebookConnectPlugin", "login", permissions);
  },

  logEvent: function(name, params, valueToSum, s, f) {
      // Prevent NSNulls getting into iOS, messes up our [command.argument count]
      if (!params && !valueToSum) {
          exec(s, f, "FacebookConnectPlugin", "logEvent", [name]);
      } else if (params && !valueToSum) {
          exec(s, f, "FacebookConnectPlugin", "logEvent", [name, params]);
      } else if (params && valueToSum) {
          exec(s, f, "FacebookConnectPlugin", "logEvent", [name, params, valueToSum]);
      } else {
          f("Invalid arguments");
      }
  },

  logPurchase: function(value, currency, s, f) {
      exec(s, f, "FacebookConnectPlugin", "logPurchase", [value, currency]);
  },

  getAccessToken: function(s, f) {
      exec(s, f, "FacebookConnectPlugin", "getAccessToken", []);
  },

  logout: function (s, f) {
      exec(s, f, "FacebookConnectPlugin", "logout", []);
  },

  api: function (graphPath, permissions, s, f) {
      if (!permissions) { permissions = []; }
      exec(s, f, "FacebookConnectPlugin", "graphApi", [graphPath, permissions]);
  }
};