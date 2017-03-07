(function () {
  "use strict";
  var colorConvert = {};
  colorConvert.exec = function (colorStr) {
    colorStr = colorStr.toLowerCase() || '';
    var rgba = {
      "red": 0,
      "green": 0,
      "blue": 0,
      "alpha": 0
    };

    function convertColorTo24bit(string) {
      if (string.length == 3) {
        return string[0] + string[0] + string[1] + string[1] + string[2] + string[2];
      } else if (string.length == 6) {
        return string;
      } else {
        console.warn('color value "' + string + '" wrong format!');
        return '';
      }
    }

    if (colorStr.match(/rgb/g)) {
      var tempColorValueRGB = colorStr.match(/\d+(\.\d+)*/g) || [0, 0, 0, 0];
      rgba = {
        "red": Number(tempColorValueRGB[0]),
        "green": Number(tempColorValueRGB[1]),
        "blue": Number(tempColorValueRGB[2]),
        "alpha": Number(tempColorValueRGB[3]) || 1
      };
    } else {
      var tempColorValue = colorStr.match(/\w+/g) || [0, 0, 0, 0];
      tempColorValue = convertColorTo24bit(tempColorValue[0]);
      rgba = {
        "red": parseInt(tempColorValue.substr(0, 2), 16),
        "green": parseInt(tempColorValue.substr(2, 2), 16),
        "blue": parseInt(tempColorValue.substr(4, 2), 16),
        "alpha": 1
      };
    }
    return rgba;
  }
  colorConvert.readVariable = function (fileResponse) {
    var colorsData = fileResponse.match(/@[^:]+:\s*[^;]+/g) || [];
    var colorsStr = '';
    var colorsSplit = [];
    var colorObj = {};
    var colors = [];
    for (var i = 0; i < colorsData.length; i++) {
      colorsData[i] = colorsData[i].replace(' ', '');
      colorsStr = colorsData[i];
      colorsSplit = colorsStr.split(':');
      colorObj = {
        "variable": colorsSplit[0],
        "value": colorsSplit[1],
      };
      colorObj.rgba = colorConvert.exec(colorsSplit[1]);
      colors.push(colorObj);
    }
    return colors;
  }
  if (typeof (global) == "undefined") {
    var exports = window;
  } else {
    var exports = global;
  }
  exports.colorConvert = colorConvert;
})();
