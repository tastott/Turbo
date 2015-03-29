import winston = require('winston')

export interface LogService {
    Info(message: string, data?: any): void;
    Error(message: string, error: any, data?: any): void;
} 

export class WinstonLogService {
    private logger: winston.LoggerInstance;

    constructor(logPath: string) {

        var transports = [
            new (winston.transports.Console)()
        ];

        if (logPath) transports.push(new (winston.transports.File)({ filename: logPath, handleExceptions: true }));

        this.logger = new (winston.Logger)({
            transports: transports
        });
    }

    Info(message: string, data?: any): void {
        if (data) this.logger.log('info', message, data, null);
        else this.logger.info(message);
    }

    Error(message: string, error: any, data?: any): void {
        if (data) error.data = data;
        this.logger.error(message, error, null);
    }
}