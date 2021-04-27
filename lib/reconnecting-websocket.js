"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gobj = (typeof global === 'object') ? global : window;
if (!gobj.WebSocket) {
    gobj.WebSocket = require('ws');
}
const reconnecting_websocket_1 = __importDefault(require("reconnecting-websocket"));
exports.default = reconnecting_websocket_1.default;
module.exports = reconnecting_websocket_1.default;
Object.assign(reconnecting_websocket_1.default, {
    default: reconnecting_websocket_1.default,
    ReconnectingWebSocket: reconnecting_websocket_1.default,
});
