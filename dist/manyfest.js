"use strict";

function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
(function (f) {
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;
    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }
    g.Manyfest = f();
  }
})(function () {
  var define, module, exports;
  return function () {
    function r(e, n, t) {
      function o(i, f) {
        if (!n[i]) {
          if (!e[i]) {
            var c = "function" == typeof require && require;
            if (!f && c) return c(i, !0);
            if (u) return u(i, !0);
            var a = new Error("Cannot find module '" + i + "'");
            throw a.code = "MODULE_NOT_FOUND", a;
          }
          var p = n[i] = {
            exports: {}
          };
          e[i][0].call(p.exports, function (r) {
            var n = e[i][1][r];
            return o(n || r);
          }, p, p.exports, r, e, n, t);
        }
        return n[i].exports;
      }
      for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
      return o;
    }
    return r;
  }()({
    1: [function (require, module, exports) {
      /**
      * Fable Core Pre-initialization Service Base
      *
      * For a couple services, we need to be able to instantiate them before the Fable object is fully initialized.
      * This is a base class for those services.
      *
      * @author <steven@velozo.com>
      */

      class FableCoreServiceProviderBase {
        constructor(pOptions, pServiceHash) {
          this.fable = false;
          this.options = typeof pOptions === 'object' ? pOptions : {};
          this.serviceType = 'Unknown';

          // The hash will be a non-standard UUID ... the UUID service uses this base class!
          this.UUID = "CORESVC-".concat(Math.floor(Math.random() * (99999 - 10000) + 10000));
          this.Hash = typeof pServiceHash === 'string' ? pServiceHash : "".concat(this.UUID);
        }
        // After fable is initialized, it would be expected to be wired in as a normal service.
        connectFable(pFable) {
          this.fable = pFable;
          return true;
        }
      }
      _defineProperty(FableCoreServiceProviderBase, "isFableService", true);
      module.exports = FableCoreServiceProviderBase;
    }, {}],
    2: [function (require, module, exports) {
      /**
      * Fable Service Base
      * @author <steven@velozo.com>
      */

      class FableServiceProviderBase {
        constructor(pFable, pOptions, pServiceHash) {
          this.fable = pFable;
          this.options = typeof pOptions === 'object' ? pOptions : typeof pFable === 'object' && !pFable.isFable ? pFable : {};
          this.serviceType = 'Unknown';
          if (typeof pFable.getUUID == 'function') {
            this.UUID = pFable.getUUID();
          } else {
            this.UUID = "NoFABLESVC-".concat(Math.floor(Math.random() * (99999 - 10000) + 10000));
          }
          this.Hash = typeof pServiceHash === 'string' ? pServiceHash : "".concat(this.UUID);

          // Pull back a few things
          this.log = this.fable.log;
          this.servicesMap = this.fable.serviceMap;
          this.services = this.fable.services;
        }
      }
      _defineProperty(FableServiceProviderBase, "isFableService", true);
      module.exports = FableServiceProviderBase;
      module.exports.CoreServiceProviderBase = require('./Fable-ServiceProviderBase-Preinit.js');
    }, {
      "./Fable-ServiceProviderBase-Preinit.js": 1
    }],
    3: [function (require, module, exports) {
      // When a boxed property is passed in, it should have quotes of some
      // kind around it.
      //
      // For instance:
      // 		MyValues['Name']
      // 		MyValues["Age"]
      // 		MyValues[`Cost`]
      //
      // This function removes the wrapping quotes.
      //
      // Please note it *DOES NOT PARSE* template literals, so backticks just
      // end up doing the same thing as other quote types.
      //
      // TODO: Should template literals be processed?  If so what state do they have access to?  That should happen here if so.
      // TODO: Make a simple class include library with these
      const cleanWrapCharacters = (pCharacter, pString) => {
        if (pString.startsWith(pCharacter) && pString.endsWith(pCharacter)) {
          return pString.substring(1, pString.length - 1);
        } else {
          return pString;
        }
      };
      module.exports = cleanWrapCharacters;
    }, {}],
    4: [function (require, module, exports) {
      /**
      * @author <steven@velozo.com>
      */
      let libSimpleLog = require('./Manyfest-LogToConsole.js');

      /**
      * Hash Translation
      *
      * This is a very simple translation table for hashes, which allows the same schema to resolve
      * differently based on a loaded translation table.
      *
      * This is to prevent the requirement for mutating schemas over and over again when we want to
      * reuse the structure but look up data elements by different addresses.
      *
      * One side-effect of this is that a translation table can "override" the built-in hashes, since
      * this is always used to resolve hashes before any of the functionCallByHash(pHash, ...) perform
      * their lookups by hash.
      *
      * @class ManyfestHashTranslation
      */
      class ManyfestHashTranslation {
        constructor(pInfoLog, pErrorLog) {
          // Wire in logging
          this.logInfo = typeof pInfoLog === 'function' ? pInfoLog : libSimpleLog;
          this.logError = typeof pErrorLog === 'function' ? pErrorLog : libSimpleLog;
          this.translationTable = {};
        }
        translationCount() {
          return Object.keys(this.translationTable).length;
        }
        addTranslation(pTranslation) {
          // This adds a translation in the form of:
          // { "SourceHash": "DestinationHash", "SecondSourceHash":"SecondDestinationHash" }
          if (typeof pTranslation != 'object') {
            this.logError("Hash translation addTranslation expected a translation be type object but was passed in ".concat(typeof pTranslation));
            return false;
          }
          let tmpTranslationSources = Object.keys(pTranslation);
          tmpTranslationSources.forEach(pTranslationSource => {
            if (typeof pTranslation[pTranslationSource] != 'string') {
              this.logError("Hash translation addTranslation expected a translation destination hash for [".concat(pTranslationSource, "] to be a string but the referrant was a ").concat(typeof pTranslation[pTranslationSource]));
            } else {
              this.translationTable[pTranslationSource] = pTranslation[pTranslationSource];
            }
          });
        }
        removeTranslationHash(pTranslationHash) {
          if (this.translationTable.hasOwnProperty(pTranslationHash)) {
            delete this.translationTable[pTranslationHash];
          }
        }

        // This removes translations.
        // If passed a string, just removes the single one.
        // If passed an object, it does all the source keys.
        removeTranslation(pTranslation) {
          if (typeof pTranslation == 'string') {
            this.removeTranslationHash(pTranslation);
            return true;
          } else if (typeof pTranslation == 'object') {
            let tmpTranslationSources = Object.keys(pTranslation);
            tmpTranslationSources.forEach(pTranslationSource => {
              this.removeTranslation(pTranslationSource);
            });
            return true;
          } else {
            this.logError("Hash translation removeTranslation expected either a string or an object but the passed-in translation was type ".concat(typeof pTranslation));
            return false;
          }
        }
        clearTranslations() {
          this.translationTable = {};
        }
        translate(pTranslation) {
          if (this.translationTable.hasOwnProperty(pTranslation)) {
            return this.translationTable[pTranslation];
          } else {
            return pTranslation;
          }
        }
      }
      module.exports = ManyfestHashTranslation;
    }, {
      "./Manyfest-LogToConsole.js": 5
    }],
    5: [function (require, module, exports) {
      /**
      * @author <steven@velozo.com>
      */

      /**
      * Manyfest simple logging shim (for browser and dependency-free running)
      */

      const logToConsole = (pLogLine, pLogObject) => {
        let tmpLogLine = typeof pLogLine === 'string' ? pLogLine : '';
        console.log("[Manyfest] ".concat(tmpLogLine));
        if (pLogObject) console.log(JSON.stringify(pLogObject));
      };
      module.exports = logToConsole;
    }, {}],
    6: [function (require, module, exports) {
      /**
      * @author <steven@velozo.com>
      */
      let libSimpleLog = require('./Manyfest-LogToConsole.js');

      /**
      * Object Address Resolver
      *
      * IMPORTANT NOTE: This code is intentionally more verbose than necessary, to
      *                 be extremely clear what is going on in the recursion for
      *                 each of the three address resolution functions.
      *
      *                 Although there is some opportunity to repeat ourselves a
      *                 bit less in this codebase (e.g. with detection of arrays
      *                 versus objects versus direct properties), it can make
      *                 debugging.. challenging.  The minified version of the code
      *                 optimizes out almost anything repeated in here.  So please
      *                 be kind and rewind... meaning please keep the codebase less
      *                 terse and more verbose so humans can comprehend it.
      *
      *
      * @class ManyfestObjectAddressResolverCheckAddressExists
      */
      class ManyfestObjectAddressResolverCheckAddressExists {
        constructor(pInfoLog, pErrorLog) {
          // Wire in logging
          this.logInfo = typeof pInfoLog == 'function' ? pInfoLog : libSimpleLog;
          this.logError = typeof pErrorLog == 'function' ? pErrorLog : libSimpleLog;
        }

        // Check if an address exists.
        //
        // This is necessary because the getValueAtAddress function is ambiguous on
        // whether the element/property is actually there or not (it returns
        // undefined whether the property exists or not).  This function checks for
        // existance and returns true or false dependent.
        checkAddressExists(pObject, pAddress) {
          // TODO: Should these throw an error?
          // Make sure pObject is an object
          if (typeof pObject != 'object') return false;
          // Make sure pAddress is a string
          if (typeof pAddress != 'string') return false;

          // TODO: Make this work for things like SomeRootObject.Metadata["Some.People.Use.Bad.Object.Property.Names"]
          let tmpSeparatorIndex = pAddress.indexOf('.');

          // This is the terminal address string (no more dots so the RECUSION ENDS IN HERE somehow)
          if (tmpSeparatorIndex == -1) {
            // Check if the address refers to a boxed property
            let tmpBracketStartIndex = pAddress.indexOf('[');
            let tmpBracketStopIndex = pAddress.indexOf(']');
            // Boxed elements look like this:
            // 		MyValues[10]
            // 		MyValues['Name']
            // 		MyValues["Age"]
            // 		MyValues[`Cost`]
            //
            // When we are passed SomeObject["Name"] this code below recurses as if it were SomeObject.Name
            // The requirements to detect a boxed element are:
            //    1) The start bracket is after character 0
            if (tmpBracketStartIndex > 0
            //    2) The end bracket has something between them
            && tmpBracketStopIndex > tmpBracketStartIndex
            //    3) There is data
            && tmpBracketStopIndex - tmpBracketStartIndex > 1) {
              // The "Name" of the Object contained too the left of the bracket
              let tmpBoxedPropertyName = pAddress.substring(0, tmpBracketStartIndex).trim();

              // If the subproperty doesn't test as a proper Object, none of the rest of this is possible.
              // This is a rare case where Arrays testing as Objects is useful
              if (typeof pObject[tmpBoxedPropertyName] !== 'object') {
                return false;
              }

              // The "Reference" to the property within it, either an array element or object property
              let tmpBoxedPropertyReference = pAddress.substring(tmpBracketStartIndex + 1, tmpBracketStopIndex).trim();
              // Attempt to parse the reference as a number, which will be used as an array element
              let tmpBoxedPropertyNumber = parseInt(tmpBoxedPropertyReference, 10);

              // Guard: If the referrant is a number and the boxed property is not an array, or vice versa, return undefined.
              //        This seems confusing to me at first read, so explaination:
              //        Is the Boxed Object an Array?  TRUE
              //        And is the Reference inside the boxed Object not a number? TRUE
              //        -->  So when these are in agreement, it's an impossible access state
              if (Array.isArray(pObject[tmpBoxedPropertyName]) == isNaN(tmpBoxedPropertyNumber)) {
                return false;
              }

              //    4) If the middle part is *only* a number (no single, double or backtick quotes) it is an array element,
              //       otherwise we will try to treat it as a dynamic object property.
              if (isNaN(tmpBoxedPropertyNumber)) {
                // This isn't a number ... let's treat it as a dynamic object property.
                // We would expect the property to be wrapped in some kind of quotes so strip them
                tmpBoxedPropertyReference = this.cleanWrapCharacters('"', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters('`', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters("'", tmpBoxedPropertyReference);

                // Check if the property exists.
                return pObject[tmpBoxedPropertyName].hasOwnProperty(tmpBoxedPropertyReference);
              } else {
                // Use the new in operator to see if the element is in the array
                return tmpBoxedPropertyNumber in pObject[tmpBoxedPropertyName];
              }
            } else {
              // Check if the property exists
              return pObject.hasOwnProperty(pAddress);
            }
          } else {
            let tmpSubObjectName = pAddress.substring(0, tmpSeparatorIndex);
            let tmpNewAddress = pAddress.substring(tmpSeparatorIndex + 1);

            // Test if the tmpNewAddress is an array or object
            // Check if it's a boxed property
            let tmpBracketStartIndex = tmpSubObjectName.indexOf('[');
            let tmpBracketStopIndex = tmpSubObjectName.indexOf(']');
            // Boxed elements look like this:
            // 		MyValues[42]
            // 		MyValues['Color']
            // 		MyValues["Weight"]
            // 		MyValues[`Diameter`]
            //
            // When we are passed SomeObject["Name"] this code below recurses as if it were SomeObject.Name
            // The requirements to detect a boxed element are:
            //    1) The start bracket is after character 0
            if (tmpBracketStartIndex > 0
            //    2) The end bracket has something between them
            && tmpBracketStopIndex > tmpBracketStartIndex
            //    3) There is data
            && tmpBracketStopIndex - tmpBracketStartIndex > 1) {
              let tmpBoxedPropertyName = tmpSubObjectName.substring(0, tmpBracketStartIndex).trim();
              let tmpBoxedPropertyReference = tmpSubObjectName.substring(tmpBracketStartIndex + 1, tmpBracketStopIndex).trim();
              let tmpBoxedPropertyNumber = parseInt(tmpBoxedPropertyReference, 10);

              // Guard: If the referrant is a number and the boxed property is not an array, or vice versa, return undefined.
              //        This seems confusing to me at first read, so explaination:
              //        Is the Boxed Object an Array?  TRUE
              //        And is the Reference inside the boxed Object not a number? TRUE
              //        -->  So when these are in agreement, it's an impossible access state
              // This could be a failure in the recursion chain because they passed something like this in:
              //    StudentData.Sections.Algebra.Students[1].Tardy
              //       BUT
              //         StudentData.Sections.Algebra.Students is an object, so the [1].Tardy is not possible to access
              // This could be a failure in the recursion chain because they passed something like this in:
              //    StudentData.Sections.Algebra.Students["JaneDoe"].Grade
              //       BUT
              //         StudentData.Sections.Algebra.Students is an array, so the ["JaneDoe"].Grade is not possible to access
              // TODO: Should this be an error or something?  Should we keep a log of failures like this?
              if (Array.isArray(pObject[tmpBoxedPropertyName]) == isNaN(tmpBoxedPropertyNumber)) {
                // Because this is an impossible address, the property doesn't exist
                // TODO: Should we throw an error in this condition?
                return false;
              }

              //This is a bracketed value
              //    4) If the middle part is *only* a number (no single, double or backtick quotes) it is an array element,
              //       otherwise we will try to reat it as a dynamic object property.
              if (isNaN(tmpBoxedPropertyNumber)) {
                // This isn't a number ... let's treat it as a dynanmic object property.
                tmpBoxedPropertyReference = this.cleanWrapCharacters('"', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters('`', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters("'", tmpBoxedPropertyReference);

                // Recurse directly into the subobject
                return this.checkAddressExists(pObject[tmpBoxedPropertyName][tmpBoxedPropertyReference], tmpNewAddress);
              } else {
                // We parsed a valid number out of the boxed property name, so recurse into the array
                return this.checkAddressExists(pObject[tmpBoxedPropertyName][tmpBoxedPropertyNumber], tmpNewAddress);
              }
            }

            // If there is an object property already named for the sub object, but it isn't an object
            // then the system can't set the value in there.  Error and abort!
            if (pObject.hasOwnProperty(tmpSubObjectName) && typeof pObject[tmpSubObjectName] !== 'object') {
              return false;
            } else if (pObject.hasOwnProperty(tmpSubObjectName)) {
              // If there is already a subobject pass that to the recursive thingy
              return this.checkAddressExists(pObject[tmpSubObjectName], tmpNewAddress);
            } else {
              // Create a subobject and then pass that
              pObject[tmpSubObjectName] = {};
              return this.checkAddressExists(pObject[tmpSubObjectName], tmpNewAddress);
            }
          }
        }
      }
      ;
      module.exports = ManyfestObjectAddressResolverCheckAddressExists;
    }, {
      "./Manyfest-LogToConsole.js": 5
    }],
    7: [function (require, module, exports) {
      /**
      * @author <steven@velozo.com>
      */
      let libSimpleLog = require('./Manyfest-LogToConsole.js');
      let fCleanWrapCharacters = require('./Manyfest-CleanWrapCharacters.js');
      let fParseConditionals = require("../source/Manyfest-ParseConditionals.js");

      /**
      * Object Address Resolver - DeleteValue
      *
      * IMPORTANT NOTE: This code is intentionally more verbose than necessary, to
      *                 be extremely clear what is going on in the recursion for
      *                 each of the three address resolution functions.
      *
      *                 Although there is some opportunity to repeat ourselves a
      *                 bit less in this codebase (e.g. with detection of arrays
      *                 versus objects versus direct properties), it can make
      *                 debugging.. challenging.  The minified version of the code
      *                 optimizes out almost anything repeated in here.  So please
      *                 be kind and rewind... meaning please keep the codebase less
      *                 terse and more verbose so humans can comprehend it.
      *
      * TODO: Once we validate this pattern is good to go, break these out into
      *       three separate modules.
      *
      * @class ManyfestObjectAddressResolverDeleteValue
      */
      class ManyfestObjectAddressResolverDeleteValue {
        constructor(pInfoLog, pErrorLog) {
          // Wire in logging
          this.logInfo = typeof pInfoLog == 'function' ? pInfoLog : libSimpleLog;
          this.logError = typeof pErrorLog == 'function' ? pErrorLog : libSimpleLog;
          this.cleanWrapCharacters = fCleanWrapCharacters;
        }

        // TODO: Dry me
        checkFilters(pAddress, pRecord) {
          return fParseConditionals(this, pAddress, pRecord);
        }

        // Delete the value of an element at an address
        deleteValueAtAddress(pObject, pAddress, pParentAddress) {
          // Make sure pObject (the object we are meant to be recursing) is an object (which could be an array or object)
          if (typeof pObject != 'object') return undefined;
          // Make sure pAddress (the address we are resolving) is a string
          if (typeof pAddress != 'string') return undefined;
          // Stash the parent address for later resolution
          let tmpParentAddress = "";
          if (typeof pParentAddress == 'string') {
            tmpParentAddress = pParentAddress;
          }

          // TODO: Make this work for things like SomeRootObject.Metadata["Some.People.Use.Bad.Object.Property.Names"]
          let tmpSeparatorIndex = pAddress.indexOf('.');

          // This is the terminal address string (no more dots so the RECUSION ENDS IN HERE somehow)
          if (tmpSeparatorIndex == -1) {
            // Check if the address refers to a boxed property
            let tmpBracketStartIndex = pAddress.indexOf('[');
            let tmpBracketStopIndex = pAddress.indexOf(']');

            // Check for the Object Set Type marker.
            // Note this will not work with a bracket in the same address box set
            let tmpObjectTypeMarkerIndex = pAddress.indexOf('{}');

            // Boxed elements look like this:
            // 		MyValues[10]
            // 		MyValues['Name']
            // 		MyValues["Age"]
            // 		MyValues[`Cost`]
            //
            // When we are passed SomeObject["Name"] this code below recurses as if it were SomeObject.Name
            // The requirements to detect a boxed element are:
            //    1) The start bracket is after character 0
            if (tmpBracketStartIndex > 0
            //    2) The end bracket has something between them
            && tmpBracketStopIndex > tmpBracketStartIndex
            //    3) There is data
            && tmpBracketStopIndex - tmpBracketStartIndex > 1) {
              // The "Name" of the Object contained too the left of the bracket
              let tmpBoxedPropertyName = pAddress.substring(0, tmpBracketStartIndex).trim();

              // If the subproperty doesn't test as a proper Object, none of the rest of this is possible.
              // This is a rare case where Arrays testing as Objects is useful
              if (typeof pObject[tmpBoxedPropertyName] !== 'object') {
                return false;
              }

              // The "Reference" to the property within it, either an array element or object property
              let tmpBoxedPropertyReference = pAddress.substring(tmpBracketStartIndex + 1, tmpBracketStopIndex).trim();
              // Attempt to parse the reference as a number, which will be used as an array element
              let tmpBoxedPropertyNumber = parseInt(tmpBoxedPropertyReference, 10);

              // Guard: If the referrant is a number and the boxed property is not an array, or vice versa, return undefined.
              //        This seems confusing to me at first read, so explaination:
              //        Is the Boxed Object an Array?  TRUE
              //        And is the Reference inside the boxed Object not a number? TRUE
              //        -->  So when these are in agreement, it's an impossible access state
              if (Array.isArray(pObject[tmpBoxedPropertyName]) == isNaN(tmpBoxedPropertyNumber)) {
                return false;
              }

              //    4) If the middle part is *only* a number (no single, double or backtick quotes) it is an array element,
              //       otherwise we will try to treat it as a dynamic object property.
              if (isNaN(tmpBoxedPropertyNumber)) {
                // This isn't a number ... let's treat it as a dynamic object property.
                // We would expect the property to be wrapped in some kind of quotes so strip them
                tmpBoxedPropertyReference = this.cleanWrapCharacters('"', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters('`', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters("'", tmpBoxedPropertyReference);

                // Return the value in the property
                delete pObject[tmpBoxedPropertyName][tmpBoxedPropertyReference];
                return true;
              } else {
                delete pObject[tmpBoxedPropertyName][tmpBoxedPropertyNumber];
                return true;
              }
            }
            // The requirements to detect a boxed set element are:
            //    1) The start bracket is after character 0
            else if (tmpBracketStartIndex > 0
            //    2) The end bracket is after the start bracket
            && tmpBracketStopIndex > tmpBracketStartIndex
            //    3) There is nothing in the brackets
            && tmpBracketStopIndex - tmpBracketStartIndex == 1) {
              let tmpBoxedPropertyName = pAddress.substring(0, tmpBracketStartIndex).trim();
              if (!Array.isArray(pObject[tmpBoxedPropertyName])) {
                // We asked for a set from an array but it isnt' an array.
                return false;
              }
              let tmpInputArray = pObject[tmpBoxedPropertyName];
              // Count from the end to the beginning so splice doesn't %&%#$ up the array
              for (let i = tmpInputArray.length - 1; i >= 0; i--) {
                // The filtering is complex but allows config-based metaprogramming directly from schema
                let tmpKeepRecord = this.checkFilters(pAddress, tmpInputArray[i]);
                if (tmpKeepRecord) {
                  // Delete elements end to beginning
                  tmpInputArray.splice(i, 1);
                }
              }
              return true;
            }
            // The object has been flagged as an object set, so treat it as such
            else if (tmpObjectTypeMarkerIndex > 0) {
              let tmpObjectPropertyName = pAddress.substring(0, tmpObjectTypeMarkerIndex).trim();
              if (typeof pObject[tmpObjectPropertyName] != 'object') {
                // We asked for a set from an array but it isnt' an array.
                return false;
              }
              delete pObject[tmpObjectPropertyName];
              return true;
            } else {
              // Now is the point in recursion to return the value in the address
              delete pObject[pAddress];
              return true;
            }
          } else {
            let tmpSubObjectName = pAddress.substring(0, tmpSeparatorIndex);
            let tmpNewAddress = pAddress.substring(tmpSeparatorIndex + 1);

            // BOXED ELEMENTS
            // Test if the tmpNewAddress is an array or object
            // Check if it's a boxed property
            let tmpBracketStartIndex = tmpSubObjectName.indexOf('[');
            let tmpBracketStopIndex = tmpSubObjectName.indexOf(']');
            // Boxed elements look like this:
            // 		MyValues[42]
            // 		MyValues['Color']
            // 		MyValues["Weight"]
            // 		MyValues[`Diameter`]
            //
            // When we are passed SomeObject["Name"] this code below recurses as if it were SomeObject.Name
            // The requirements to detect a boxed element are:
            //    1) The start bracket is after character 0
            if (tmpBracketStartIndex > 0
            //    2) The end bracket has something between them
            && tmpBracketStopIndex > tmpBracketStartIndex
            //    3) There is data
            && tmpBracketStopIndex - tmpBracketStartIndex > 1) {
              let tmpBoxedPropertyName = tmpSubObjectName.substring(0, tmpBracketStartIndex).trim();
              let tmpBoxedPropertyReference = tmpSubObjectName.substring(tmpBracketStartIndex + 1, tmpBracketStopIndex).trim();
              let tmpBoxedPropertyNumber = parseInt(tmpBoxedPropertyReference, 10);

              // Guard: If the referrant is a number and the boxed property is not an array, or vice versa, return undefined.
              //        This seems confusing to me at first read, so explaination:
              //        Is the Boxed Object an Array?  TRUE
              //        And is the Reference inside the boxed Object not a number? TRUE
              //        -->  So when these are in agreement, it's an impossible access state
              // This could be a failure in the recursion chain because they passed something like this in:
              //    StudentData.Sections.Algebra.Students[1].Tardy
              //       BUT
              //         StudentData.Sections.Algebra.Students is an object, so the [1].Tardy is not possible to access
              // This could be a failure in the recursion chain because they passed something like this in:
              //    StudentData.Sections.Algebra.Students["JaneDoe"].Grade
              //       BUT
              //         StudentData.Sections.Algebra.Students is an array, so the ["JaneDoe"].Grade is not possible to access
              // TODO: Should this be an error or something?  Should we keep a log of failures like this?
              if (Array.isArray(pObject[tmpBoxedPropertyName]) == isNaN(tmpBoxedPropertyNumber)) {
                return false;
              }
              // Check if the boxed property is an object.
              if (typeof pObject[tmpBoxedPropertyName] != 'object') {
                return false;
              }

              //This is a bracketed value
              //    4) If the middle part is *only* a number (no single, double or backtick quotes) it is an array element,
              //       otherwise we will try to reat it as a dynamic object property.
              if (isNaN(tmpBoxedPropertyNumber)) {
                // This isn't a number ... let's treat it as a dynanmic object property.
                tmpBoxedPropertyReference = this.cleanWrapCharacters('"', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters('`', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters("'", tmpBoxedPropertyReference);

                // Continue to manage the parent address for recursion
                tmpParentAddress = "".concat(tmpParentAddress).concat(tmpParentAddress.length > 0 ? '.' : '').concat(tmpSubObjectName);
                // Recurse directly into the subobject
                return this.deleteValueAtAddress(pObject[tmpBoxedPropertyName][tmpBoxedPropertyReference], tmpNewAddress, tmpParentAddress);
              } else {
                // Continue to manage the parent address for recursion
                tmpParentAddress = "".concat(tmpParentAddress).concat(tmpParentAddress.length > 0 ? '.' : '').concat(tmpSubObjectName);
                // We parsed a valid number out of the boxed property name, so recurse into the array
                return this.deleteValueAtAddress(pObject[tmpBoxedPropertyName][tmpBoxedPropertyNumber], tmpNewAddress, tmpParentAddress);
              }
            }
            // The requirements to detect a boxed set element are:
            //    1) The start bracket is after character 0
            else if (tmpBracketStartIndex > 0
            //    2) The end bracket is after the start bracket
            && tmpBracketStopIndex > tmpBracketStartIndex
            //    3) There is nothing in the brackets
            && tmpBracketStopIndex - tmpBracketStartIndex == 1) {
              let tmpBoxedPropertyName = pAddress.substring(0, tmpBracketStartIndex).trim();
              if (!Array.isArray(pObject[tmpBoxedPropertyName])) {
                // We asked for a set from an array but it isnt' an array.
                return false;
              }

              // We need to enumerate the array and grab the addresses from there.
              let tmpArrayProperty = pObject[tmpBoxedPropertyName];
              // Managing the parent address is a bit more complex here -- the box will be added for each element.
              tmpParentAddress = "".concat(tmpParentAddress).concat(tmpParentAddress.length > 0 ? '.' : '').concat(tmpBoxedPropertyName);
              // The container object is where we have the "Address":SOMEVALUE pairs
              let tmpContainerObject = {};
              for (let i = 0; i < tmpArrayProperty.length; i++) {
                let tmpPropertyParentAddress = "".concat(tmpParentAddress, "[").concat(i, "]");
                let tmpValue = this.deleteValueAtAddress(pObject[tmpBoxedPropertyName][i], tmpNewAddress, tmpPropertyParentAddress);
                tmpContainerObject["".concat(tmpPropertyParentAddress, ".").concat(tmpNewAddress)] = tmpValue;
              }
              return tmpContainerObject;
            }

            // OBJECT SET
            // Note this will not work with a bracket in the same address box set
            let tmpObjectTypeMarkerIndex = pAddress.indexOf('{}');
            if (tmpObjectTypeMarkerIndex > 0) {
              let tmpObjectPropertyName = pAddress.substring(0, tmpObjectTypeMarkerIndex).trim();
              if (typeof pObject[tmpObjectPropertyName] != 'object') {
                // We asked for a set from an array but it isnt' an array.
                return false;
              }

              // We need to enumerate the Object and grab the addresses from there.
              let tmpObjectProperty = pObject[tmpObjectPropertyName];
              let tmpObjectPropertyKeys = Object.keys(tmpObjectProperty);
              // Managing the parent address is a bit more complex here -- the box will be added for each element.
              tmpParentAddress = "".concat(tmpParentAddress).concat(tmpParentAddress.length > 0 ? '.' : '').concat(tmpObjectPropertyName);
              // The container object is where we have the "Address":SOMEVALUE pairs
              let tmpContainerObject = {};
              for (let i = 0; i < tmpObjectPropertyKeys.length; i++) {
                let tmpPropertyParentAddress = "".concat(tmpParentAddress, ".").concat(tmpObjectPropertyKeys[i]);
                let tmpValue = this.deleteValueAtAddress(pObject[tmpObjectPropertyName][tmpObjectPropertyKeys[i]], tmpNewAddress, tmpPropertyParentAddress);

                // The filtering is complex but allows config-based metaprogramming directly from schema
                let tmpKeepRecord = this.checkFilters(pAddress, tmpValue);
                if (tmpKeepRecord) {
                  tmpContainerObject["".concat(tmpPropertyParentAddress, ".").concat(tmpNewAddress)] = tmpValue;
                }
              }
              return tmpContainerObject;
            }

            // If there is an object property already named for the sub object, but it isn't an object
            // then the system can't set the value in there.  Error and abort!
            if (pObject.hasOwnProperty(tmpSubObjectName) && typeof pObject[tmpSubObjectName] !== 'object') {
              return undefined;
            } else if (pObject.hasOwnProperty(tmpSubObjectName)) {
              // If there is already a subobject pass that to the recursive thingy
              // Continue to manage the parent address for recursion
              tmpParentAddress = "".concat(tmpParentAddress).concat(tmpParentAddress.length > 0 ? '.' : '').concat(tmpSubObjectName);
              return this.deleteValueAtAddress(pObject[tmpSubObjectName], tmpNewAddress, tmpParentAddress);
            } else {
              // Create a subobject and then pass that
              // Continue to manage the parent address for recursion
              tmpParentAddress = "".concat(tmpParentAddress).concat(tmpParentAddress.length > 0 ? '.' : '').concat(tmpSubObjectName);
              pObject[tmpSubObjectName] = {};
              return this.deleteValueAtAddress(pObject[tmpSubObjectName], tmpNewAddress, tmpParentAddress);
            }
          }
        }
      }
      ;
      module.exports = ManyfestObjectAddressResolverDeleteValue;
    }, {
      "../source/Manyfest-ParseConditionals.js": 11,
      "./Manyfest-CleanWrapCharacters.js": 3,
      "./Manyfest-LogToConsole.js": 5
    }],
    8: [function (require, module, exports) {
      /**
      * @author <steven@velozo.com>
      */
      let libSimpleLog = require('./Manyfest-LogToConsole.js');
      let fCleanWrapCharacters = require('./Manyfest-CleanWrapCharacters.js');
      let fParseConditionals = require("../source/Manyfest-ParseConditionals.js");

      /**
      * Object Address Resolver - GetValue
      *
      * IMPORTANT NOTE: This code is intentionally more verbose than necessary, to
      *                 be extremely clear what is going on in the recursion for
      *                 each of the three address resolution functions.
      *
      *                 Although there is some opportunity to repeat ourselves a
      *                 bit less in this codebase (e.g. with detection of arrays
      *                 versus objects versus direct properties), it can make
      *                 debugging.. challenging.  The minified version of the code
      *                 optimizes out almost anything repeated in here.  So please
      *                 be kind and rewind... meaning please keep the codebase less
      *                 terse and more verbose so humans can comprehend it.
      *
      * TODO: Once we validate this pattern is good to go, break these out into
      *       three separate modules.
      *
      * @class ManyfestObjectAddressResolverGetValue
      */
      class ManyfestObjectAddressResolverGetValue {
        constructor(pInfoLog, pErrorLog) {
          // Wire in logging
          this.logInfo = typeof pInfoLog == 'function' ? pInfoLog : libSimpleLog;
          this.logError = typeof pErrorLog == 'function' ? pErrorLog : libSimpleLog;
          this.cleanWrapCharacters = fCleanWrapCharacters;
        }
        checkFilters(pAddress, pRecord) {
          return fParseConditionals(this, pAddress, pRecord);
        }

        // Get the value of an element at an address
        getValueAtAddress(pObject, pAddress, pParentAddress, pRootObject) {
          // Make sure pObject (the object we are meant to be recursing) is an object (which could be an array or object)
          if (typeof pObject != 'object') return undefined;
          // Make sure pAddress (the address we are resolving) is a string
          if (typeof pAddress != 'string') return undefined;
          // Stash the parent address for later resolution
          let tmpParentAddress = "";
          if (typeof pParentAddress == 'string') {
            tmpParentAddress = pParentAddress;
          }

          // Set the root object to the passed-in object if it isn't set yet.  This is expected to be the root object.
          let tmpRootObject = typeof pRootObject == 'undefined' ? pObject : pRootObject;

          // TODO: Make this work for things like SomeRootObject.Metadata["Some.People.Use.Bad.Object.Property.Names"]
          let tmpSeparatorIndex = pAddress.indexOf('.');

          // Adding simple back-navigation in objects
          if (tmpSeparatorIndex == 0) {
            // Given an address of "Bundle.Contract.IDContract...Project.IDProject" the ... would be interpreted as two back-navigations from IDContract.
            // When the address is passed in, though, the first . is already eliminated.  So we can count the dots.
            let tmpParentAddressParts = tmpParentAddress.split('.');
            let tmpBackNavigationCount = 0;

            // Count the number of dots
            for (let i = 0; i < pAddress.length; i++) {
              if (pAddress.charAt(i) != '.') {
                break;
              }
              tmpBackNavigationCount++;
            }
            let tmpParentAddressLength = tmpParentAddressParts.length - tmpBackNavigationCount;
            if (tmpParentAddressLength < 0) {
              // We are trying to back navigate more than we can.
              // TODO: Should this be undefined or should we bank out at the bottom and try to go forward?
              // This seems safest for now.
              return undefined;
            } else {
              // We are trying to back navigate to a parent object.
              // Recurse with the back-propagated parent address, and, the new address without the back-navigation dots.
              let tmpRecurseAddress = pAddress.slice(tmpBackNavigationCount);
              if (tmpParentAddressLength > 0) {
                tmpRecurseAddress = "".concat(tmpParentAddressParts.slice(0, tmpParentAddressLength).join('.'), ".").concat(tmpRecurseAddress);
              }
              this.logInfo("Back-navigation detected.  Recursing back to address [".concat(tmpRecurseAddress, "]"));
              return this.getValueAtAddress(tmpRootObject, tmpRecurseAddress);
            }
          }

          // This is the terminal address string (no more dots so the RECUSION ENDS IN HERE somehow)
          if (tmpSeparatorIndex == -1) {
            // Check if the address refers to a boxed property
            let tmpBracketStartIndex = pAddress.indexOf('[');
            let tmpBracketStopIndex = pAddress.indexOf(']');

            // Check for the Object Set Type marker.
            // Note this will not work with a bracket in the same address box set
            let tmpObjectTypeMarkerIndex = pAddress.indexOf('{}');

            // Boxed elements look like this:
            // 		MyValues[10]
            // 		MyValues['Name']
            // 		MyValues["Age"]
            // 		MyValues[`Cost`]
            //
            // When we are passed SomeObject["Name"] this code below recurses as if it were SomeObject.Name
            // The requirements to detect a boxed element are:
            //    1) The start bracket is after character 0
            if (tmpBracketStartIndex > 0
            //    2) The end bracket has something between them
            && tmpBracketStopIndex > tmpBracketStartIndex
            //    3) There is data
            && tmpBracketStopIndex - tmpBracketStartIndex > 1) {
              // The "Name" of the Object contained too the left of the bracket
              let tmpBoxedPropertyName = pAddress.substring(0, tmpBracketStartIndex).trim();

              // If the subproperty doesn't test as a proper Object, none of the rest of this is possible.
              // This is a rare case where Arrays testing as Objects is useful
              if (typeof pObject[tmpBoxedPropertyName] !== 'object') {
                return undefined;
              }

              // The "Reference" to the property within it, either an array element or object property
              let tmpBoxedPropertyReference = pAddress.substring(tmpBracketStartIndex + 1, tmpBracketStopIndex).trim();
              // Attempt to parse the reference as a number, which will be used as an array element
              let tmpBoxedPropertyNumber = parseInt(tmpBoxedPropertyReference, 10);

              // Guard: If the referrant is a number and the boxed property is not an array, or vice versa, return undefined.
              //        This seems confusing to me at first read, so explaination:
              //        Is the Boxed Object an Array?  TRUE
              //        And is the Reference inside the boxed Object not a number? TRUE
              //        -->  So when these are in agreement, it's an impossible access state
              if (Array.isArray(pObject[tmpBoxedPropertyName]) == isNaN(tmpBoxedPropertyNumber)) {
                return undefined;
              }

              //    4) If the middle part is *only* a number (no single, double or backtick quotes) it is an array element,
              //       otherwise we will try to treat it as a dynamic object property.
              if (isNaN(tmpBoxedPropertyNumber)) {
                // This isn't a number ... let's treat it as a dynamic object property.
                // We would expect the property to be wrapped in some kind of quotes so strip them
                tmpBoxedPropertyReference = this.cleanWrapCharacters('"', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters('`', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters("'", tmpBoxedPropertyReference);

                // Return the value in the property
                return pObject[tmpBoxedPropertyName][tmpBoxedPropertyReference];
              } else {
                return pObject[tmpBoxedPropertyName][tmpBoxedPropertyNumber];
              }
            }
            // The requirements to detect a boxed set element are:
            //    1) The start bracket is after character 0
            else if (tmpBracketStartIndex > 0
            //    2) The end bracket is after the start bracket
            && tmpBracketStopIndex > tmpBracketStartIndex
            //    3) There is nothing in the brackets
            && tmpBracketStopIndex - tmpBracketStartIndex == 1) {
              let tmpBoxedPropertyName = pAddress.substring(0, tmpBracketStartIndex).trim();
              if (!Array.isArray(pObject[tmpBoxedPropertyName])) {
                // We asked for a set from an array but it isnt' an array.
                return false;
              }
              let tmpInputArray = pObject[tmpBoxedPropertyName];
              let tmpOutputArray = [];
              for (let i = 0; i < tmpInputArray.length; i++) {
                // The filtering is complex but allows config-based metaprogramming directly from schema
                let tmpKeepRecord = this.checkFilters(pAddress, tmpInputArray[i]);
                if (tmpKeepRecord) {
                  tmpOutputArray.push(tmpInputArray[i]);
                }
              }
              return tmpOutputArray;
            }
            // The object has been flagged as an object set, so treat it as such
            else if (tmpObjectTypeMarkerIndex > 0) {
              let tmpObjectPropertyName = pAddress.substring(0, tmpObjectTypeMarkerIndex).trim();
              if (typeof pObject[tmpObjectPropertyName] != 'object') {
                // We asked for a set from an array but it isnt' an array.
                return false;
              }
              return pObject[tmpObjectPropertyName];
            } else {
              // Now is the point in recursion to return the value in the address
              return pObject[pAddress];
            }
          } else {
            let tmpSubObjectName = pAddress.substring(0, tmpSeparatorIndex);
            let tmpNewAddress = pAddress.substring(tmpSeparatorIndex + 1);

            // BOXED ELEMENTS
            // Test if the tmpNewAddress is an array or object
            // Check if it's a boxed property
            let tmpBracketStartIndex = tmpSubObjectName.indexOf('[');
            let tmpBracketStopIndex = tmpSubObjectName.indexOf(']');
            // Boxed elements look like this:
            // 		MyValues[42]
            // 		MyValues['Color']
            // 		MyValues["Weight"]
            // 		MyValues[`Diameter`]
            //
            // When we are passed SomeObject["Name"] this code below recurses as if it were SomeObject.Name
            // The requirements to detect a boxed element are:
            //    1) The start bracket is after character 0
            if (tmpBracketStartIndex > 0
            //    2) The end bracket has something between them
            && tmpBracketStopIndex > tmpBracketStartIndex
            //    3) There is data
            && tmpBracketStopIndex - tmpBracketStartIndex > 1) {
              let tmpBoxedPropertyName = tmpSubObjectName.substring(0, tmpBracketStartIndex).trim();
              let tmpBoxedPropertyReference = tmpSubObjectName.substring(tmpBracketStartIndex + 1, tmpBracketStopIndex).trim();
              let tmpBoxedPropertyNumber = parseInt(tmpBoxedPropertyReference, 10);

              // Guard: If the referrant is a number and the boxed property is not an array, or vice versa, return undefined.
              //        This seems confusing to me at first read, so explaination:
              //        Is the Boxed Object an Array?  TRUE
              //        And is the Reference inside the boxed Object not a number? TRUE
              //        -->  So when these are in agreement, it's an impossible access state
              // This could be a failure in the recursion chain because they passed something like this in:
              //    StudentData.Sections.Algebra.Students[1].Tardy
              //       BUT
              //         StudentData.Sections.Algebra.Students is an object, so the [1].Tardy is not possible to access
              // This could be a failure in the recursion chain because they passed something like this in:
              //    StudentData.Sections.Algebra.Students["JaneDoe"].Grade
              //       BUT
              //         StudentData.Sections.Algebra.Students is an array, so the ["JaneDoe"].Grade is not possible to access
              // TODO: Should this be an error or something?  Should we keep a log of failures like this?
              if (Array.isArray(pObject[tmpBoxedPropertyName]) == isNaN(tmpBoxedPropertyNumber)) {
                return undefined;
              }
              // Check if the boxed property is an object.
              if (typeof pObject[tmpBoxedPropertyName] != 'object') {
                return undefined;
              }

              //This is a bracketed value
              //    4) If the middle part is *only* a number (no single, double or backtick quotes) it is an array element,
              //       otherwise we will try to reat it as a dynamic object property.
              if (isNaN(tmpBoxedPropertyNumber)) {
                // This isn't a number ... let's treat it as a dynanmic object property.
                tmpBoxedPropertyReference = this.cleanWrapCharacters('"', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters('`', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters("'", tmpBoxedPropertyReference);

                // Continue to manage the parent address for recursion
                tmpParentAddress = "".concat(tmpParentAddress).concat(tmpParentAddress.length > 0 ? '.' : '').concat(tmpSubObjectName);
                // Recurse directly into the subobject
                return this.getValueAtAddress(pObject[tmpBoxedPropertyName][tmpBoxedPropertyReference], tmpNewAddress, tmpParentAddress, tmpRootObject);
              } else {
                // Continue to manage the parent address for recursion
                tmpParentAddress = "".concat(tmpParentAddress).concat(tmpParentAddress.length > 0 ? '.' : '').concat(tmpSubObjectName);
                // We parsed a valid number out of the boxed property name, so recurse into the array
                return this.getValueAtAddress(pObject[tmpBoxedPropertyName][tmpBoxedPropertyNumber], tmpNewAddress, tmpParentAddress, tmpRootObject);
              }
            }
            // The requirements to detect a boxed set element are:
            //    1) The start bracket is after character 0
            else if (tmpBracketStartIndex > 0
            //    2) The end bracket is after the start bracket
            && tmpBracketStopIndex > tmpBracketStartIndex
            //    3) There is nothing in the brackets
            && tmpBracketStopIndex - tmpBracketStartIndex == 1) {
              let tmpBoxedPropertyName = pAddress.substring(0, tmpBracketStartIndex).trim();
              if (!Array.isArray(pObject[tmpBoxedPropertyName])) {
                // We asked for a set from an array but it isnt' an array.
                return false;
              }

              // We need to enumerate the array and grab the addresses from there.
              let tmpArrayProperty = pObject[tmpBoxedPropertyName];
              // Managing the parent address is a bit more complex here -- the box will be added for each element.
              tmpParentAddress = "".concat(tmpParentAddress).concat(tmpParentAddress.length > 0 ? '.' : '').concat(tmpBoxedPropertyName);
              // The container object is where we have the "Address":SOMEVALUE pairs
              let tmpContainerObject = {};
              for (let i = 0; i < tmpArrayProperty.length; i++) {
                let tmpPropertyParentAddress = "".concat(tmpParentAddress, "[").concat(i, "]");
                let tmpValue = this.getValueAtAddress(pObject[tmpBoxedPropertyName][i], tmpNewAddress, tmpPropertyParentAddress, tmpRootObject);
                tmpContainerObject["".concat(tmpPropertyParentAddress, ".").concat(tmpNewAddress)] = tmpValue;
              }
              return tmpContainerObject;
            }

            // OBJECT SET
            // Note this will not work with a bracket in the same address box set
            let tmpObjectTypeMarkerIndex = pAddress.indexOf('{}');
            if (tmpObjectTypeMarkerIndex > 0) {
              let tmpObjectPropertyName = pAddress.substring(0, tmpObjectTypeMarkerIndex).trim();
              if (typeof pObject[tmpObjectPropertyName] != 'object') {
                // We asked for a set from an array but it isnt' an array.
                return false;
              }

              // We need to enumerate the Object and grab the addresses from there.
              let tmpObjectProperty = pObject[tmpObjectPropertyName];
              let tmpObjectPropertyKeys = Object.keys(tmpObjectProperty);
              // Managing the parent address is a bit more complex here -- the box will be added for each element.
              tmpParentAddress = "".concat(tmpParentAddress).concat(tmpParentAddress.length > 0 ? '.' : '').concat(tmpObjectPropertyName);
              // The container object is where we have the "Address":SOMEVALUE pairs
              let tmpContainerObject = {};
              for (let i = 0; i < tmpObjectPropertyKeys.length; i++) {
                let tmpPropertyParentAddress = "".concat(tmpParentAddress, ".").concat(tmpObjectPropertyKeys[i]);
                let tmpValue = this.getValueAtAddress(pObject[tmpObjectPropertyName][tmpObjectPropertyKeys[i]], tmpNewAddress, tmpPropertyParentAddress, tmpRootObject);

                // The filtering is complex but allows config-based metaprogramming directly from schema
                let tmpKeepRecord = this.checkFilters(pAddress, tmpValue);
                if (tmpKeepRecord) {
                  tmpContainerObject["".concat(tmpPropertyParentAddress, ".").concat(tmpNewAddress)] = tmpValue;
                }
              }
              return tmpContainerObject;
            }

            // If there is an object property already named for the sub object, but it isn't an object
            // then the system can't set the value in there.  Error and abort!
            if (pObject.hasOwnProperty(tmpSubObjectName) && typeof pObject[tmpSubObjectName] !== 'object') {
              return undefined;
            } else if (pObject.hasOwnProperty(tmpSubObjectName)) {
              // If there is already a subobject pass that to the recursive thingy
              // Continue to manage the parent address for recursion
              tmpParentAddress = "".concat(tmpParentAddress).concat(tmpParentAddress.length > 0 ? '.' : '').concat(tmpSubObjectName);
              return this.getValueAtAddress(pObject[tmpSubObjectName], tmpNewAddress, tmpParentAddress, tmpRootObject);
            } else {
              // Create a subobject and then pass that
              // Continue to manage the parent address for recursion
              tmpParentAddress = "".concat(tmpParentAddress).concat(tmpParentAddress.length > 0 ? '.' : '').concat(tmpSubObjectName);
              pObject[tmpSubObjectName] = {};
              return this.getValueAtAddress(pObject[tmpSubObjectName], tmpNewAddress, tmpParentAddress, tmpRootObject);
            }
          }
        }
      }
      ;
      module.exports = ManyfestObjectAddressResolverGetValue;
    }, {
      "../source/Manyfest-ParseConditionals.js": 11,
      "./Manyfest-CleanWrapCharacters.js": 3,
      "./Manyfest-LogToConsole.js": 5
    }],
    9: [function (require, module, exports) {
      /**
      * @author <steven@velozo.com>
      */
      let libSimpleLog = require('./Manyfest-LogToConsole.js');
      let fCleanWrapCharacters = require('./Manyfest-CleanWrapCharacters.js');

      /**
      * Object Address Resolver - SetValue
      *
      * IMPORTANT NOTE: This code is intentionally more verbose than necessary, to
      *                 be extremely clear what is going on in the recursion for
      *                 each of the three address resolution functions.
      *
      *                 Although there is some opportunity to repeat ourselves a
      *                 bit less in this codebase (e.g. with detection of arrays
      *                 versus objects versus direct properties), it can make
      *                 debugging.. challenging.  The minified version of the code
      *                 optimizes out almost anything repeated in here.  So please
      *                 be kind and rewind... meaning please keep the codebase less
      *                 terse and more verbose so humans can comprehend it.
      *
      *
      * @class ManyfestObjectAddressSetValue
      */
      class ManyfestObjectAddressSetValue {
        constructor(pInfoLog, pErrorLog) {
          // Wire in logging
          this.logInfo = typeof pInfoLog == 'function' ? pInfoLog : libSimpleLog;
          this.logError = typeof pErrorLog == 'function' ? pErrorLog : libSimpleLog;
          this.cleanWrapCharacters = fCleanWrapCharacters;
        }

        // Set the value of an element at an address
        setValueAtAddress(pObject, pAddress, pValue) {
          // Make sure pObject is an object
          if (typeof pObject != 'object') return false;
          // Make sure pAddress is a string
          if (typeof pAddress != 'string') return false;
          let tmpSeparatorIndex = pAddress.indexOf('.');
          if (tmpSeparatorIndex == -1) {
            // Check if it's a boxed property
            let tmpBracketStartIndex = pAddress.indexOf('[');
            let tmpBracketStopIndex = pAddress.indexOf(']');
            // Boxed elements look like this:
            // 		MyValues[10]
            // 		MyValues['Name']
            // 		MyValues["Age"]
            // 		MyValues[`Cost`]
            //
            // When we are passed SomeObject["Name"] this code below recurses as if it were SomeObject.Name
            // The requirements to detect a boxed element are:
            //    1) The start bracket is after character 0
            if (tmpBracketStartIndex > 0
            //    2) The end bracket has something between them
            && tmpBracketStopIndex > tmpBracketStartIndex
            //    3) There is data
            && tmpBracketStopIndex - tmpBracketStartIndex > 1) {
              // The "Name" of the Object contained too the left of the bracket
              let tmpBoxedPropertyName = pAddress.substring(0, tmpBracketStartIndex).trim();

              // If the subproperty doesn't test as a proper Object, none of the rest of this is possible.
              // This is a rare case where Arrays testing as Objects is useful
              if (typeof pObject[tmpBoxedPropertyName] !== 'object') {
                return false;
              }

              // The "Reference" to the property within it, either an array element or object property
              let tmpBoxedPropertyReference = pAddress.substring(tmpBracketStartIndex + 1, tmpBracketStopIndex).trim();
              // Attempt to parse the reference as a number, which will be used as an array element
              let tmpBoxedPropertyNumber = parseInt(tmpBoxedPropertyReference, 10);

              // Guard: If the referrant is a number and the boxed property is not an array, or vice versa, return undefined.
              //        This seems confusing to me at first read, so explaination:
              //        Is the Boxed Object an Array?  TRUE
              //        And is the Reference inside the boxed Object not a number? TRUE
              //        -->  So when these are in agreement, it's an impossible access state
              if (Array.isArray(pObject[tmpBoxedPropertyName]) == isNaN(tmpBoxedPropertyNumber)) {
                return false;
              }

              //    4) If the middle part is *only* a number (no single, double or backtick quotes) it is an array element,
              //       otherwise we will try to treat it as a dynamic object property.
              if (isNaN(tmpBoxedPropertyNumber)) {
                // This isn't a number ... let's treat it as a dynamic object property.
                // We would expect the property to be wrapped in some kind of quotes so strip them
                tmpBoxedPropertyReference = this.cleanWrapCharacters('"', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters('`', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters("'", tmpBoxedPropertyReference);

                // Return the value in the property
                pObject[tmpBoxedPropertyName][tmpBoxedPropertyReference] = pValue;
                return true;
              } else {
                pObject[tmpBoxedPropertyName][tmpBoxedPropertyNumber] = pValue;
                return true;
              }
            } else {
              // Now is the time in recursion to set the value in the object
              pObject[pAddress] = pValue;
              return true;
            }
          } else {
            let tmpSubObjectName = pAddress.substring(0, tmpSeparatorIndex);
            let tmpNewAddress = pAddress.substring(tmpSeparatorIndex + 1);

            // Test if the tmpNewAddress is an array or object
            // Check if it's a boxed property
            let tmpBracketStartIndex = tmpSubObjectName.indexOf('[');
            let tmpBracketStopIndex = tmpSubObjectName.indexOf(']');
            // Boxed elements look like this:
            // 		MyValues[42]
            // 		MyValues['Color']
            // 		MyValues["Weight"]
            // 		MyValues[`Diameter`]
            //
            // When we are passed SomeObject["Name"] this code below recurses as if it were SomeObject.Name
            // The requirements to detect a boxed element are:
            //    1) The start bracket is after character 0
            if (tmpBracketStartIndex > 0
            //    2) The end bracket has something between them
            && tmpBracketStopIndex > tmpBracketStartIndex
            //    3) There is data
            && tmpBracketStopIndex - tmpBracketStartIndex > 1) {
              let tmpBoxedPropertyName = tmpSubObjectName.substring(0, tmpBracketStartIndex).trim();
              let tmpBoxedPropertyReference = tmpSubObjectName.substring(tmpBracketStartIndex + 1, tmpBracketStopIndex).trim();
              let tmpBoxedPropertyNumber = parseInt(tmpBoxedPropertyReference, 10);

              // Guard: If the referrant is a number and the boxed property is not an array, or vice versa, return undefined.
              //        This seems confusing to me at first read, so explaination:
              //        Is the Boxed Object an Array?  TRUE
              //        And is the Reference inside the boxed Object not a number? TRUE
              //        -->  So when these are in agreement, it's an impossible access state
              // This could be a failure in the recursion chain because they passed something like this in:
              //    StudentData.Sections.Algebra.Students[1].Tardy
              //       BUT
              //         StudentData.Sections.Algebra.Students is an object, so the [1].Tardy is not possible to access
              // This could be a failure in the recursion chain because they passed something like this in:
              //    StudentData.Sections.Algebra.Students["JaneDoe"].Grade
              //       BUT
              //         StudentData.Sections.Algebra.Students is an array, so the ["JaneDoe"].Grade is not possible to access
              // TODO: Should this be an error or something?  Should we keep a log of failures like this?
              if (Array.isArray(pObject[tmpBoxedPropertyName]) == isNaN(tmpBoxedPropertyNumber)) {
                return false;
              }

              //This is a bracketed value
              //    4) If the middle part is *only* a number (no single, double or backtick quotes) it is an array element,
              //       otherwise we will try to reat it as a dynamic object property.
              if (isNaN(tmpBoxedPropertyNumber)) {
                // This isn't a number ... let's treat it as a dynanmic object property.
                tmpBoxedPropertyReference = this.cleanWrapCharacters('"', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters('`', tmpBoxedPropertyReference);
                tmpBoxedPropertyReference = this.cleanWrapCharacters("'", tmpBoxedPropertyReference);

                // Recurse directly into the subobject
                return this.setValueAtAddress(pObject[tmpBoxedPropertyName][tmpBoxedPropertyReference], tmpNewAddress, pValue);
              } else {
                // We parsed a valid number out of the boxed property name, so recurse into the array
                return this.setValueAtAddress(pObject[tmpBoxedPropertyName][tmpBoxedPropertyNumber], tmpNewAddress, pValue);
              }
            }

            // If there is an object property already named for the sub object, but it isn't an object
            // then the system can't set the value in there.  Error and abort!
            if (pObject.hasOwnProperty(tmpSubObjectName) && typeof pObject[tmpSubObjectName] !== 'object') {
              if (!pObject.hasOwnProperty('__ERROR')) pObject['__ERROR'] = {};
              // Put it in an error object so data isn't lost
              pObject['__ERROR'][pAddress] = pValue;
              return false;
            } else if (pObject.hasOwnProperty(tmpSubObjectName)) {
              // If there is already a subobject pass that to the recursive thingy
              return this.setValueAtAddress(pObject[tmpSubObjectName], tmpNewAddress, pValue);
            } else {
              // Create a subobject and then pass that
              pObject[tmpSubObjectName] = {};
              return this.setValueAtAddress(pObject[tmpSubObjectName], tmpNewAddress, pValue);
            }
          }
        }
      }
      ;
      module.exports = ManyfestObjectAddressSetValue;
    }, {
      "./Manyfest-CleanWrapCharacters.js": 3,
      "./Manyfest-LogToConsole.js": 5
    }],
    10: [function (require, module, exports) {
      /**
      * @author <steven@velozo.com>
      */
      let libSimpleLog = require('./Manyfest-LogToConsole.js');

      /**
      * Object Address Generation
      *
      * Automagically generate addresses and properties based on a passed-in object,
      * to be used for easy creation of schemas.  Meant to simplify the lives of
      * developers wanting to create schemas without typing a bunch of stuff.
      *
      * IMPORTANT NOTE: This code is intentionally more verbose than necessary, to
      *                 be extremely clear what is going on in the recursion for
      *                 each of the three address resolution functions.
      *
      *                 Although there is some opportunity to repeat ourselves a
      *                 bit less in this codebase (e.g. with detection of arrays
      *                 versus objects versus direct properties), it can make
      *                 debugging.. challenging.  The minified version of the code
      *                 optimizes out almost anything repeated in here.  So please
      *                 be kind and rewind... meaning please keep the codebase less
      *                 terse and more verbose so humans can comprehend it.
      *
      *
      * @class ManyfestObjectAddressGeneration
      */
      class ManyfestObjectAddressGeneration {
        constructor(pInfoLog, pErrorLog) {
          // Wire in logging
          this.logInfo = typeof pInfoLog == 'function' ? pInfoLog : libSimpleLog;
          this.logError = typeof pErrorLog == 'function' ? pErrorLog : libSimpleLog;
        }

        // generateAddressses
        //
        // This flattens an object into a set of key:value pairs for *EVERY SINGLE
        // POSSIBLE ADDRESS* in the object.  It can get ... really insane really
        // quickly.  This is not meant to be used directly to generate schemas, but
        // instead as a starting point for scripts or UIs.
        //
        // This will return a mega set of key:value pairs with all possible schema
        // permutations and default values (when not an object) and everything else.
        generateAddressses(pObject, pBaseAddress, pSchema) {
          let tmpBaseAddress = typeof pBaseAddress == 'string' ? pBaseAddress : '';
          let tmpSchema = typeof pSchema == 'object' ? pSchema : {};
          let tmpObjectType = typeof pObject;
          let tmpSchemaObjectEntry = {
            Address: tmpBaseAddress,
            Hash: tmpBaseAddress,
            Name: tmpBaseAddress,
            // This is so scripts and UI controls can force a developer to opt-in.
            InSchema: false
          };
          if (tmpObjectType == 'object' && pObject == null) {
            tmpObjectType = 'null';
          }
          switch (tmpObjectType) {
            case 'string':
              tmpSchemaObjectEntry.DataType = 'String';
              tmpSchemaObjectEntry.Default = pObject;
              tmpSchema[tmpBaseAddress] = tmpSchemaObjectEntry;
              break;
            case 'number':
            case 'bigint':
              tmpSchemaObjectEntry.DataType = 'Number';
              tmpSchemaObjectEntry.Default = pObject;
              tmpSchema[tmpBaseAddress] = tmpSchemaObjectEntry;
              break;
            case 'undefined':
            case 'null':
              tmpSchemaObjectEntry.DataType = 'Any';
              tmpSchemaObjectEntry.Default = pObject;
              tmpSchema[tmpBaseAddress] = tmpSchemaObjectEntry;
              break;
            case 'object':
              if (Array.isArray(pObject)) {
                tmpSchemaObjectEntry.DataType = 'Array';
                if (tmpBaseAddress != '') {
                  tmpSchema[tmpBaseAddress] = tmpSchemaObjectEntry;
                }
                for (let i = 0; i < pObject.length; i++) {
                  this.generateAddressses(pObject[i], "".concat(tmpBaseAddress, "[").concat(i, "]"), tmpSchema);
                }
              } else {
                tmpSchemaObjectEntry.DataType = 'Object';
                if (tmpBaseAddress != '') {
                  tmpSchema[tmpBaseAddress] = tmpSchemaObjectEntry;
                  tmpBaseAddress += '.';
                }
                let tmpObjectProperties = Object.keys(pObject);
                for (let i = 0; i < tmpObjectProperties.length; i++) {
                  this.generateAddressses(pObject[tmpObjectProperties[i]], "".concat(tmpBaseAddress).concat(tmpObjectProperties[i]), tmpSchema);
                }
              }
              break;
            case 'symbol':
            case 'function':
              // Symbols and functions neither recurse nor get added to the schema
              break;
          }
          return tmpSchema;
        }
      }
      ;
      module.exports = ManyfestObjectAddressGeneration;
    }, {
      "./Manyfest-LogToConsole.js": 5
    }],
    11: [function (require, module, exports) {
      // Given a string, parse out any conditional expressions and set whether or not to keep the record.
      //
      // For instance:
      // 		'files[]<<~?format,==,Thumbnail?~>>'
      //      'files[]<<~?format,==,Metadata?~>>'
      //      'files[]<<~?size,>,4000?~>>'
      //
      // The wrapping parts are the <<~? and ?~>> megabrackets.
      //
      // The function does not need to alter the string -- just check the conditionals within.

      // TODO: Consider making this an es6 class

      // Let's use indexOf since it is apparently the fastest.
      const _ConditionalStanzaStart = '<<~?';
      const _ConditionalStanzaStartLength = _ConditionalStanzaStart.length;
      const _ConditionalStanzaEnd = '?~>>';
      const _ConditionalStanzaEndLength = _ConditionalStanzaEnd.length;

      // Test the condition of a value in a record
      const testCondition = (pManyfest, pRecord, pSearchAddress, pSearchComparator, pValue) => {
        switch (pSearchComparator) {
          case '!=':
            return pManyfest.getValueAtAddress(pRecord, pSearchAddress) != pValue;
            break;
          case '<':
            return pManyfest.getValueAtAddress(pRecord, pSearchAddress) < pValue;
            break;
          case '>':
            return pManyfest.getValueAtAddress(pRecord, pSearchAddress) > pValue;
            break;
          case '<=':
            return pManyfest.getValueAtAddress(pRecord, pSearchAddress) <= pValue;
            break;
          case '>=':
            return pManyfest.getValueAtAddress(pRecord, pSearchAddress) >= pValue;
            break;
          case '===':
            return pManyfest.getValueAtAddress(pRecord, pSearchAddress) === pValue;
            break;
          case '==':
          default:
            return pManyfest.getValueAtAddress(pRecord, pSearchAddress) == pValue;
            break;
        }
      };
      const parseConditionals = (pManyfest, pAddress, pRecord) => {
        let tmpKeepRecord = true;

        /*
        	Algorithm is simple:
        		1.  Enuerate start points
        		2.  Find stop points within each start point
        	3. Check the conditional
        */

        let tmpStartIndex = pAddress.indexOf(_ConditionalStanzaStart);
        while (tmpStartIndex != -1) {
          let tmpStopIndex = pAddress.indexOf(_ConditionalStanzaEnd, tmpStartIndex + _ConditionalStanzaStartLength);
          if (tmpStopIndex != -1) {
            let tmpMagicComparisonPatternSet = pAddress.substring(tmpStartIndex + _ConditionalStanzaStartLength, tmpStopIndex).split(',');
            let tmpSearchAddress = tmpMagicComparisonPatternSet[0];
            let tmpSearchComparator = tmpMagicComparisonPatternSet[1];
            let tmpSearchValue = tmpMagicComparisonPatternSet[2];

            // Process the piece
            tmpKeepRecord = tmpKeepRecord && testCondition(pManyfest, pRecord, tmpSearchAddress, tmpSearchComparator, tmpSearchValue);
            tmpStartIndex = pAddress.indexOf(_ConditionalStanzaStart, tmpStopIndex + _ConditionalStanzaEndLength);
          } else {
            tmpStartIndex = -1;
          }
        }
        return tmpKeepRecord;
      };
      module.exports = parseConditionals;
    }, {}],
    12: [function (require, module, exports) {
      /**
      * @author <steven@velozo.com>
      */
      let libSimpleLog = require('./Manyfest-LogToConsole.js');

      /**
      * Schema Manipulation Functions
      *
      * @class ManyfestSchemaManipulation
      */
      class ManyfestSchemaManipulation {
        constructor(pInfoLog, pErrorLog) {
          // Wire in logging
          this.logInfo = typeof pInfoLog === 'function' ? pInfoLog : libSimpleLog;
          this.logError = typeof pErrorLog === 'function' ? pErrorLog : libSimpleLog;
        }

        // This translates the default address mappings to something different.
        //
        // For instance you can pass in manyfest schema descriptor object:
        // 	{
        //	  "Address.Of.a": { "Hash": "a", "Type": "Number" },
        //	  "Address.Of.b": { "Hash": "b", "Type": "Number" }
        //  }
        //
        //
        // And then an address mapping (basically a Hash->Address map)
        //  {
        //    "a": "New.Address.Of.a",
        //    "b": "New.Address.Of.b"
        //  }
        //
        // NOTE: This mutates the schema object permanently, altering the base hash.
        //       If there is a collision with an existing address, it can lead to overwrites.
        // TODO: Discuss what should happen on collisions.
        resolveAddressMappings(pManyfestSchemaDescriptors, pAddressMapping) {
          if (typeof pManyfestSchemaDescriptors != 'object') {
            this.logError("Attempted to resolve address mapping but the descriptor was not an object.");
            return false;
          }
          if (typeof pAddressMapping != 'object') {
            // No mappings were passed in
            return true;
          }

          // Get the arrays of both the schema definition and the hash mapping
          let tmpManyfestAddresses = Object.keys(pManyfestSchemaDescriptors);
          let tmpHashMapping = {};
          tmpManyfestAddresses.forEach(pAddress => {
            if (pManyfestSchemaDescriptors[pAddress].hasOwnProperty('Hash')) {
              tmpHashMapping[pManyfestSchemaDescriptors[pAddress].Hash] = pAddress;
            }
          });
          let tmpAddressMappingSet = Object.keys(pAddressMapping);
          tmpAddressMappingSet.forEach(pInputAddress => {
            let tmpNewDescriptorAddress = pAddressMapping[pInputAddress];
            let tmpOldDescriptorAddress = false;
            let tmpDescriptor = false;

            // See if there is a matching descriptor either by Address directly or Hash
            if (pManyfestSchemaDescriptors.hasOwnProperty(pInputAddress)) {
              tmpOldDescriptorAddress = pInputAddress;
            } else if (tmpHashMapping.hasOwnProperty(pInputAddress)) {
              tmpOldDescriptorAddress = tmpHashMapping[pInputAddress];
            }

            // If there was a matching descriptor in the manifest, store it in the temporary descriptor
            if (tmpOldDescriptorAddress) {
              tmpDescriptor = pManyfestSchemaDescriptors[tmpOldDescriptorAddress];
              delete pManyfestSchemaDescriptors[tmpOldDescriptorAddress];
            } else {
              // Create a new descriptor!  Map it to the input address.
              tmpDescriptor = {
                Hash: pInputAddress
              };
            }

            // Now re-add the descriptor to the manyfest schema
            pManyfestSchemaDescriptors[tmpNewDescriptorAddress] = tmpDescriptor;
          });
          return true;
        }
        safeResolveAddressMappings(pManyfestSchemaDescriptors, pAddressMapping) {
          // This returns the descriptors as a new object, safely remapping without mutating the original schema Descriptors
          let tmpManyfestSchemaDescriptors = JSON.parse(JSON.stringify(pManyfestSchemaDescriptors));
          this.resolveAddressMappings(tmpManyfestSchemaDescriptors, pAddressMapping);
          return tmpManyfestSchemaDescriptors;
        }
        mergeAddressMappings(pManyfestSchemaDescriptorsDestination, pManyfestSchemaDescriptorsSource) {
          if (typeof pManyfestSchemaDescriptorsSource != 'object' || typeof pManyfestSchemaDescriptorsDestination != 'object') {
            this.logError("Attempted to merge two schema descriptors but both were not objects.");
            return false;
          }
          let tmpSource = JSON.parse(JSON.stringify(pManyfestSchemaDescriptorsSource));
          let tmpNewManyfestSchemaDescriptors = JSON.parse(JSON.stringify(pManyfestSchemaDescriptorsDestination));

          // The first passed-in set of descriptors takes precedence.
          let tmpDescriptorAddresses = Object.keys(tmpSource);
          tmpDescriptorAddresses.forEach(pDescriptorAddress => {
            if (!tmpNewManyfestSchemaDescriptors.hasOwnProperty(pDescriptorAddress)) {
              tmpNewManyfestSchemaDescriptors[pDescriptorAddress] = tmpSource[pDescriptorAddress];
            }
          });
          return tmpNewManyfestSchemaDescriptors;
        }
      }
      module.exports = ManyfestSchemaManipulation;
    }, {
      "./Manyfest-LogToConsole.js": 5
    }],
    13: [function (require, module, exports) {
      /**
      * @author <steven@velozo.com>
      */
      const libFableServiceProviderBase = require('fable-serviceproviderbase');
      let libSimpleLog = require('./Manyfest-LogToConsole.js');
      let libHashTranslation = require('./Manyfest-HashTranslation.js');
      let libObjectAddressCheckAddressExists = require('./Manyfest-ObjectAddress-CheckAddressExists.js');
      let libObjectAddressGetValue = require('./Manyfest-ObjectAddress-GetValue.js');
      let libObjectAddressSetValue = require('./Manyfest-ObjectAddress-SetValue.js');
      let libObjectAddressDeleteValue = require('./Manyfest-ObjectAddress-DeleteValue.js');
      let libObjectAddressGeneration = require('./Manyfest-ObjectAddressGeneration.js');
      let libSchemaManipulation = require('./Manyfest-SchemaManipulation.js');
      const _DefaultConfiguration = {
        Scope: 'DEFAULT',
        Descriptors: {}
      };

      /**
      * Manyfest object address-based descriptions and manipulations.
      *
      * @class Manyfest
      */
      class Manyfest extends libFableServiceProviderBase {
        constructor(pFable, pManifest, pServiceHash) {
          if (pFable === undefined) {
            super({});
          } else {
            super(pFable, pManifest, pServiceHash);
          }
          this.serviceType = 'Manifest';

          // Wire in logging
          this.logInfo = libSimpleLog;
          this.logError = libSimpleLog;

          // Create an object address resolver and map in the functions
          this.objectAddressCheckAddressExists = new libObjectAddressCheckAddressExists(this.logInfo, this.logError);
          this.objectAddressGetValue = new libObjectAddressGetValue(this.logInfo, this.logError);
          this.objectAddressSetValue = new libObjectAddressSetValue(this.logInfo, this.logError);
          this.objectAddressDeleteValue = new libObjectAddressDeleteValue(this.logInfo, this.logError);
          if (!this.options.hasOwnProperty('defaultValues')) {
            this.options.defaultValues = {
              "String": "",
              "Number": 0,
              "Float": 0.0,
              "Integer": 0,
              "Boolean": false,
              "Binary": 0,
              "DateTime": 0,
              "Array": [],
              "Object": {},
              "Null": null
            };
          }
          if (!this.options.hasOwnProperty('strict')) {
            this.options.strict = false;
          }
          this.scope = undefined;
          this.elementAddresses = undefined;
          this.elementHashes = undefined;
          this.elementDescriptors = undefined;
          this.reset();
          if (typeof this.options === 'object') {
            this.loadManifest(this.options);
          }
          this.schemaManipulations = new libSchemaManipulation(this.logInfo, this.logError);
          this.objectAddressGeneration = new libObjectAddressGeneration(this.logInfo, this.logError);
          this.hashTranslations = new libHashTranslation(this.logInfo, this.logError);
        }

        /*************************************************************************
         * Schema Manifest Loading, Reading, Manipulation and Serialization Functions
         */

        // Reset critical manifest properties
        reset() {
          this.scope = 'DEFAULT';
          this.elementAddresses = [];
          this.elementHashes = {};
          this.elementDescriptors = {};
        }
        clone() {
          // Make a copy of the options in-place
          let tmpNewOptions = JSON.parse(JSON.stringify(this.options));
          let tmpNewManyfest = new Manyfest(this.getManifest(), this.logInfo, this.logError, tmpNewOptions);

          // Import the hash translations
          tmpNewManyfest.hashTranslations.addTranslation(this.hashTranslations.translationTable);
          return tmpNewManyfest;
        }

        // Deserialize a Manifest from a string
        deserialize(pManifestString) {
          // TODO: Add guards for bad manifest string
          return this.loadManifest(JSON.parse(pManifestString));
        }

        // Load a manifest from an object
        loadManifest(pManifest) {
          if (typeof pManifest !== 'object') {
            this.logError("(".concat(this.scope, ") Error loading manifest; expecting an object but parameter was type ").concat(typeof pManifest, "."));
          }
          let tmpManifest = typeof pManifest == 'object' ? pManifest : {};
          let tmpDescriptorKeys = Object.keys(_DefaultConfiguration);
          for (let i = 0; i < tmpDescriptorKeys.length; i++) {
            if (!tmpManifest.hasOwnProperty(tmpDescriptorKeys[i])) {
              tmpManifest[tmpDescriptorKeys[i]] = JSON.parse(JSON.stringify(_DefaultConfiguration[tmpDescriptorKeys[i]]));
            }
          }
          if (tmpManifest.hasOwnProperty('Scope')) {
            if (typeof tmpManifest.Scope === 'string') {
              this.scope = tmpManifest.Scope;
            } else {
              this.logError("(".concat(this.scope, ") Error loading scope from manifest; expecting a string but property was type ").concat(typeof tmpManifest.Scope, "."), tmpManifest);
            }
          } else {
            this.logError("(".concat(this.scope, ") Error loading scope from manifest object.  Property \"Scope\" does not exist in the root of the object."), tmpManifest);
          }
          if (tmpManifest.hasOwnProperty('Descriptors')) {
            if (typeof tmpManifest.Descriptors === 'object') {
              let tmpDescriptionAddresses = Object.keys(tmpManifest.Descriptors);
              for (let i = 0; i < tmpDescriptionAddresses.length; i++) {
                this.addDescriptor(tmpDescriptionAddresses[i], tmpManifest.Descriptors[tmpDescriptionAddresses[i]]);
              }
            } else {
              this.logError("(".concat(this.scope, ") Error loading description object from manifest object.  Expecting an object in 'Manifest.Descriptors' but the property was type ").concat(typeof tmpManifest.Descriptors, "."), tmpManifest);
            }
          } else {
            this.logError("(".concat(this.scope, ") Error loading object description from manifest object.  Property \"Descriptors\" does not exist in the root of the Manifest object."), tmpManifest);
          }
          if (tmpManifest.hasOwnProperty('HashTranslations')) {
            if (typeof tmpManifest.HashTranslations === 'object') {
              for (let i = 0; i < tmpManifest.HashTranslations.length; i++) {
                // Each translation is 
              }
            }
          }
        }

        // Serialize the Manifest to a string
        serialize() {
          return JSON.stringify(this.getManifest());
        }
        getManifest() {
          return {
            Scope: this.scope,
            Descriptors: JSON.parse(JSON.stringify(this.elementDescriptors)),
            HashTranslations: JSON.parse(JSON.stringify(this.hashTranslations.translationTable))
          };
        }

        // Add a descriptor to the manifest
        addDescriptor(pAddress, pDescriptor) {
          if (typeof pDescriptor === 'object') {
            // Add the Address into the Descriptor if it doesn't exist:
            if (!pDescriptor.hasOwnProperty('Address')) {
              pDescriptor.Address = pAddress;
            }
            if (!this.elementDescriptors.hasOwnProperty(pAddress)) {
              this.elementAddresses.push(pAddress);
            }

            // Add the element descriptor to the schema
            this.elementDescriptors[pAddress] = pDescriptor;

            // Always add the address as a hash
            this.elementHashes[pAddress] = pAddress;
            if (pDescriptor.hasOwnProperty('Hash')) {
              // TODO: Check if this is a good idea or not..
              //       Collisions are bound to happen with both representations of the address/hash in here and developers being able to create their own hashes.
              this.elementHashes[pDescriptor.Hash] = pAddress;
            } else {
              pDescriptor.Hash = pAddress;
            }
            return true;
          } else {
            this.logError("(".concat(this.scope, ") Error loading object descriptor for address '").concat(pAddress, "' from manifest object.  Expecting an object but property was type ").concat(typeof pDescriptor, "."));
            return false;
          }
        }
        getDescriptorByHash(pHash) {
          return this.getDescriptor(this.resolveHashAddress(pHash));
        }
        getDescriptor(pAddress) {
          return this.elementDescriptors[pAddress];
        }

        // execute an action function for each descriptor
        eachDescriptor(fAction) {
          let tmpDescriptorAddresses = Object.keys(this.elementDescriptors);
          for (let i = 0; i < tmpDescriptorAddresses.length; i++) {
            fAction(this.elementDescriptors[tmpDescriptorAddresses[i]]);
          }
        }

        /*************************************************************************
         * Beginning of Object Manipulation (read & write) Functions
         */
        // Check if an element exists by its hash
        checkAddressExistsByHash(pObject, pHash) {
          return this.checkAddressExists(pObject, this.resolveHashAddress(pHash));
        }

        // Check if an element exists at an address
        checkAddressExists(pObject, pAddress) {
          return this.objectAddressCheckAddressExists.checkAddressExists(pObject, pAddress);
        }

        // Turn a hash into an address, factoring in the translation table.
        resolveHashAddress(pHash) {
          let tmpAddress = undefined;
          let tmpInElementHashTable = this.elementHashes.hasOwnProperty(pHash);
          let tmpInTranslationTable = this.hashTranslations.translationTable.hasOwnProperty(pHash);

          // The most straightforward: the hash exists, no translations.
          if (tmpInElementHashTable && !tmpInTranslationTable) {
            tmpAddress = this.elementHashes[pHash];
          }
          // There is a translation from one hash to another, and, the elementHashes contains the pointer end
          else if (tmpInTranslationTable && this.elementHashes.hasOwnProperty(this.hashTranslations.translate(pHash))) {
            tmpAddress = this.elementHashes[this.hashTranslations.translate(pHash)];
          }
          // Use the level of indirection only in the Translation Table
          else if (tmpInTranslationTable) {
            tmpAddress = this.hashTranslations.translate(pHash);
          }
          // Just treat the hash as an address.
          // TODO: Discuss this ... it is magic but controversial
          else {
            tmpAddress = pHash;
          }
          return tmpAddress;
        }

        // Get the value of an element by its hash
        getValueByHash(pObject, pHash) {
          let tmpValue = this.getValueAtAddress(pObject, this.resolveHashAddress(pHash));
          if (typeof tmpValue == 'undefined') {
            // Try to get a default if it exists
            tmpValue = this.getDefaultValue(this.getDescriptorByHash(pHash));
          }
          return tmpValue;
        }

        // Get the value of an element at an address
        getValueAtAddress(pObject, pAddress) {
          let tmpValue = this.objectAddressGetValue.getValueAtAddress(pObject, pAddress);
          if (typeof tmpValue == 'undefined') {
            // Try to get a default if it exists
            tmpValue = this.getDefaultValue(this.getDescriptor(pAddress));
          }
          return tmpValue;
        }

        // Set the value of an element by its hash
        setValueByHash(pObject, pHash, pValue) {
          return this.setValueAtAddress(pObject, this.resolveHashAddress(pHash), pValue);
        }

        // Set the value of an element at an address
        setValueAtAddress(pObject, pAddress, pValue) {
          return this.objectAddressSetValue.setValueAtAddress(pObject, pAddress, pValue);
        }

        // Delete the value of an element by its hash
        deleteValueByHash(pObject, pHash, pValue) {
          return this.deleteValueAtAddress(pObject, this.resolveHashAddress(pHash), pValue);
        }

        // Delete the value of an element at an address
        deleteValueAtAddress(pObject, pAddress, pValue) {
          return this.objectAddressDeleteValue.deleteValueAtAddress(pObject, pAddress, pValue);
        }

        // Validate the consistency of an object against the schema
        validate(pObject) {
          let tmpValidationData = {
            Error: null,
            Errors: [],
            MissingElements: []
          };
          if (typeof pObject !== 'object') {
            tmpValidationData.Error = true;
            tmpValidationData.Errors.push("Expected passed in object to be type object but was passed in ".concat(typeof pObject));
          }
          let addValidationError = (pAddress, pErrorMessage) => {
            tmpValidationData.Error = true;
            tmpValidationData.Errors.push("Element at address \"".concat(pAddress, "\" ").concat(pErrorMessage, "."));
          };

          // Now enumerate through the values and check for anomalies based on the schema
          for (let i = 0; i < this.elementAddresses.length; i++) {
            let tmpDescriptor = this.getDescriptor(this.elementAddresses[i]);
            let tmpValueExists = this.checkAddressExists(pObject, tmpDescriptor.Address);
            let tmpValue = this.getValueAtAddress(pObject, tmpDescriptor.Address);
            if (typeof tmpValue == 'undefined' || !tmpValueExists) {
              // This will technically mean that `Object.Some.Value = undefined` will end up showing as "missing"
              // TODO: Do we want to do a different message based on if the property exists but is undefined?
              tmpValidationData.MissingElements.push(tmpDescriptor.Address);
              if (tmpDescriptor.Required || this.options.strict) {
                addValidationError(tmpDescriptor.Address, 'is flagged REQUIRED but is not set in the object');
              }
            }

            // Now see if there is a data type specified for this element
            if (tmpDescriptor.DataType) {
              let tmpElementType = typeof tmpValue;
              switch (tmpDescriptor.DataType.toString().trim().toLowerCase()) {
                case 'string':
                  if (tmpElementType != 'string') {
                    addValidationError(tmpDescriptor.Address, "has a DataType ".concat(tmpDescriptor.DataType, " but is of the type ").concat(tmpElementType));
                  }
                  break;
                case 'number':
                  if (tmpElementType != 'number') {
                    addValidationError(tmpDescriptor.Address, "has a DataType ".concat(tmpDescriptor.DataType, " but is of the type ").concat(tmpElementType));
                  }
                  break;
                case 'integer':
                  if (tmpElementType != 'number') {
                    addValidationError(tmpDescriptor.Address, "has a DataType ".concat(tmpDescriptor.DataType, " but is of the type ").concat(tmpElementType));
                  } else {
                    let tmpValueString = tmpValue.toString();
                    if (tmpValueString.indexOf('.') > -1) {
                      // TODO: Is this an error?
                      addValidationError(tmpDescriptor.Address, "has a DataType ".concat(tmpDescriptor.DataType, " but has a decimal point in the number."));
                    }
                  }
                  break;
                case 'float':
                  if (tmpElementType != 'number') {
                    addValidationError(tmpDescriptor.Address, "has a DataType ".concat(tmpDescriptor.DataType, " but is of the type ").concat(tmpElementType));
                  }
                  break;
                case 'DateTime':
                  let tmpValueDate = new Date(tmpValue);
                  if (tmpValueDate.toString() == 'Invalid Date') {
                    addValidationError(tmpDescriptor.Address, "has a DataType ".concat(tmpDescriptor.DataType, " but is not parsable as a Date by Javascript"));
                  }
                default:
                  // Check if this is a string, in the default case
                  // Note this is only when a DataType is specified and it is an unrecognized data type.
                  if (tmpElementType != 'string') {
                    addValidationError(tmpDescriptor.Address, "has a DataType ".concat(tmpDescriptor.DataType, " (which auto-converted to String because it was unrecognized) but is of the type ").concat(tmpElementType));
                  }
                  break;
              }
            }
          }
          return tmpValidationData;
        }

        // Returns a default value, or, the default value for the data type (which is overridable with configuration)
        getDefaultValue(pDescriptor) {
          if (typeof pDescriptor != 'object') {
            return undefined;
          }
          if (pDescriptor.hasOwnProperty('Default')) {
            return pDescriptor.Default;
          } else {
            // Default to a null if it doesn't have a type specified.
            // This will ensure a placeholder is created but isn't misinterpreted.
            let tmpDataType = pDescriptor.hasOwnProperty('DataType') ? pDescriptor.DataType : 'String';
            if (this.options.defaultValues.hasOwnProperty(tmpDataType)) {
              return this.options.defaultValues[tmpDataType];
            } else {
              // give up and return null
              return null;
            }
          }
        }

        // Enumerate through the schema and populate default values if they don't exist.
        populateDefaults(pObject, pOverwriteProperties) {
          return this.populateObject(pObject, pOverwriteProperties,
          // This just sets up a simple filter to see if there is a default set.
          pDescriptor => {
            return pDescriptor.hasOwnProperty('Default');
          });
        }

        // Forcefully populate all values even if they don't have defaults.
        // Based on type, this can do unexpected things.
        populateObject(pObject, pOverwriteProperties, fFilter) {
          // Automatically create an object if one isn't passed in.
          let tmpObject = typeof pObject === 'object' ? pObject : {};
          // Default to *NOT OVERWRITING* properties
          let tmpOverwriteProperties = typeof pOverwriteProperties == 'undefined' ? false : pOverwriteProperties;
          // This is a filter function, which is passed the schema and allows complex filtering of population
          // The default filter function just returns true, populating everything.
          let tmpFilterFunction = typeof fFilter == 'function' ? fFilter : pDescriptor => {
            return true;
          };
          this.elementAddresses.forEach(pAddress => {
            let tmpDescriptor = this.getDescriptor(pAddress);
            // Check the filter function to see if this is an address we want to set the value for.
            if (tmpFilterFunction(tmpDescriptor)) {
              // If we are overwriting properties OR the property does not exist
              if (tmpOverwriteProperties || !this.checkAddressExists(tmpObject, pAddress)) {
                this.setValueAtAddress(tmpObject, pAddress, this.getDefaultValue(tmpDescriptor));
              }
            }
          });
          return tmpObject;
        }
      }
      ;
      module.exports = Manyfest;
    }, {
      "./Manyfest-HashTranslation.js": 4,
      "./Manyfest-LogToConsole.js": 5,
      "./Manyfest-ObjectAddress-CheckAddressExists.js": 6,
      "./Manyfest-ObjectAddress-DeleteValue.js": 7,
      "./Manyfest-ObjectAddress-GetValue.js": 8,
      "./Manyfest-ObjectAddress-SetValue.js": 9,
      "./Manyfest-ObjectAddressGeneration.js": 10,
      "./Manyfest-SchemaManipulation.js": 12,
      "fable-serviceproviderbase": 2
    }]
  }, {}, [13])(13);
});