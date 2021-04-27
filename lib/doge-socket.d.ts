/// <reference types="node" />
import { ConfigField } from 'doge-config';
import EventEmitter from 'events';
import ReconnectingWebSocket from './reconnecting-websocket';
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
    constructor(identifier: string, accessToken?: string, refreshToken?: string);
    _open: boolean;
    private _socket;
    private _state;
    private _lastping;
    ping(): void;
    connect(): ReconnectingWebSocket;
    _connecting: boolean;
    _sendqueue: Array<{
        op: string;
        d: object;
        fetchId: string | boolean | undefined;
    }>;
    send(op: string, d: object, fetchId?: string | boolean): void;
    __send(op: string, d: object, fetchId?: string | boolean): void;
    get accessToken(): string;
    set accessToken(accessToken: string);
    get refreshToken(): string;
    set refreshToken(refreshToken: string);
    get reconnectToVoice(): boolean;
    set reconnectToVoice(reconnectToVoice: boolean);
    get currentRoomId(): string | null;
    set currentRoomId(currentRoomId: string | null);
    get muted(): boolean;
    set muted(muted: boolean);
    get deafened(): boolean;
    set deafened(deafened: boolean);
}
