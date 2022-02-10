import axios from 'axios';
import { isVerified, uploadObject, SOURCE_FILENAME, METADATA_FILENAME } from './aws.js';
const EVM_CHAIN_ID = 40;

async function getVerifiedContracts(){
  try{
    return await axios.get(
      `https://sourcify.dev/server/files/contracts/${EVM_CHAIN_ID}`
      );
  }catch(e){
    console.log(e);
  }

}

async function getSource(contractAddress){
  try{
    return await axios.get(
      `https://sourcify.dev/server/files/${EVM_CHAIN_ID}/${contractAddress}`
      );
  }catch(e){
    console.log(e);
  }
}

async function updateVerifiedContractsData(verifiedList){
  let newCount = 0;
  for (let address of verifiedList){
    const verified = await isVerified(address);
    if (verified){
      const source = await getSource(address);   
      const metadata = source.data.find(file => file.name === 'metadata.json');
      try{
        let buffer = new Buffer.from(JSON.stringify(metadata));
        await uploadObject(`${address}/${METADATA_FILENAME}`, buffer);
        buffer = new Buffer.from(JSON.stringify(source.data));
        await uploadObject(`${address}/${SOURCE_FILENAME}`, buffer)
      }catch(e){
        console.log(e)
      }
      newCount++;
    }
  }
  return newCount;
}

// (async function() { 
//   const verifiedList = await getVerifiedContracts();
//   const updateCount = await updateVerifiedContractsData(verifiedList.data.full);
//   console.log(`Added ${updateCount} new verified contracts!`)
// })();