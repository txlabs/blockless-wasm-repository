import { Logger as LogglyLogger } from "@dmikey/fastify-loggly";

export const Logger = () => {
  return LogglyLogger(undefined, {
    token: process.env.LOGGLY_TOKEN || "",
    subdomain: process.env.LOGGLY_SUBDOMAIN || "",
    tags: ["wasi_server"],
    json: true,
  });
};
