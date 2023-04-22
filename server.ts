import { MongoClient } from 'mongodb';
import express, { Request, Response } from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const appToken = 'EF9tKquFvTyf2HZtSV57v93On';

// Enable CORS
app.use(cors());

interface CrimeData {
  year: number;
  crimes: number;
}

export type CrimeType =
  | 'HOMICIDE'
  | 'ASSAULT'
  | 'BATTERY'
  | 'ROBBERY'
  | 'SEXUAL_ASSAULT'
  | 'KIDNAPPING'
  | 'ARSON'
  | 'THEFT';

type LocationArea = 'north' | 'south' | 'west' | 'loop' | 'all' | string; // string will cover zip codes

interface QueryParameters {
  yearsToDisplay: number;
  crimeType: CrimeType | undefined;
  locationArea: LocationArea | undefined;
  season: 'summer' | 'winter' | 'annual';
}

const isCrimeInArea = (crime: any, area: LocationArea): boolean => {
  const northSideCommunityAreas = new Set([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 76, 77
  ]);
  
  const southSideCommunityAreas = new Set([
    19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71
  ]);
  
  const westSideCommunityAreas = new Set([
    15, 16, 17, 18, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71
  ]);
  
  const loopCommunityAreas = new Set([
    32
  ]);
  
  const communityArea = Number(crime.community_area);
  
  switch (area.toLowerCase()) {
    case 'north':
      return northSideCommunityAreas.has(communityArea);
    case 'south':
      return southSideCommunityAreas.has(communityArea);
    case 'west':
      return westSideCommunityAreas.has(communityArea);
    case 'loop':
      return loopCommunityAreas.has(communityArea);
    case 'all':
      console.log('HEREEE');
      
      return true;
    default:
      return crime.zip_code === area;
  }
};

const mongoDBConnectionString = 'mongodb+srv://asimzaidi:Mdmr2ohIgPOKhzOs@cluster0.f6gxrln.mongodb.net/?retryWrites=true&w=majority';

const getArrestData = async (caseNumbers: string[]) => {
  const client = new MongoClient(mongoDBConnectionString);

  try {
    await client.connect();
    const db = client.db('your_db_name');
    const arrestsCollection = db.collection('arrests');

    const arrestData = await arrestsCollection.find({ case_number: { $in: caseNumbers } }).toArray();

    return arrestData;
  } finally {
    await client.close();
  }
};

const groupArrestDataByRace = (arrestData: any[]) => {
  const raceCounts: { [key: string]: number } = {};

  arrestData.forEach((arrest) => {
    const race = arrest.race;

    if (raceCounts.hasOwnProperty(race)) {
      raceCounts[race] += 1;
    } else {
      raceCounts[race] = 1;
    }
  });

  return raceCounts;
};

app.get('/crime-trend', async (req: Request<{}, {}, {}, QueryParameters>, res: Response) => {
  const currentYear = new Date().getFullYear();
  const {
    crimeType = 'HOMICIDE',
    yearsToDisplay = 12,
    locationArea = 'all',
    season = 'annual',
  } = req.query;


  const fetchCrimeData = async (year: number, crimeType: CrimeType | undefined) => {
    
    let url = `https://data.cityofchicago.org/resource/ijzp-q8t2.json?$$app_token=${appToken}&year=${year}&$limit=50000`;

    if (crimeType) {
      url += `&primary_type=${encodeURIComponent(crimeType.toUpperCase())}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    const filteredData = data.filter((crime: { date: string }) => {

      const crimeMonth = parseInt(crime.date.slice(5, 7));

      const isSeasonMatch = season === 'summer' ? (crimeMonth >= 6 && crimeMonth <= 8) :
        season === 'winter' ? (crimeMonth <= 2 || crimeMonth === 12) : true;

      const isLocationMatch = isCrimeInArea(crime, locationArea);

      return isSeasonMatch && isLocationMatch;
    });
    // const caseNumbers = filteredData.map((crime: any) => crime.case_number);
    // const arrestData = await getArrestData(caseNumbers);
    // const arrestDataByRace = groupArrestDataByRace(arrestData);

    return {
      year: year,
      crimes: filteredData.length,
      // arrestDataByRace: arrestDataByRace
    };
  };
  
  try {
    const promises = Array.from({ length: yearsToDisplay }, async (_, i) => {
      const year = currentYear - i;
      const crimeData = await fetchCrimeData(year, crimeType);
      return crimeData;
    });

    const crimeTrend: CrimeData[] = await Promise.all(promises);
    res.json(crimeTrend);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching crime data' });
  }
});

const port = process.env.PORT || 5002;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
