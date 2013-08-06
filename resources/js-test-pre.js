/*
** Copyright (c) 2012 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/

// Modified by Samsung Electronics Corporation for WebCL

(function() {
  var testHarnessInitialized = false;

  var initNonKhronosFramework = function(waitUntilDone) {
    if (testHarnessInitialized) {
      return;
    }
    testHarnessInitialized = true;

    /* -- plaform specific code -- */

    // WebKit Specific code. Add your code here.
    if (window.testRunner && !window.layoutTestController) {
      window.layoutTestController = window.testRunner;
    }

    if (window.layoutTestController) {
	  // TODO  Check if "WebKitWebCLEnabled" flasg is requried
      layoutTestController.overridePreference("WebKitWebCLEnabled", "1");
      layoutTestController.dumpAsText();
      layoutTestController.waitUntilDone();
    }
    if (window.internals) {
		// TODO Check What is needed
      // The WebKit testing system compares console output.
      // Because the output of the WebCL Tests is GPU dependent
      // we turn off console messages.
      //window.console.log = function() { };
      //window.console.error = function() { };
      //window.internals.settings.setWebCLErrorsToConsoleEnabled(false);

      // RAF doesn't work in LayoutTests. Disable it so the tests will
      // use setTimeout instead.
      //window.requestAnimationFrame = undefined;
      //window.webkitRequestAnimationFrame = undefined;
    }

    /* -- end platform specific code --*/
  }

  this.initTestingHarnessWaitUntilDone = function() {
    initNonKhronosFramework(true);
  }

  this.initTestingHarness = function() {
    initNonKhronosFramework(false);
  }
}());

function nonKhronosFrameworkNotifyDone() {
  // WebKit Specific code. Add your code here.
  if (window.layoutTestController) {
    layoutTestController.notifyDone();
  }
}

function reportTestResultsToHarness(success, msg) {
  if (window.parent.webclTestHarness) {
    window.parent.webclTestHarness.reportResults(window.location.pathname, success, msg);
  }
}

function notifyFinishedToHarness() {
  if (window.parent.webclTestHarness) {
    window.parent.webclTestHarness.notifyFinished(window.location.pathname);
  }
}

function description(msg)
{
    initTestingHarness();
    if (msg === undefined) {
      msg = document.title;
    }
    // For MSIE 6 compatibility
    var span = document.createElement("span");
    span.innerHTML = '<p>' + msg + '</p><p>On success, you will see a series of "<span class="pass">PASS</span>" messages, followed by "<span class="pass">TEST COMPLETE</span>".</p>';
    var description = document.getElementById("description");
    if (description.firstChild)
        description.replaceChild(span, description.firstChild);
    else
        description.appendChild(span);
}

function debug(msg)
{
    var span = document.createElement("span");
    document.getElementById("console").appendChild(span); // insert it first so XHTML knows the namespace
    span.innerHTML = msg + '<br />';
}

function escapeHTML(text)
{
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function testPassed(msg)
{
    reportTestResultsToHarness(true, msg);
    debug('<span><span class="pass">PASS</span> ' + escapeHTML(msg) + '</span>');
}

function testFailed(msg)
{
    reportTestResultsToHarness(false, msg);
    debug('<span><span class="fail">FAIL</span> ' + escapeHTML(msg) + '</span>');
}

function areArraysEqual(_a, _b)
{
    try {
        if (_a.length !== _b.length)
            return false;
        for (var i = 0; i < _a.length; i++)
            if (_a[i] !== _b[i])
                return false;
    } catch (ex) {
        return false;
    }
    return true;
}

function isMinusZero(n)
{
    // the only way to tell 0 from -0 in JS is the fact that 1/-0 is
    // -Infinity instead of Infinity
    return n === 0 && 1/n < 0;
}

function isResultCorrect(_actual, _expected)
{
    if (_expected === 0)
        return _actual === _expected && (1/_actual) === (1/_expected);
    if (_actual === _expected)
        return true;
    if (typeof(_expected) == "number" && isNaN(_expected))
        return typeof(_actual) == "number" && isNaN(_actual);
    if (Object.prototype.toString.call(_expected) == Object.prototype.toString.call([]))
        return areArraysEqual(_actual, _expected);
    return false;
}

function stringify(v)
{
    if (v === 0 && 1/v < 0)
        return "-0";
    else return "" + v;
}

function evalAndLog(_a)
{
  if (typeof _a != "string")
    debug("WARN: tryAndLog() expects a string argument");

  // Log first in case things go horribly wrong or this causes a sync event.
  debug(_a);

  var _av;
  try {
     _av = eval(_a);
  } catch (e) {
    testFailed(_a + " threw exception " + e);
  }
  return _av;
}

function shouldBe(_a, _b, quiet)
{
    if (typeof _a != "string" || typeof _b != "string")
        debug("WARN: shouldBe() expects string arguments");
    var exception;
    var _av;
    try {
        _av = eval(_a);
    } catch (e) {
        exception = e;
    }
    var _bv = eval(_b);

    if (exception)
        testFailed(_a + " should be " + _bv + ". Threw exception " + exception);
    else if (isResultCorrect(_av, _bv)) {
        if (!quiet) {
            testPassed(_a + " is " + _b);
        }
    } else if (typeof(_av) == typeof(_bv))
        testFailed(_a + " should be " + _bv + ". Was " + stringify(_av) + ".");
    else
        testFailed(_a + " should be " + _bv + " (of type " + typeof _bv + "). Was " + _av + " (of type " + typeof _av + ").");
}

function shouldNotBe(_a, _b, quiet)
{
    if (typeof _a != "string" || typeof _b != "string")
        debug("WARN: shouldNotBe() expects string arguments");
    var exception;
    var _av;
    try {
        _av = eval(_a);
    } catch (e) {
        exception = e;
    }
    var _bv = eval(_b);

    if (exception)
        testFailed(_a + " should not be " + _bv + ". Threw exception " + exception);
    else if (!isResultCorrect(_av, _bv)) {
        if (!quiet) {
            testPassed(_a + " is not " + _b);
        }
    } else
        testFailed(_a + " should not be " + _bv + ".");
}

function shouldBeTrue(_a) { shouldBe(_a, "true"); }
function shouldBeFalse(_a) { shouldBe(_a, "false"); }
function shouldBeNaN(_a) { shouldBe(_a, "NaN"); }
function shouldBeNull(_a) { shouldBe(_a, "null"); }

function shouldBeEqualToString(a, b)
{
  var unevaledString = '"' + b.replace(/"/g, "\"") + '"';
  shouldBe(a, unevaledString);
}

function shouldEvaluateTo(actual, expected) {
  // A general-purpose comparator.  'actual' should be a string to be
  // evaluated, as for shouldBe(). 'expected' may be any type and will be
  // used without being eval'ed.
  if (expected == null) {
    // Do this before the object test, since null is of type 'object'.
    shouldBeNull(actual);
  } else if (typeof expected == "undefined") {
    shouldBeUndefined(actual);
  } else if (typeof expected == "function") {
    // All this fuss is to avoid the string-arg warning from shouldBe().
    try {
      actualValue = eval(actual);
    } catch (e) {
      testFailed("Evaluating " + actual + ": Threw exception " + e);
      return;
    }
    shouldBe("'" + actualValue.toString().replace(/\n/g, "") + "'",
             "'" + expected.toString().replace(/\n/g, "") + "'");
  } else if (typeof expected == "object") {
    shouldBeTrue(actual + " == '" + expected + "'");
  } else if (typeof expected == "string") {
    shouldBe(actual, expected);
  } else if (typeof expected == "boolean") {
    shouldBe("typeof " + actual, "'boolean'");
    if (expected)
      shouldBeTrue(actual);
    else
      shouldBeFalse(actual);
  } else if (typeof expected == "number") {
    shouldBe(actual, stringify(expected));
  } else {
    debug(expected + " is unknown type " + typeof expected);
    shouldBeTrue(actual, "'"  +expected.toString() + "'");
  }
}

function shouldBeNonZero(_a)
{
  var exception;
  var _av;
  try {
     _av = eval(_a);
  } catch (e) {
     exception = e;
  }

  if (exception)
    testFailed(_a + " should be non-zero. Threw exception " + exception);
  else if (_av != 0)
    testPassed(_a + " is non-zero.");
  else
    testFailed(_a + " should be non-zero. Was " + _av);
}

function shouldBeNonNull(_a)
{
  var exception;
  var _av;
  try {
     _av = eval(_a);
  } catch (e) {
     exception = e;
  }

  if (exception)
    testFailed(_a + " should be non-null. Threw exception " + exception);
  else if (_av != null)
    testPassed(_a + " is non-null.");
  else
    testFailed(_a + " should be non-null. Was " + _av);
}

function shouldBeUndefined(_a)
{
  var exception;
  var _av;
  try {
     _av = eval(_a);
  } catch (e) {
     exception = e;
  }

  if (exception)
    testFailed(_a + " should be undefined. Threw exception " + exception);
  else if (typeof _av == "undefined")
    testPassed(_a + " is undefined.");
  else
    testFailed(_a + " should be undefined. Was " + _av);
}

function shouldBeDefined(_a)
{
  var exception;
  var _av;
  try {
     _av = eval(_a);
  } catch (e) {
     exception = e;
  }

  if (exception)
    testFailed(_a + " should be defined. Threw exception " + exception);
  else if (_av !== undefined)
    testPassed(_a + " is defined.");
  else
    testFailed(_a + " should be defined. Was " + _av);
}

function shouldBeGreaterThanOrEqual(_a, _b) {
    if (typeof _a != "string" || typeof _b != "string")
        debug("WARN: shouldBeGreaterThanOrEqual expects string arguments");

    var exception;
    var _av;
    try {
        _av = eval(_a);
    } catch (e) {
        exception = e;
    }
    var _bv = eval(_b);

    if (exception)
        testFailed(_a + " should be >= " + _b + ". Threw exception " + exception);
    else if (typeof _av == "undefined" || _av < _bv)
        testFailed(_a + " should be >= " + _b + ". Was " + _av + " (of type " + typeof _av + ").");
    else
        testPassed(_a + " is >= " + _b);
}

function expectTrue(v, msg) {
  if (v) {
    testPassed(msg);
  } else {
    testFailed(msg);
  }
}

function shouldThrow(_a, _e)
{
  var exception;
  var _av;
  try {
     _av = eval(_a);
  } catch (e) {
     exception = e;
  }

  var _ev;
  if (_e)
      _ev =  eval(_e);

  if (exception) {
    if (typeof _e == "undefined" || exception == _ev)
      testPassed(_a + " threw exception " + exception + ".");
    else
      testFailed(_a + " should throw " + (typeof _e == "undefined" ? "an exception" : _ev) + ". Threw exception " + exception + ".");
  } else if (typeof _av == "undefined")
    testFailed(_a + " should throw " + (typeof _e == "undefined" ? "an exception" : _ev) + ". Was undefined.");
  else
    testFailed(_a + " should throw " + (typeof _e == "undefined" ? "an exception" : _ev) + ". Was " + _av + ".");
}

function shouldBeType(_a, _type, quite) {
    var exception;
    var _av, _avPrototype;

    /*  operator instanceof works based on prototype.constructor. Across multiple frames the
        constructor definition need not be the same. Thus when running the test in iframe it fails for
        certain type checks.
        As a workaround we are comparing prototype of _a and _type
        after evaluating respective strings.
    */

    try {
        _av = eval(_a);
        _aPrototype = Object.getPrototypeOf(_av).toString();
    } catch (e) {
        exception = e;
    }

    var _typev = eval(_type);
    var _typePrototype = _typev.prototype.toString();

    if (exception)
        testFailed(_a + "should be an instance of " + _type + ". But threw exception " + exception);
    else if (_av instanceof  _typev || _aPrototype == _typePrototype) {
        if (!quite)
            testPassed(_a + " is an instance of " + _type);
    } else
        testFailed(_a + " is not an instance of " + _type);
}

function assertMsg(assertion, msg) {
    if (assertion) {
        testPassed(msg);
    } else {
        testFailed(msg);
    }
}

function gc() {
    if (window.GCController) {
        window.GCController.collect();
        return;
    }

    if (window.opera && window.opera.collect) {
        window.opera.collect();
        return;
    }

    try {
        window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
              .getInterface(Components.interfaces.nsIDOMWindowUtils)
              .garbageCollect();
        return;
    } catch(e) {}

    function gcRec(n) {
        if (n < 1)
            return {};
        var temp = {i: "ab" + i + (i / 100000)};
        temp += "foo";
        gcRec(n-1);
    }
    for (var i = 0; i < 1000; i++)
        gcRec(10);
}

function finishTest() {
  successfullyParsed = true;
  var epilogue = document.createElement("script");
  epilogue.onload = function() {
    if (window.nonKhronosFrameworkNotifyDone) {
      window.nonKhronosFrameworkNotifyDone();
    }
  };

  var basePath = "";
  var expectedBase = "js-test-pre.js";
  var scripts = document.getElementsByTagName('script');
  for (var script, i = 0; script = scripts[i]; i++) {
    var src = script.src;
    var l = src.length;
    if (src.substr(l - expectedBase.length) == expectedBase) {
      basePath = src.substr(0, l - expectedBase.length);
      break;
    }
  }
  epilogue.src = basePath + "js-test-post.js";
  document.body.appendChild(epilogue);
}

// WebCL specific methods.

var invalid_function = 'invalid function';
var invalid_object = 1234;
var invalid_CLenum = 9999;
var invalid_string = {toString: undefined};
var invalid_number = {toString: undefined};
var invalid_boolean = null;

function shouldThrowExceptionName(_a, _e)
{
    if (typeof _e != "string")
        debug("WARN: shouldThrowExceptionName expects string arguments");
    var exception;
    var _av;
    var isStrict = window.top.CLGlobalVariables ? window.top.CLGlobalVariables.getInstance().isStrict() : 0;
    try {
        _av = eval(_a);
    } catch (e) {
        exception = e;
    }

    if (!exception) {
        testFailed(_a + " should throw " + _e + ". Was " + _av + ".");
        return;
    }
    if (exception instanceof WebCLException) {
        if (isStrict && exception.name != _e)
            testFailed(_a + " should throw " + _e + ". Threw " + exception.name + ".");
        else
            testPassed(_a + " threw exception " + exception.name + ".");
    } else
        testFailed(_a + " should throw " + _e + ". Threw " + exception + ".");
}

function shouldBeArrayOfType(_a, _type, quite)
{
    var exception;
    var _av;
    try {
        _av = eval(_a);
    } catch (e) {
        exception = e;
    }

    var _typev = eval(_type);

    if (Object.prototype.toString.call(_av) === '[object Array]') { //To check if _av is an instance of Array.
        for (var i = 0; i < _av.length; i++) {
            if (_av[i] instanceof _typev || typeof(_av) == _typev) {
                continue;
            }
        }
        if (i == _av.length)
            testPassed(_a + " is an array of " + _type);
        else
            testFailed(_a + " is not an array of " + _type);
    } else {
        if (exception)
            testFailed(_a + " should be an array of " + _type + ". but threw exception " + exception.name);
        else
            testFailed(_a + " is not an array of " + _type);
    }
}

