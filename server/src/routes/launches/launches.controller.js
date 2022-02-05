const { getAllLaunches, scheduleNewLaunch, existLaunchWithId, abortLaunchById } = require('../../models/launches.model');
const { getPagination } = require('../../services/query');


async function httpGetAllLaunches (req, res) {
    const { skip, limit } = getPagination(req.query);
    try {
        const launches = await getAllLaunches(skip, limit);
        return res.status(200).json(launches);
    } catch (err) {
        return res.status(400).json({ error: err });
    }
    
}

async function httpAddNewLaunch (req, res) {
    const launch = req.body;
     if (!launch.mission || !launch.rocket || !launch.launchDate || !launch.target) {
        return res.status(400).json({
            error: 'Missing required launch property',
        });
    }

    launch.launchDate = new Date(launch.launchDate);
    if (isNaN(launch.launchDate)) {
        return res.status(400).json({
            error: 'Invalid launch date',
        });
    }

    await scheduleNewLaunch(launch);
    return res.status(201).json(launch);
}

async function httpAbortLaunch (req, res) {
    const launchId = Number(req.params.id);

    try {
        const existsLaunch = await existLaunchWithId(launchId);
        if (!existsLaunch) {
            //If launch doesn't exist
            return res.status(404).json({
                error: 'Launch not found'
            });
        }

        //If launch does exist
        const aborted = await abortLaunchById(launchId);
        if (!aborted) {
            return res.status(400).json({
                error: 'Launch not aborted!'
            });
        }
        return res.status(200).json({
            ok: true
        });
    } catch (err) {
        return res.status(400).json({ error: err });
    }
}

module.exports = {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpAbortLaunch
}


