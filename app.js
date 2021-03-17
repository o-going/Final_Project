const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const logger = require('morgan');
const path = require('path');
const crypto = require('crypto');
const Swal = require('sweetalert2');

const pageRouter = require('./routes/page');

const app = express();
const port = 3000;

const timeout = require('connect-timeout')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(timeout('100s'))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session
app.use(session({
  secret: 'final_project',
  resave: false,
  saveUninitialized: true,
  cookie: {
      httpOnly: true,
      secure: false,
  },
}));

app.use('/', pageRouter)

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});