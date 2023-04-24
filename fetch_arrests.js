const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const retry = require('async-retry');
const appToken = 'EF9tKquFvTyf2HZtSV57v93On';

const mongoDBConnectionString = 'mongodb+srv://asimzaidi:Mdmr2ohIgPOKhzOs@cluster0.f6gxrln.mongodb.net/?retryWrites=true&w=majority';

const fetchArrests = async () => {
  let allArrests = [];
  let offset = 0;
  const limit = 50000;

  console.log('here');
  while (true) {
    const url = `https://data.cityofchicago.org/resource/dpt3-jri9.json?$$app_token=${appToken}&$limit=${limit}&$offset=${offset}`;

    // Wrap the fetch operation with retry
    const response = await retry(async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch data: ${res.status}`);
      }
      return res;
    }, {
      retries: 3, // Number of retries
      minTimeout: 1000, // Minimum time between retries (in milliseconds)
    });

    const arrests = await response.json();

    if (arrests.length === 0) {
      break;
    }

    console.log('arrests.length:', arrests.length);
    allArrests = allArrests.concat(arrests);
    offset += limit;
  }

  return allArrests;
};

const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

const storeArrestsInMongoDB = async (arrests) => {
  const client = new MongoClient(mongoDBConnectionString, { useNewUrlParser: true, useUnifiedTopology: true });

  if (!Array.isArray(arrests)) {
    throw new TypeError('Arrests must be an array');
  }

  try {
    await client.connect();
    const db = client.db('your_db_name');
    const arrestsCollection = db.collection('arrests');

    // Prepare bulk operations
    const arrestChunks = chunkArray(arrests, 1000);

    for (const chunk of arrestChunks) {
      const bulkOps = chunk.map((arrest) => ({
        updateOne: {
          filter: { case_number: arrest.case_number },
          update: { $set: arrest },
          upsert: true,
        },
      }));

      // Execute bulk operations
      await arrestsCollection.bulkWrite(bulkOps);
    }
  } finally {
    await client.close();
  }
};

const main = async () => {
  try {
    const arrests = await fetchArrests();
    console.log(`Fetched ${arrests.length} arrest records`);
    await storeArrestsInMongoDB(arrests);
    console.log(`Stored ${arrests.length} arrest records in MongoDB`);
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
};

main();
