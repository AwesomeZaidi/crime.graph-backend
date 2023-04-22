// const express = require('express');
// const fetch = require('node-fetch');
// const app = express();

// const appToken = 'EF9tKquFvTyf2HZtSV57v93On';

// const getCrimeCounts = async (startDate, endDate) => {
//   const url = `https://data.cityofchicago.org/resource/ijzp-q8t2.json?$$app_token=${appToken}&$where=date%20between%20%27${startDate}T00:00:00%27%20and%20%27${endDate}T00:00:00%27`;
//   const response = await fetch(url);
//   const data = await response.json();
//   return data.length;
// };

// app.get('/crime-trend', async (req, res) => {
//   try {
//     const currentDate = new Date();
//     const pastYearDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1)).toISOString().split('T')[0];
//     const twoYearsAgoDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1)).toISOString().split('T')[0];

//     const pastYearCrimeCount = await getCrimeCounts(pastYearDate, currentDate.toISOString().split('T')[0]);
//     const previousYearCrimeCount = await getCrimeCounts(twoYearsAgoDate, pastYearDate);

//     const crimeDifference = pastYearCrimeCount - previousYearCrimeCount;
//     const trend = crimeDifference > 0 ? 'up' : (crimeDifference < 0 ? 'down' : 'no change');

//     res.json({
//       pastYearCrimeCount,
//       previousYearCrimeCount,
//       crimeDifference,
//       trend
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error fetching data from SODA API");
//   }
// });

// const port = process.env.PORT || 5002;
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });