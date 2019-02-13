"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unauthorizedHandler = exports.authenticate = exports.getConnection = exports.signToken = undefined;

var _jsonwebtoken = require("jsonwebtoken");

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _expressJwt = require("express-jwt");

var _expressJwt2 = _interopRequireDefault(_expressJwt);

var _v = require("uuid/v1");

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const jwtSecret = (0, _v2.default)();

const signToken = exports.signToken = info => _jsonwebtoken2.default.sign(info, jwtSecret);

const getConnection = exports.getConnection = req => req && req.postgresAdminConnection;

const authenticate = exports.authenticate = (0, _expressJwt2.default)({
  secret: jwtSecret,
  getToken: req => req && req.cookies && req.cookies.postgresAdminToken,
  requestProperty: "postgresAdminConnection"
});

const unauthorizedHandler = exports.unauthorizedHandler = (error, req, res, next) => next();