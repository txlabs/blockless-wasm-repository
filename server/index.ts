import { Web3Storage } from "web3.storage";
import dotenv from "dotenv";
import { start as serverStart } from "./server";

const envconfig: any = dotenv.config().parsed;
function getAccessToken() {
  // If you're just testing, you can paste in a token
  // and uncomment the following line:
  // return 'paste-your-token-here'

  // In a real app, it's better to read an access token from an
  // environement variable or other configuration that's kept outside of
  // your code base. For this to work, you need to set the
  // WEB3STORAGE_TOKEN environment variable before you run your code.
  return envconfig.WEB3STORAGE_TOKEN;
}

function makeStorageClient() {
  return new Web3Storage({ token: getAccessToken() } as any);
}

const storageClient = makeStorageClient();
serverStart(storageClient, envconfig, 3005);
