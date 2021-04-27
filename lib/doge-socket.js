"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const doge_config_1 = require("doge-config");
const events_1 = __importDefault(require("events"));
const uuid_1 = require("uuid");
const reconnecting_websocket_1 = __importDefault(require("./reconnecting-websocket"));
const config = doge_config_1.getConfig('doge-socket', {
    endpoint: 'wss://api.dogehouse.tv/socket',
    ping_interval: 7777,
});
const PING_INTERVAL = config.__getNumber('ping_interval');
class DogeSocket extends events_1.default {
    constructor(identifier, accessToken, refreshToken) {
        super();
        this._open = false;
        this._lastping = new Date;
        this._connecting = false;
        this._sendqueue = [];
        const cfield = config.__getField('__state').__getField(identifier);
        if (identifier && !cfield.__getString('identifier')) {
            cfield.__set('identifier', identifier);
        }
        if (accessToken && !cfield.__getString('accessToken')) {
            cfield.__set('accessToken', accessToken);
        }
        if (refreshToken && !cfield.__getString('refreshToken')) {
            cfield.__set('refreshToken', refreshToken);
        }
        this._state = cfield;
        this._socket = this.connect();
        this.on('new-tokens', (data) => {
            accessToken && (this.accessToken = accessToken);
            refreshToken && (this.refreshToken = refreshToken);
        });
        this.ping();
    }
    ping() {
        this._lastping = new Date;
        this._socket.send('ping');
        setTimeout(() => {
            if ((+Date.now() - +this._lastping) > 9991) {
                this.ping();
            }
        }, 9999);
    }
    connect() {
        this._connecting = true;
        this._socket = new reconnecting_websocket_1.default(config.__getString('endpoint'));
        this._socket.onopen = () => {
            this._open = true;
        };
        this._socket.onclose = () => {
            this._open = false;
        };
        this._socket.onmessage = (message) => {
            try {
                const msg = JSON.parse(message.data.toString());
                if (msg === 'ping') {
                    this._socket.send('pong');
                }
                else if (msg === 'pong') {
                    setTimeout(() => this.ping(), PING_INTERVAL);
                }
                else if (typeof msg === 'object') {
                    if (!msg.op) {
                        this.emit('null', msg.d, msg.fetchId);
                    }
                    else if (this.eventNames().includes(msg.op)) {
                        this.emit(msg.op, msg.d, msg.fetchId);
                    }
                    else {
                        console.log(`Not listening for opCode ${msg.op}`);
                        console.log(msg);
                    }
                }
            }
            catch (error) {
                this.emit('invalid', message);
            }
            if (this._sendqueue.length) {
                const obj = this._sendqueue.shift();
                if (typeof obj === 'object') {
                    this.send(obj.op, obj.d, obj.fetchId);
                }
            }
        };
        this.send('auth', {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            reconnectToVoice: this.reconnectToVoice,
            currentRoomId: this.currentRoomId,
            muted: this.muted,
            deafened: this.deafened,
        });
        return this._socket;
    }
    send(op, d, fetchId) {
        if (this._open) {
            this.__send(op, d, fetchId);
        }
        else {
            this._sendqueue.push({
                op,
                d,
                fetchId,
            });
        }
    }
    __send(op, d, fetchId) {
        const transport_object = ({
            op,
            d,
        });
        if (typeof fetchId === 'string') {
            transport_object.fetchId = fetchId;
        }
        else if (fetchId) {
            transport_object.fetchId = uuid_1.v4();
        }
        this._socket.send(JSON.stringify(transport_object));
    }
    get accessToken() {
        return this._state.__getString('accessToken');
    }
    set accessToken(accessToken) {
        this._state.__set('accessToken', accessToken);
    }
    get refreshToken() {
        return this._state.__getString('refreshToken');
    }
    set refreshToken(refreshToken) {
        this._state.__set('refreshToken', refreshToken);
    }
    get reconnectToVoice() {
        return this._state.__getBoolean('reconnectToVoice');
    }
    set reconnectToVoice(reconnectToVoice) {
        this._state.__set('reconnectToVoice', +reconnectToVoice);
    }
    get currentRoomId() {
        return this._state.__getString('currentRoomId') || null;
    }
    set currentRoomId(currentRoomId) {
        currentRoomId && this._state.__set('currentRoomId', currentRoomId);
    }
    get muted() {
        return this._state.__getBoolean('muted');
    }
    set muted(muted) {
        this._state.__set('muted', +muted);
    }
    get deafened() {
        return this._state.__getBoolean('deafened');
    }
    set deafened(deafened) {
        this._state.__set('deafened', +deafened);
    }
}
exports.default = DogeSocket;
module.exports = DogeSocket;
Object.assign(DogeSocket, {
    default: DogeSocket,
    DogeSocket,
});
