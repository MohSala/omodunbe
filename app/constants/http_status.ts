export class HTTPStatus {
  static BAD_REQUEST: number;
  static CREATED: number;
  static INTERNAL_SERVER_ERROR: number;
  static OK: number;
  static NOT_FOUND: number;
  static UNAUTHORIZED: number;
}

Object.defineProperty(HTTPStatus, 'OK', {
  value: 200,
  writable: false,
  enumerable: true,
  configurable: false,
});

Object.defineProperty(HTTPStatus, 'CREATED', {
  value: 201,
  writable: false,
  enumerable: true,
  configurable: false,
});

Object.defineProperty(HTTPStatus, 'ACCEPTED', {
  value: 202,
  writable: false,
  enumerable: true,
  configurable: false,
});


Object.defineProperty(HTTPStatus, 'BAD_REQUEST', {
  value: 400,
  writable: false,
  enumerable: true,
  configurable: false,
});

Object.defineProperty(HTTPStatus, 'UNAUTHORIZED', {
  value: 401,
  writable: false,
  enumerable: true,
  configurable: false,
});

Object.defineProperty(HTTPStatus, 'NOT_FOUND', {
  value: 404,
  writable: false,
  enumerable: true,
  configurable: false,
});

Object.defineProperty(HTTPStatus, 'INTERNAL_SERVER_ERROR', {
  value: 500,
  writable: false,
  enumerable: true,
  configurable: false,
});

