const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const planets = require('./planets.mongo');

function isHabitablePlanet(planet) {
    return planet['koi_disposition'] === 'CONFIRMED' 
        && planet['koi_insol'] > 0.36 
        && planet['koi_insol'] < 1.11
        && planet['koi_prad'] < 1.6;
}

/**
 *  const promise = new Promise((resolve, reject) => {});
 *  promise.then(result => console.log(result))
 */

function loadPlanetsData() {
    return new Promise((resolve, reject) => {
        const dataPath = path.join(__dirname, '../../', 'data', 'kepler_data.csv');

        fs.createReadStream(dataPath)
            .pipe(parse({
                comment: '#',
                columns: true
            }))
            .on('data', async data => {
                if (isHabitablePlanet(data)) {
                    // const alreadyExisted = await planets.find({ keplerName: data.kepler_name });
                    // if (!alreadyExisted) {
                    //     // insert + update = upsert
                    //     await planets.create({
                    //         keplerName: data.kepler_name
                    //     });
                    // }  
                    // Insert + update = upsert
                    savePlanet(data);
                }
            })
            .on('error', err => {
                reject(err);
            })
            .on('end', () => {
                resolve();
            });
    });
}

async function savePlanet(planet) {
  try {
    await planets.updateOne({
      keplerName: planet.kepler_name,
    }, {
      keplerName: planet.kepler_name,
    }, {
      upsert: true,
    });
  } catch(err) {
    console.error(`Could not save planet ${err}`);
  }
}

async function getAllPlanets () {
    return await planets.find({}, '-__v');
}

module.exports = {
    loadPlanetsData,
    getAllPlanets
};