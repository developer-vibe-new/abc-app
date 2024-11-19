const express = require('express');
const cors = require('cors');
const path = require('path');


const app = express();
require('dotenv').config();
const devConfig = require('./src/config/dev.config');
const session = require('express-session');
require('./src/config/db.config');
global.c = console.log.bind(console);

app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));
app.use((req, res, next) => {
    console.log(req.method, req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('body :', req.body, 'query :', req.query);
    req.date = new Date();
    next();
});
/* version V1 Routes */
// require('./src/app/routes')(app);
require('./src/admin/routes')(app);


app.use(session({
    secret: process.env.SECRET_Key,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
// set port, listen for requests
const PORT = devConfig.ADMINPORT || 6161;

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});