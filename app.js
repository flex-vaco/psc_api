const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser')
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const employeesRouter = require('./routes/employees');
const projectsRouter = require('./routes/projects');
const applicationRouter = require('./routes/application');
const empPrjAlocRouter = require('./routes/projectAllocations');
const empPrjUtiliRouter = require('./routes/projecUtilizations');
const reportsRouter = require('./routes/reports');
const clientsRouter = require('./routes/clients');
const timesheetsRouter = require('./routes/timesheets');
const hiringsRouter = require('./routes/hirings');
const categoriesRouter = require('./routes/categories');
const cors = require('cors');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});    

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/employees', employeesRouter);
app.use('/projects', projectsRouter);
app.use('/application', applicationRouter);
app.use('/empPrjAloc', empPrjAlocRouter);
app.use('/empPrjUtili', empPrjUtiliRouter);
app.use('/reports', reportsRouter);
app.use('/clients', clientsRouter);
app.use('/timesheets', timesheetsRouter);
app.use('/hirings', hiringsRouter);
app.use('/categories', categoriesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
