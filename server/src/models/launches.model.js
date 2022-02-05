const axios = require('axios');

const launches = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 99;

// const launch = {
//     flightNumber: 100, // flight_number
//     mission: 'Kepler Exploration X', // name
//     rocket: 'Explorer IS1',  // rocket.name
//     launchDate: new Date('December 27, 2030'), // date_local
//     target: '61f5fcfa822a43543f92d472', // not applicable
//     customer: ['MAZA', 'ZTM'], // payload.customers
//     upcoming: true, // upcoming
//     success: true // success
// };

// saveLaunch(launch);

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
    console.log('Downloading Data...')
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: "rocket",
                    select: {
                        name: 1
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    });

    if (response.status !== 200) {
        console.log('Problem Downloading Launch Data!');
        throw new Error('Launch data download failed')
    }

    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap(payload => {
            return payload.customers
        });

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers
        };
        console.log(`${launch.flightNumber} ${launch.mission} ${launch.customers}`);
        await saveLaunch(launch);
    }
}

async function loadLaunchData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat'
    });

    if (!firstLaunch) {
        return await populateLaunches();     
    }

    console.log('Launch data already loaded');
}

async function findLaunch(filter) {
    return await launches.findOne(filter);
}

async function getAllLaunches (skip, limit) {
    return await launches
        .find({}, { '__v': 0 })
        .sort({
            flightNumber: 1
        })
        .skip(skip)
        .limit(limit);
}

async function existLaunchWithId(launchId) {
    return await launches.findOne({
        flightNumber: launchId
    });
}

async function saveLaunch(launch) {
    await launches.findOneAndUpdate({
        flightNumber: launch.flightNumber
    }, launch, {
        upsert: true
    });
}

async function getLatestFlightNumber() {
    const latestLaunch = await launches
        .findOne()
        .sort('-flightNumber');

    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }

    return latestLaunch.flightNumber;    
}

async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.target,
    });


    if (!planet) {
        throw new Error('No matching planet found!');
    }
    const newFlightNumber = await getLatestFlightNumber() + 1;

    const newLaunch = Object.assign(launch, {
        success: true,
        upcoming: true,
        customers: ['MAZA', 'ZTM'],
        flightNumber: newFlightNumber
    });

    await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
    const aborted = await launches.updateOne({
        flightNumber: launchId,
    }, {
        upcoming: false,
        success: false,
    });

    return aborted.modifiedCount === 1;
}

module.exports = {
    loadLaunchData,
    getAllLaunches,
    scheduleNewLaunch,
    existLaunchWithId,
    abortLaunchById,
}