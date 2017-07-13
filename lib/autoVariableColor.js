var fileSystem = require('fs');
var colorConvert = require('./colorConvert.js');
var fileOperate = {};

(function () {
  var logLevel = 1;
  var colorRegex1 = new RegExp('#\\w{3,6}', 'g');
  var colorRegex2 = new RegExp('rgb(a*)[^;]+', 'g');
  fileOperate.readFile = function (memory, filePath, ISN) {
    ISN = ISN || 'UTF-8';
    fileSystem.readFile(filePath, ISN, function (error, data) {
      if (error) {
        printLog('0', error);
      } else {
        memory.readFile = data;
      }
      memory.step = memory.step + 1;
    });
  }

  fileOperate.readDir = function (path) {
    fileSystem.readdir(path, function (error, data) {
      if (error) {
        printLog('0', error);
      } else {
        memory.readDir = data;
      }
    });
  }

  fileOperate.isDir = function (memory, path) {
    fileSystem.stat(path, function (error, stat) {
      if (error) {
        printLog('0', error);
      } else {
        memory.isDir = stat.isDirectory();
      }
      memory.step = memory.step + 1;
    })
  }

  fileOperate.mapFile = function (memory, path) {
    fileSystem.readdir(path, function (error, data) {
      if (error) {
        printLog('0', error);
      } else {
        var finish = 0;
        for (var i = 0; i < data.length; i++) {
          var tempRegex = new RegExp('', 'g');
          var currentPath = path + '/' + data[i];
          (function (memory, currentPath) {
            fileSystem.stat(currentPath, function (error, stat) {
              var cPath = currentPath;

              function filtIgnore(Path) {
                var ignoreMatch = 0;
                for (var n = 0; n < memory.config.srcIgnore.length; n++) {
                  tempRegex = new RegExp(memory.config.srcIgnore[n]);
                  if (tempRegex.test(Path) == true) {
                    ignoreMatch++;
                    break;
                  }
                }
                return ignoreMatch;
              }
              if (error) {
                printLog('0', error);
              } else {
                if (!filtIgnore(cPath)) {
                  if (stat.isDirectory()) {
                    printLog('2', 'MAPPER: "' + cPath + '" is a directory.');
                    memory.allQueue.splice(memory.step + 1, 0, function (memory) {
                      printLog('2', 'STEP: ' + memory.step);
                      fileOperate.mapFile(memory, cPath);
                    });
                  } else {
                    printLog('2', 'MAPPER: "' + cPath + '" is a file.')
                    if (memory.srcSuffixRegexp.test(cPath)) {
                      memory.fileMatchList.push(cPath);
                    }
                  }
                }
              }
              finish = finish + 1;
              finish == i ? memory.step = memory.step + 1 : null;
            });
          })(memory, currentPath);
        }
        data.length == 0 ? memory.step = memory.step + 1 : null;
      }
    });
  }

  var taskReplaceColorFile = function (memory) {
    for (var n = memory.fileMatchList.length - 1; n > -1; n--) {
      (function (n, memory) {
        memory.allQueue.splice(memory.step + 1, 0, function (memory) {
          printLog('2', 'STEP: ' + memory.step);
          printLog('2', 'PROGRESS: ' + memory.fileMatchList[n]);
          fileSystem.readFile(memory.fileMatchList[n], memory.config.encode, function (error, data) {
            if (error) {
              printLog('0', error);
              memory.step = memory.step + 1;
            } else {
              var replaceData = replaceColor(memory, data);
              if (replaceData[0] > 0) {
                fileSystem.writeFile(memory.fileMatchList[n], replaceData[1], memory.config.encode, function (err) {
                  if (error) {
                    printLog('0', error);
                    memory.step = memory.step + 1;
                  } else {
                    printLog('1', 'EXPORT : "' + memory.fileMatchList[n] + '" success!');
                    memory.step = memory.step + 1;
                  }
                });
              } else {
                memory.step = memory.step + 1;
              }
            }
          });
        });
      })(n, memory);
    }
  }

  var replaceColor = function (memory, scriptText) {
    var colorMatch0 = scriptText.match(colorRegex1) || [];
    var colorMatch1 = [];
    var colorMatch2 = scriptText.match(colorRegex2) || [];
    for (var n = 0; n < colorMatch0.length; n++) {
      var tempStr = colorMatch0[n].replace('#', '');
      if (parseInt(tempStr, 16) == parseInt(tempStr, 16)) {
        colorMatch1.push(colorMatch0[n]);
      }
    }
    var colorMatchs = colorMatch1.concat(colorMatch2);
    for (var i = 0; i < colorMatchs.length; i++) {
      var colorVariableName = queryColorDict(memory, colorMatchs[i]);
      colorMatchs[i] = colorMatchs[i].replace('(', '\\(');
      colorMatchs[i] = colorMatchs[i].replace(')', '\\)');
      colorMatchs[i] = colorMatchs[i].replace('.', '\\.');
      var tempReplaceRegex = new RegExp(colorMatchs[i], 'g');
      scriptText = scriptText.replace(tempReplaceRegex, colorVariableName);
    }
    return [colorMatchs.length, scriptText];
  }

  var queryColorDict = function (memory, colorStr) {
    var rgbaMatch = false;
    var colorRGBA = global.colorConvert.exec(colorStr);
    var colorRGBAJSON = JSON.stringify(colorRGBA);
    for (var n = 0; n < memory.colorDict.length; n++) {
      if (JSON.stringify(memory.colorDict[n].rgba) == colorRGBAJSON) {
        rgbaMatch = true;
        break;
      }
    }
    if (rgbaMatch) {
      return memory.colorDict[n].variable;
    } else {
      var newColorVariableName = memory.config.variablePrefix + String(10000 + memory.colorDict.length);
      var newColorVariable = {
        "variable": newColorVariableName,
        "value": colorStr,
        "rgba": colorRGBA
      };
      memory.colorDict.push(newColorVariable);
      memory.colorDictUpdated = true;
      return newColorVariableName;
    }
  }

  var genColorValueStr = function (rgba) {
    function toUpper16(number) {
      var Upper16 = parseInt(number).toString(16).toUpperCase();
      if (Upper16.length < 2) {
        Upper16 = '0' + Upper16;
      }
      return Upper16;
    }
    var colorStr16 = '#' + toUpper16(rgba.red) + toUpper16(rgba.green) + toUpper16(rgba.blue);
    var colorStrRgba = 'rgba(' + rgba.red + ', ' + rgba.green + ', ' + rgba.blue + ', ' + rgba.alpha + ')';
    var returnValue = '';
    if (rgba.alpha == 1) {
      returnValue = colorStr16 + ';  /* ' + colorStrRgba + ' */';
    } else {
      returnValue = colorStrRgba + ';  /* ' + colorStr16 + ' transparent:' + rgba.alpha + ' */';
    }
    return returnValue;
  }

  var printLog = function (level, message) {
    if (logLevel >= level) {
      console.log(message);
    }
  }

  var asyncStepExec = function (queue) {
    var allQueue = queue || [function () { memory.step = memory.step + 1 }];
    var currentStep = -1;
    var timerRate = 10; // ms
    var timeout = 300 * (1000 / timerRate);
    var memory = { "step": 0, "allQueue": allQueue, "currentTimeout": 0 };
    var timer = setInterval(function () {
      if (currentStep != memory.step) {
        if (memory.step < allQueue.length) {
          memory.currentTimeout = 0;
          currentStep = memory.step;
          queue[memory.step](memory);
        } else {
          clearInterval(timer);
        }
      } else {
        memory.currentTimeout = memory.currentTimeout + 1;
        if (memory.currentTimeout == timeout) {
          clearInterval(timer);
          console.warn('WARN: Progress of "asyncStepExec" is unfinished but time out!');
        }
      }
    }, timerRate);
  }

  var myQueue = [
    function (memory) {
      printLog('2', 'STEP: ' + memory.step);
      memory.identifer = 'Queue-No-' + (new Date()).getTime();
      console.time(memory.identifer);
      printLog('1', 'Loading config ...');
      if (global.colorDocConfig) {
        memory.config = global.colorDocConfig;
        memory.step = memory.step + 2;
      } else {
        fileOperate.readFile(memory, 'config.json');
      }
    },
    function (memory) {
      printLog('2', 'STEP: ' + memory.step);
      memory.config = memory.config || JSON.parse(memory.readFile);
      logLevel = memory.config.logLevel;
      memory.config.srcIgnore.push(memory.config.colorDictFilePath);
      printLog('1', 'Loading config OK.');
      memory.step = memory.step + 1;
    },
    function (memory) {
      printLog('2', 'STEP: ' + memory.step);
      printLog('1', 'Loading ' + memory.config.srcSuffix + ' dict ...');
      fileOperate.readFile(memory, memory.config.colorDictFilePath);
    },
    function (memory) {
      printLog('2', 'STEP: ' + memory.step);
      memory.colorDictFilePath = memory.readFile;
      printLog('1', 'Loading color dictionary OK.');
      memory.colorDict = global.colorConvert.readVariable(memory.colorDictFilePath);
      printLog('1', 'Parsing color dictionary OK.');
      memory.srcSuffixRegexp = new RegExp('\\' + memory.config.srcSuffix + '$');
      memory.fileMatchList = [];
      memory.step = memory.step + 1;
    },
    function (memory) {
      printLog('2', 'STEP: ' + memory.step);
      printLog('1', 'Scanning ' + memory.config.srcSuffix + ' files ...');
      fileOperate.mapFile(memory, memory.config.srcPath);
    },
    function (memory) {
      printLog('2', 'STEP: ' + memory.step);
      for (var i = 0; i < memory.fileMatchList.length; i++) {
        printLog('1', 'MATCH FILE: ' + memory.fileMatchList[i]);
      }
      printLog('1', 'Scanning ' + memory.config.srcSuffix + ' files OK , ' + memory.fileMatchList.length + ' "' + memory.config.srcSuffix + '" file found!');
      memory.step = memory.step + 1;
    },
    function (memory) {
      printLog('2', 'STEP: ' + memory.step);
      printLog('1', 'Launch color execute:');
      taskReplaceColorFile(memory);
      memory.step = memory.step + 1;
    },
    function (memory) {
      printLog('2', 'STEP: ' + memory.step);
      if (memory.colorDictUpdated) {
        printLog('1', 'Updating colorDict file "' + memory.config.colorDictFilePath + '" ...');
        var colorDictText = "/* VARIABLE COLORDICT */\r\n";
        for (var n = 0; n < memory.colorDict.length; n++) {
          colorDictText = colorDictText + memory.colorDict[n].variable + ': ' + genColorValueStr(memory.colorDict[n].rgba) + '\r\n';
        }
        fileSystem.writeFile(memory.config.colorDictFilePath, colorDictText, memory.config.encode, function (error) {
          if (error) {
            printLog('0', error);
            memory.step = memory.step + 1;
          } else {
            printLog('1', 'Update colorDict file "' + memory.config.colorDictFilePath + '" success!');
            if (memory.config.appDictFilePath) {
              fileSystem.writeFile(memory.config.appDictFilePath, colorDictText, memory.config.encode, function (error) {
                if (error) {
                  printLog('0', error);
                  memory.step = memory.step + 1;
                } else {
                  printLog('1', 'Export colorDict file "' + memory.config.appDictFilePath + '" success!');
                  memory.step = memory.step + 1;
                }
              });
            } else {
              memory.step = memory.step + 1;
            }
          }
        });
      } else {
        memory.step = memory.step + 1;
      }
    },
    function (memory) {
      printLog('2', 'STEP: ' + memory.step);
      printLog('1', 'Color execute finished!');
      console.timeEnd(memory.identifer);
      printLog('1', 'Process finished!');
      memory.step = memory.step + 1;
    }
  ];

  asyncStepExec(myQueue);
})();
