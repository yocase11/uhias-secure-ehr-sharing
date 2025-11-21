const { create } = require('ipfs-http-client');
const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

async function uploadBuffer(buf) {
  const result = await ipfs.add(buf);
  return result.path;
}

module.exports = { uploadBuffer };
