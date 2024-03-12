import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { Connection } from 'mongoose';
import { DatabaseService } from './database.service';
import { SeasonService } from './season.service';

describe('season service', () => {
  let service: SeasonService;
  let dbService: DatabaseService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    dbService = new DatabaseService(uri);
    mongoConnection = dbService.connection;
    service = new SeasonService(dbService);
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  it('get season by time should return season', async () => {
    const time = new Date('2022-01-01');
    const seasonData = {
      startAt: new Date('2021-01-01'),
      endAt: new Date('2022-12-31'),
    };
    await dbService.seasonModel.create(seasonData);

    const result = await service.getSeasonByTime(time);

    expect(result).toBeDefined();
    expect(result?.startAt).toEqual(seasonData.startAt);
    expect(result?.endAt).toEqual(seasonData.endAt);
  });

  it('get first season should return first season', async () => {
    const seasonData = [
      { seasonNumber: 1, startAt: new Date('2021-01-01') },
      { seasonNumber: 2, startAt: new Date('2022-01-01') },
    ];
    await dbService.seasonModel.create(seasonData);

    const result = await service.getFirstSeason();

    expect(result).toBeDefined();
    expect(result?.seasonNumber).toEqual(1);
    expect(result?.startAt).toEqual(new Date('2021-01-01'));
  });

  it('get or create current season should return current season', async () => {
    const latestSeasonData = {
      seasonNumber: 2,
      startAt: new Date('2022-01-01'),
      endAt: new Date('2022-12-31'),
    };
    await dbService.seasonModel.create(latestSeasonData);

    const result = await service.getOrCreateCurrentSeason();

    expect(result).toBeDefined();
    expect(result?.seasonNumber).toEqual(3);
    expect(result?.startAt).toEqual(new Date('2022-12-31'));
    expect(result?.endAt).toBeUndefined();
  });
});
