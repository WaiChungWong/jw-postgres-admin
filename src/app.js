import express from "express";

import postgresAdmin from "./module";

const app = express();
const port = process.env.PORT || 3000;

app.use("/postgres-admin", postgresAdmin());

app.listen(port);

module.exports = app;
