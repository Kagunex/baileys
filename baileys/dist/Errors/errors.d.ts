export type KaguneXErrorOptions = {
    code?: string;
    statusCode?: number;
    cause?: unknown;
};
export declare class KaguneXError extends Error {
    readonly code: string;
    readonly statusCode?: number;
    readonly cause?: unknown;
    constructor(message: string, options?: KaguneXErrorOptions);
}
export declare class ConnectionError extends KaguneXError {
    constructor(message: string, options?: KaguneXErrorOptions);
}
export declare class AuthenticationError extends KaguneXError {
    constructor(message: string, options?: KaguneXErrorOptions);
}
export declare class ProtocolError extends KaguneXError {
    constructor(message: string, options?: KaguneXErrorOptions);
}
export declare class MessageError extends KaguneXError {
    constructor(message: string, options?: KaguneXErrorOptions);
}
export declare class MediaError extends KaguneXError {
    constructor(message: string, options?: KaguneXErrorOptions);
}
export declare class GroupError extends KaguneXError {
    constructor(message: string, options?: KaguneXErrorOptions);
}
export declare class TimeoutError extends KaguneXError {
    constructor(message: string, options?: KaguneXErrorOptions);
}
export declare class NotImplementedError extends KaguneXError {
    constructor(feature: string, options?: KaguneXErrorOptions);
}
//# sourceMappingURL=errors.d.ts.map