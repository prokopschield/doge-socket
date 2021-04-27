import { ConfigField, getConfig } from 'doge-config';
import EventEmitter from 'events';
import { v4 as generateUUID } from 'uuid';
import ReconnectingWebSocket from './reconnecting-websocket';

const config = getConfig('doge-socket', {
	endpoint: 'wss://api.dogehouse.tv/socket',
	ping_interval: 7777,
});

const PING_INTERVAL = config.__getNumber('ping_interval');

export interface SocketState extends ConfigField {
	accessToken: string;
	refreshToken: string;
	reconnectToVoice: boolean;
	currentRoomId: string | null;
	muted: boolean;
	deafened: boolean;
}

export interface TransportObject {
	op: string;
	d: object;
	fetchId?: string;
}

export interface DogeSocketContructorArguments {
	identifier: string;
	accessToken?: string;
	refreshToken?: string;
}

export default class DogeSocket extends EventEmitter {
	/**
	 * Use your Dogehouse tokens as arguments
	 * @param identifier arbitrary identifier
	 * @param accessToken token
	 * @param refreshToken refresh_token
	 */
	constructor (identifier: string, accessToken?: string, refreshToken?: string) {
		super();
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
		this._state = cfield as any;
		this._socket = this.connect();

		this.on('new-tokens', (data: {
			accessToken: string;
			refreshToken: string;
		}) => {
			accessToken && (this.accessToken = accessToken);
			refreshToken && (this.refreshToken = refreshToken);
		});

		this.ping();
	}

	_open: boolean = false;
	private _socket: ReconnectingWebSocket;
	private _state: SocketState;

	private _lastping: Date = new Date;
	ping () {
		this._lastping = new Date;
		this._socket.send('ping');
		setTimeout(() => {
			if ((+Date.now() - +this._lastping) > 9991) {
				// make sure ping always happens eventually
				this.ping();
			}
		}, 9999);
	}

	connect (): ReconnectingWebSocket {
		this._connecting = true;
		this._socket = new ReconnectingWebSocket(config.__getString('endpoint'));
		this._socket.onopen = () => {
			this._open = true;
		}
		this._socket.onclose = () => {
			this._open = false;
		}
		this._socket.onmessage = (message) => {
			try {
				const msg = JSON.parse(message.data.toString());
				if (msg === 'ping') {
					this._socket.send('pong');
				} else if (msg === 'pong') {
					setTimeout(() => this.ping(), PING_INTERVAL);
				} else if (typeof msg === 'object') {
					if (!msg.op) {
						this.emit('null', msg.d, msg.fetchId);
					} else if (this.eventNames().includes(msg.op)) {
						this.emit(msg.op, msg.d, msg.fetchId);
					} else {
						console.log(`Not listening for opCode ${msg.op}`);
						console.log(msg);
					}
				}
			} catch (error) {
				this.emit('invalid', message);
			}

			if (this._sendqueue.length) {
				const obj = this._sendqueue.shift();
				if (typeof obj === 'object') {
					this.send(obj.op, obj.d, obj.fetchId);
				}
			}
		}
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
	_connecting = false;

	_sendqueue: Array<{
		op: string;
		d: object;
		fetchId: string | boolean | undefined;
	}> = [];

	send (op: string, d: object, fetchId?: string | boolean) {
		if (this._open) {
			this.__send(op, d, fetchId);
		} else {
			this._sendqueue.push({
				op,
				d,
				fetchId,
			});
		}
	}

	__send (op: string, d: object, fetchId?: string | boolean) {
		const transport_object: TransportObject = ({
			op,
			d,
		});
		if (typeof fetchId === 'string') {
			transport_object.fetchId = fetchId;
		} else if (fetchId) {
			transport_object.fetchId = generateUUID();
		}
		this._socket.send(JSON.stringify(transport_object));
	}

	get accessToken (): string {
		return this._state.__getString('accessToken');
	}

	set accessToken (accessToken: string) {
		this._state.__set('accessToken', accessToken);
	}

	get refreshToken (): string {
		return this._state.__getString('refreshToken');
	}

	set refreshToken (refreshToken: string) {
		this._state.__set('refreshToken', refreshToken);
	}

	get reconnectToVoice (): boolean {
		return this._state.__getBoolean('reconnectToVoice');
	}

	set reconnectToVoice (reconnectToVoice: boolean) {
		this._state.__set('reconnectToVoice', +reconnectToVoice);
	}

	get currentRoomId (): string|null {
		return this._state.__getString('currentRoomId') || null;
	}

	set currentRoomId (currentRoomId: string|null) {
		currentRoomId && this._state.__set('currentRoomId', currentRoomId);
	}

	get muted (): boolean {
		return this._state.__getBoolean('muted');
	}

	set muted (muted: boolean) {
		this._state.__set('muted', +muted);
	}

	get deafened (): boolean {
		return this._state.__getBoolean('deafened');
	}

	set deafened(deafened: boolean) {
		this._state.__set('deafened', +deafened);
	}
}

module.exports = DogeSocket;

Object.assign(DogeSocket, {
	default: DogeSocket,
	DogeSocket,
});
