import Fastify from "fastify";
import { File } from "web3.storage";
import mongoose from "mongoose";
import path from "path";

const fileUpload = require("fastify-file-upload");

const fastify = Fastify({
  logger: true,
});

fastify.register(fileUpload);

fastify.register(require("@fastify/cors"), {
  origin: !process.env.PRODUCTION,
});

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
    root: path.join(__dirname, "../../client/build"),
    prefix: "/", // optional: default '/'
  });

  // this will work with fastify-static and send ./static/index.html
  fastify.setNotFoundHandler((req: any, res: any) => {
    res.sendFile("../../client/build/index.html");
  });

  fastify.get("/api/list", async (request, reply) => {
    const modules = await Module.find();
    reply.send(JSON.stringify(modules));
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
      module = new Module(meta);
      await module.save();
    }

    // send the user back the file info whenever
    reply.send(meta);
  });

  fastify.listen(port, "0.0.0.0", (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    fastify.log.info(`server listening on ${address} in ${opts.NODE_ENV} mode`);
  });
};
