const winston = require('winston');
const config = require('./config');
const Logger = require('../logging/Logger');
require('winston-daily-rotate-file');

var internalLogger = createInternalLogger();
var loggers = {};

function createInternalLogger() {
    let logLevelsConfig = {
        levels: {
            silly: 6,
            verbose: 5,
            info: 4,
            data: 3,
            warn: 2,
            debug: 1,
            error: 0
        },
        colors: {
            silly: 'magenta',
            verbose: 'cyan',
            info: 'green',
            data: 'grey',
            warn: 'yellow',
            debug: 'blue',
            error: 'red'
        }
    };

    winston.setLevels(logLevelsConfig.levels);
    winston.addColors(logLevelsConfig.colors);

    winston.remove(winston.transports.Console);

    let logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                level: config('NODE_ENV') == "development" ? 'silly' : "warn",
                colorize: true,
                timestamp: true
            }),
            new (winston.transports.DailyRotateFile)({
                filename: './log/log',
                datePattern: `yyyy-MM-dd.${config('NODE_ENV')}.`,
                prepend: true,
                level: config('log_level')
            })
        ]
    });

    return logger;
}

function logger(name) {
    if (!name) {
        name = "";
    }
    if (!loggers[name]) {
        if (name && config("loggers") != "all") {
            var loggerRequired = config("loggers").find(x => x == name);
            if (!loggerRequired) {
                internalLogger = null;
            }
        }
        loggers[name] = new Logger(name, internalLogger);
    }
    return loggers[name];
}

module.exports = logger;
