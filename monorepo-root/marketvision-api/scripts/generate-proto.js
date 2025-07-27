import { execSync } from 'child_process';
import { join } from 'path';

const PROTO_DIR = join(process.cwd(), 'src/proto');
const MODEL_DIR = join(process.cwd(), 'generated/proto');

const protoConfig = {
  'raw-product.proto': {
    source: join(process.cwd(), '../db-api/src/proto/raw-product.proto'),
    dest: PROTO_DIR
  }
};

// Ensure directories exist
execSync(`mkdir -p ${PROTO_DIR}`);
execSync(`mkdir -p ${MODEL_DIR}`);

// Copy and generate proto files
Object.entries(protoConfig).forEach(([protoFile, config]) => {
  execSync(`cp ${config.source} ${config.dest}`);
  
  execSync(`protoc \
    --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
    --ts_out=${MODEL_DIR} \
    --js_out=import_style=commonjs,binary:${MODEL_DIR} \
    --grpc_out=grpc_js:${MODEL_DIR} \
    ${join(PROTO_DIR, protoFile)}`
  );
}); 