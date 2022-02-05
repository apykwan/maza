const request = require('supertest');

const app = require('../../app');
const { mongoConnect, mongoDisconnect } = require('../../services/mongo');

const { loadPlanetsData } = require('../../models/planets.model');

describe('Launches API', () => {
    beforeAll(async () => {
        await mongoConnect();
        await loadPlanetsData();
    });

    afterAll(async () => {
        await mongoDisconnect();
    });

    describe('Test GET /launches', () => {
        test('It should respond with 200 success', async () => {
            const response = await request(app)
                .get('/v1/launches')
                .expect('Content-Type', /json/);
            expect(response.statusCode).toBe(200);
        });
    });

    describe('Test POST /launch', () => {
        const completeLaunchData = {
            mission: "ZTM155",
            rocket: "ZTM Experimental IS1",
            target: "61f5fcfa822a43543f92d472",
            launchDate: "January 17, 2030"
        };

        const completeLaunchWithoutDate = {
            mission: "ZTM155",
            rocket: "ZTM Experimental IS1",
            target: "61f5fcfa822a43543f92d472",
        };

        test('It should respond with 201 created', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(completeLaunchData)
                .expect('Content-Type', /json/)
                .expect(201);

            const requestDate = new Date(completeLaunchData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();
            expect(responseDate).toBe(requestDate);
            
            expect(response.body)
                .toMatchObject(completeLaunchWithoutDate);
        });

        test('It should catch missing required properties', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(completeLaunchWithoutDate)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body)
                .toStrictEqual({
                    error: 'Missing required launch property',
                });
        });

        const launchDatawithInvalidDate = {
            mission: "ZTM155",
            rocket: "ZTM Experimental IS1",
            target: "61f5fcfa822a43543f92d472",
            launchDate: "zoot"
        };

        test('It should catch invalid dates', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(launchDatawithInvalidDate)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body)
                .toStrictEqual({
                    error: 'Invalid launch date',
                });

        });
    });
});

