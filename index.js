const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors())
const PORT = 3000;
const API_KEY = '15106e32380f4441a9e659ec6346fa9c';

const doctors = [
    {name:'Pawan kumar',age:21,city:"Patna"},
    {name:"Saurabh",age:25,city:"Delhi"},
    {name:"Aman Singh",age:33,city:"Mumbai"},
    {name:"Abshieak",age:26,city:'Noida'},
    {name:"Vivek",age:42,city:'Lucknow'} ,
    {name:"Sohan",age:42,city:'Puna'} 
]


async function geocodeCity(city) {
  try {
    const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${API_KEY}`);
    
    const { results } = response.data;

    if (results.length > 0) {
      const { lat, lng } = results[0].geometry;
      return { latitude: lat, longitude: lng };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding city:', error);
    return null;
  }
}

// Calculate distance between two sets of coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// Sort persons array by location
async function sortPersonsByLocation(persons) {
  const sortedPersons = [];

  for (const person of persons) {
    const { city } = person;
    const location = await geocodeCity(city);

    if (location) {
      sortedPersons.push({ ...person, location });
    }
  }

  sortedPersons.sort((a, b) => {
    if (a.location.latitude === b.location.latitude) {
      return a.location.longitude - b.location.longitude;
    }
    return a.location.latitude - b.location.latitude;
  });

  return sortedPersons;
}

// Generate random persons data and sort by location
app.get('/persons', async (req, res) => {
  const sortedPersons = await sortPersonsByLocation(doctors);
  res.json(sortedPersons);
});




app.get('/persons/nearest', async (req, res) => {

    const {city} = req.query;
    const locatData =await geocodeCity(city)

    // console.log(city)
    if(locatData){
      res.send({msg:"Please Enter a valid Location"})
    }
    const { latitude, longitude } = locatData;  
    const distances = [];
    for (const person of doctors) {
      const { city } = person;
      const location = await geocodeCity(city);
  
      if (location) {
        const distance = calculateDistance(latitude, longitude, location.latitude, location.longitude);
        if(distance<1000){
          console.log(distance)
          distances.push({ person, distance });
        }
      }
    }
  
  if(distances.length>=3){
    distances.sort((a, b) => a.distance - b.distance);
    const nearestPersons = distances.slice(0, 3).map(({ person }) => person);
  
    res.json(nearestPersons);
  }else{
    res.json(distances)
  }

  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
