"use strict";
exports.id = 6969;
exports.ids = [6969];
exports.modules = {

/***/ 26969:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   splitPathsBySizeLoader: () => (/* binding */ splitPathsBySizeLoader)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3633);
/* harmony import */ var change_case__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(61387);
/* harmony import */ var _iconTypes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(18234);
/*
 * Copyright 2023 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */



/**
 * A dynamic loader for icon paths that generates separate chunks for the two size variants.
 */
var splitPathsBySizeLoader = function (name, size) { return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__awaiter)(void 0, void 0, void 0, function () {
    var key, pathsRecord;
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__generator)(this, function (_a) {
        switch (_a.label) {
            case 0:
                key = (0,change_case__WEBPACK_IMPORTED_MODULE_1__/* .pascalCase */ .Ho)(name);
                if (!(size === _iconTypes__WEBPACK_IMPORTED_MODULE_2__/* .IconSize */ .J.STANDARD)) return [3 /*break*/, 2];
                return [4 /*yield*/, __webpack_require__.e(/* import() | blueprint-icons-16px-paths */ 3500).then(__webpack_require__.bind(__webpack_require__, 53276))];
            case 1:
                pathsRecord = _a.sent();
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, __webpack_require__.e(/* import() | blueprint-icons-20px-paths */ 2680).then(__webpack_require__.bind(__webpack_require__, 90375))];
            case 3:
                pathsRecord = _a.sent();
                _a.label = 4;
            case 4: return [2 /*return*/, pathsRecord[key]];
        }
    });
}); };
//# sourceMappingURL=splitPathsBySizeLoader.js.map

/***/ })

};
;