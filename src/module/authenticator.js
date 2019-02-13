import jwt from "jsonwebtoken";
import expressJWT from "express-jwt";
import uuidv1 from "uuid/v1";

const jwtSecret = uuidv1();

export const signToken = info => jwt.sign(info, jwtSecret);

export const getConnection = req => req && req.postgresAdminConnection;

export const authenticate = expressJWT({
  secret: jwtSecret,
  getToken: req => req && req.cookies && req.cookies.postgresAdminToken,
  requestProperty: "postgresAdminConnection"
});

export const unauthorizedHandler = (error, req, res, next) => next();
