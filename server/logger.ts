const logger = require("pino")();
var loggly = require("node-loggly-bulk");
var stringify = require("json-stringify-safe");

export const Logger = (appname: string = "fastify_app") => {
  //// Here we use winston.containers IoC

  var client = loggly.createClient({
    token: "cd03fa38-b742-47e5-ad08-e39962b4df41",
    subdomain: "blockless",
    tags: ["wasi_server"],
    json: true,
  });

  const isProduction = process.env.NODE_ENV === "production";
  const log = (level: string, context: any, msg: any) => {
    var sanitized = JSON.parse(stringify(context));
    if (msg) sanitized.msg = msg;
    if (isProduction) client.log(sanitized, [level]);
    logger[level](sanitized);
  };

  class Logger {
    constructor(...args: any) {
      (this as any).args = args;
    }
    info(context: any, msg: any) {
      log("info", context, msg);
    }
    error(context: any, msg: any) {
      log("error", context, msg);
    }
    debug(context: any, msg: any) {
      log("debug", context, msg);
    }
    fatal(context: any, msg: any) {
      log("fatal", context, msg);
    }
    warn(context: any, msg: any) {
      log("warn", context, msg);
    }
    trace(context: any, msg: any) {
      log("trace", context, msg);
    }
    child(): any {
      return new Logger();
    }
    toJSON() {
      return {
        logger: "instance",
      };
    }
  }

  return new Logger();
};
