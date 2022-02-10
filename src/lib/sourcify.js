import axios from 'axios';
import { isVerified, uploadObject, SOURCE_FILENAME, METADATA_FILENAME } from './aws';

async function getVerifiedContracts(){
  return await axios.get(
    `https://sourcify.dev/server/files/contracts/${process.env.EVM_CHAIN_ID}`
    );
}

async function getSource(contractAddress){
  return await axios.get(
    `https://sourcify.dev/server/files/${process.env.EVM_CHAIN_ID}/${contractAddress}`
    );
}

function findMetadata(source){
  return source.name === 'metadata.json';
}

async function updateVerifiedContractsData(verifiedList){
  let newCount = 0;
  for (address of verifiedList){
    const verified = await isVerified(address);
    if (!verified){
      const source = await getSource(address);
      const metadata = findMetadata(source);
      let buffer = new Buffer.from(JSON.stringify(metadata));
      await uploadObject(`${address}/${METADATA_FILENAME}`, buffer, contentType);
      buffer = new Buffer.from(JSON.stringify(source));
      await uploadObject(`${address}/${SOURCE_FILENAME}`, buffer, contentType)
      newCount++;
    }
  }
  return newCount;
}

(async function() { 
  const verifiedList = await getVerifiedContracts();
  const updateCount = await updateVerifiedContractsData(verifiedList.full);
  console.log(`Added ${updateCount} new verified contracts!`)
})();