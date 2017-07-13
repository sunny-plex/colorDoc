    var docApp = angular.module('doc', []);
    docApp.controller('ctrl', ['$scope', '$http', function ($scope, $http) {
        var fn = this;
        var configFilePath = './config.json';

        $scope.changeDocBg = function (event) {
            var trigger = event.path[0];
            var targetBgColor = trigger.style.backgroundColor;
            document.body.style.backgroundColor = targetBgColor;
        }

        $scope.searchColor = function () {
            $scope.colorInput = $scope.colorInput || '';
            var inputText = $scope.colorInput.replace(' ', '');
            if (inputText.length > 2) {
                $scope.colors = [];
                var currentSearchColor = fn.convertColor({}, inputText);
                var currentSearchColorStr = JSON.stringify(currentSearchColor.rgba);
                fn.colors.forEach(function (color, index) {
                    if (JSON.stringify(color.rgba) == currentSearchColorStr) {
                        $scope.colors.push(color);
                    }
                });
            } else {
                $scope.colors = fn.colors;
            }
        }

        fn.colors = [];

        fn.getAvailWidth = function () {
            $scope.availWidth = window.innerWidth;
        };

        fn.convertColor = function (colorObj, colorStr) {
            colorObj.rgba = window.colorConvert.exec(colorStr);
            // console.log(colorObj);
            return colorObj;
        }

        fn.getConfigFile = function (resolve, reject) {
            var result = false;
            $http({
                "url": configFilePath
            }).success(function (response, status) {
                result = response;
                fn.config = response;
                resolve();
            }).error(function () {
                reject();
            });
            return result;
        }

        fn.loadColorVarable = function () {
            $http({
                "url": fn.config.colorDictFilePath
            }).success(function (response, status) {
                fn.colors = window.colorConvert.readVariable(response);
                $scope.colors = fn.colors;
            }).error(function () {
                console.error('load "colorDictFile" faild!');
            });
        }

        fn.init = function () {
            // 列表自适应
            fn.getAvailWidth();
            window.addEventListener('resize', function () {
                fn.getAvailWidth();
            });

            // 读取配置
            var action = new Promise(function (resolve, reject) {
                console.log('Init Config ...');
                fn.getConfigFile(resolve, reject);
            }).then(function (e) {
                // 读取变量字典
                fn.loadColorVarable();
            }).catch(function (e) {
                console.error('load "configFilePath" faild!');
            });
        };

        fn.init();
    }]);
