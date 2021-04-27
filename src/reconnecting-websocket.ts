/**
 * Polyfills WebSocket to global object,
 * if it does not exist.
 */

const gobj: any = (typeof global === 'object') ? global : window;

if (!gobj.WebSocket) {
	gobj.WebSocket = require('ws');
}

import ReconnectingWebSocket from 'reconnecting-websocket';
export default ReconnectingWebSocket;
module.exports = ReconnectingWebSocket;

Object.assign(ReconnectingWebSocket, {
	default: ReconnectingWebSocket,
	ReconnectingWebSocket,
});
