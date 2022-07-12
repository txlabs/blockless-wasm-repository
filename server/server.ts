import Fastify from "fastify";
import { File } from "web3.storage";
import mongoose from "mongoose";
import path from "path";
import LRU from "lru-cache";
import fileUpload from "fastify-file-upload";
import metricsPlugin from "fastify-metrics";
import client from "prom-client";
import { Logger } from "./logger";
const WASI_UPLOAD_COUNTER = new client.Counter({
  name: "wasi_package_uploads_total",
  help: "the number of total package uploads, not unique",
});

const WASI_UPLOAD_UNIQUE_COUNTER = new client.Counter({
  name: "wasi_package_uploads_unique",
  help: "the number of total package uploads, unique",
});

const REPOSITORY_SYNC_REQUESTS = new client.Counter({
  name: "repository_sync_requests_total",
  help: "the number of total requests from networking layer to sync with the repository",
});

const REPOSITORY_FILE_SERVE_REQUESTS = new client.Counter({
  name: "repository_file_serve_requests_total",
  help: "the number of total requests from networking layer to sync with the repository",
});

const REPOSITORY_FILE_SERVE_CACHED_REQUESTS = new client.Counter({
  name: "repository_file_serve_cached_requests_total",
  help: "the number of total CACHED requests from networking layer to sync with the repository",
});

const options = {
  sizeCalculation: (value: any, key: any) => {
    return 1;
  },
  max: 500,
  maxSize: 5000,
  ttl: 1000 * 60 * 5,
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
};

const cache = new LRU(options);

const fastify = Fastify({
  logger: Logger(),
});

fastify.register(fileUpload, {
  limits: { fileSize: 10 * 1024 * 1024 },
});

fastify.register(require("@fastify/cors"), {
  origin: !process.env.PRODUCTION,
});

fastify.register(metricsPlugin, { endpoint: "/metrics" });

const ModuleSchema = new mongoose.Schema({
  name: String,
  cid: String,
  created: Date,
  descriotion: String,
  runtime: Object,
});
const Module = mongoose.model("Module", ModuleSchema);

export const start = async (
  storageClient: any,
  opts: any,
  port: number = 3000
) => {
  await mongoose.connect(opts.MONGO_CN_STRING);

  fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "../client/build"),
    prefix: "/",
  });

  fastify.get("/api/list", async (request, reply) => {
    const modules = await Module.find();
    reply.send(JSON.stringify(modules, null, 2));
  });

  fastify.post("/api/submit", async (request: any, reply) => {
    const files = request.raw.files;

    let fileArr = [];
    for (let key in files) {
      const blob = new Blob([files[key].data]);
      fileArr.push(new File([blob], files[key].name));
    }
    // web3Storage will hash our CAR and return us one if it already exists
    const result = await storageClient.put(fileArr);
    let module = await Module.findOne({ cid: result });

    // @todo check if the file is already in the database
    // @todo verify the manifest is good
    let manifest;
    try {
      manifest = JSON.parse(files["manifest"].data.toString());
    } catch (e) {
      reply.send('{"error": "Invalid manifest file"}');
    }

    const meta = {
      name: manifest.name,
      description: manifest.description || "",
      runtime: manifest.runtime,
      cid: result,
      created: new Date(),
    };

    // if this module doesn't exist in mongodb then save it
    if (!module) {
      WASI_UPLOAD_UNIQUE_COUNTER.inc();
      module = new Module(meta);
      await module.save();
    }

    WASI_UPLOAD_COUNTER.inc(); // Increment by 1
    // send the user back the file info whenever
    reply.send(meta);
  });

  // build a module directory listing the networking layer currently
  // uses this format
  // @todo: move to a proper exchange format
  fastify.get("/api/sync", async (request, reply) => {
    REPOSITORY_SYNC_REQUESTS.inc();

    const modules = await Module.find();

    const list = modules.map((module: any) => {
      return `<a href="${module.cid}/">${module.cid}</a>`;
    });

    const html = `
        <html>
        <head><title>Index of /public-repository/</title></head>
        <body>
        <h1>Index of /public-repository/</h1><hr><pre><a href="../">../</a>
        ${list}
        </pre><hr></body>
        </html>
    `;
    reply.header("Content-Type", "text/html").status(200).send(html);
  });

  // retrieves and caches a file from the IPFS network
  fastify.get("/api/sync/:cid/:file", async (request, reply) => {
    REPOSITORY_FILE_SERVE_REQUESTS.inc();

    // fetch the file from the storage client
    const { cid }: any = request.params;
    const cacheid = request.url;
    const cached = cache.get(cacheid); // "value"
    const filePart = request.url.split("/").pop();

    if (cached) {
      REPOSITORY_FILE_SERVE_CACHED_REQUESTS.inc();
      fastify.log.info(`Cache hit for ${cid}`);
      reply
        .header("Content-Type", cached.type)
        .status(200)
        .send(Buffer.concat(cached.chunks));
      return;
    }

    fastify.log.info(`Starting Upstream Request for ${cid}/${filePart}`);
    const res: any = await fetch(`https://${cid}.ipfs.dweb.link/${filePart}`);
    fastify.log.info(`Finished Upstream Request for ${cid}/${filePart}.json`);

    const chunks = [];
    for await (let chunk of res.body) {
      chunks.push(chunk);
    }

    if (request.url.indexOf("manifest.json") > -1) {
      // manifest
      const manifest = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
      manifest.id = cid;

      // cast back as chunks
      const Readable = require("stream").Readable;
      const s = new Readable();
      s._read = () => {}; // redundant? see update below
      s.push(JSON.stringify(manifest, null, 2));
      s.push(null);
      const _chunks = [];
      for await (let chunk of s) {
        _chunks.push(chunk);
      }
      // store chunks
      cache.set(cacheid, { chunks: _chunks, type: "application/json" });

      // serve
      reply.type("application/json");
      reply.send(JSON.stringify(manifest, null, 2));
      return;
    }

    const returnType = res.headers.get("content-type");
    reply.type(returnType);
    cache.set(cacheid, { chunks, type: returnType });
    reply.send(Buffer.concat(chunks));
  });

  fastify.setNotFoundHandler((request: any, reply: any) => {
    // API 404
    if (request.raw.url && request.raw.url.startsWith("/api")) {
      return reply.status(404).send({
        success: false,
        error: {
          kind: "user_input",
          message: "Not Found",
        },
      });
    }

    // send the react spa and it can handle 404s in it's router
    const staticHTMLPath = path.resolve(
      __dirname,
      "../client/build/index.html"
    );
    reply.status(200).sendFile(staticHTMLPath);
  });

  fastify.listen(port, "0.0.0.0", (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    fastify.log.info(`server listening on ${address} in ${opts.NODE_ENV} mode`);
  });
};
