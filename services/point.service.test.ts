import { MongoMemoryServer } from 'mongodb-memory-server-core';
import mongoose, { Connection } from 'mongoose';
import { globalState } from '../globalState';
import { PointHistoryDocument, Season } from '../models';
import { GetTopPointParams } from '../types';
import { DatabaseService } from './database.service';
import { PointService } from './point.service';
import { SeasonService } from './season.service';

describe('PointService', () => {
  let service: PointService;
  let dbService: DatabaseService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  const user1 = new mongoose.Types.ObjectId().toHexString();
  const user2 = new mongoose.Types.ObjectId().toHexString();
  const user3 = new mongoose.Types.ObjectId().toHexString();

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    dbService = new DatabaseService(uri);
    mongoConnection = dbService.connection;
    const seasonService = new SeasonService(dbService);
    service = new PointService(dbService, seasonService);
    const defaultSeason: Season = {
      seasonNumber: 1,
      pointTradeVolumeRatio: 10,
      membershipPlusVolumeRatio: 0.1,
      refTradePointRatio: 0.05,
      membershipShareFeeRatio: 0.05,
      sponsorTradePointRatio: 0.1,
    };
    globalState.defaultSeason = defaultSeason;
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

  describe('getUserPoint', () => {
    it('should return user point for a specific season', async () => {
      // Create a season
      const seasonData = {
        seasonNumber: 1,
        startAt: new Date('2021-01-01'),
        endAt: new Date('2021-12-31'),
      };
      await dbService.seasonModel.create(seasonData);

      // Create point history for the user
      const pointHistoryData = {
        user: user1,
        blockTime: new Date('2021-06-01').getTime(),
        point: 100,
      };
      await dbService.pointHistoryModel.create(pointHistoryData);

      const result = await service.getUserPoint(user1, 1);

      expect(result).toBe(100);
    });

    it('should return user point for the current season if seasonNumber is not provided', async () => {
      // Create the current season
      const currentSeasonData = {
        seasonNumber: 2,
        startAt: new Date('2022-01-01'),
        endAt: undefined,
      };
      await dbService.seasonModel.create(currentSeasonData);

      // Create point history for the user
      const pointHistoryData = {
        user: user1,
        blockTime: new Date('2022-06-01').getTime(),
        point: 200,
      };
      await dbService.pointHistoryModel.create(pointHistoryData);

      const result = await service.getUserPoint(user1);

      expect(result).toBe(200);
    });
  });

  describe('getUserRanking', () => {
    it('should return user ranking for a specific season', async () => {
      // Create a season
      const seasonData = {
        seasonNumber: 1,
        startAt: new Date('2021-01-01'),
      };
      await dbService.seasonModel.create(seasonData);

      const blockTime = parseInt(
        String(new Date('2021-06-01').getTime() / 1000),
      );

      // Create point history for multiple users
      const pointHistoryData = [
        {
          user: user1,
          blockTime,
          point: 100,
          source: [{ type: 'buy_volume', point: 100 }],
        },
        {
          user: user2,
          blockTime,
          point: 200,
          source: [{ type: 'buy_volume', point: 200 }],
        },
        {
          user: user3,
          blockTime,
          point: 150,
          source: [{ type: 'buy_volume', point: 150 }],
        },
      ];
      await dbService.pointHistoryModel.create(pointHistoryData);

      const result = await service.getUserRanking(user2, 1);

      expect(result).toEqual({
        ranking: 1,
        seasonPoint: 200,
        tradePoint: 200,
        refPoint: 0,
      });
    });

    it('should return user ranking for the current season if seasonNumber is not provided', async () => {
      // Create the current season
      const currentSeasonData = {
        seasonNumber: 2,
        startAt: new Date('2022-01-01'),
      };
      await dbService.seasonModel.create(currentSeasonData);

      const blockTime = new Date('2022-06-01').getTime();
      // Create point history for multiple users
      const pointHistoryData = [
        {
          user: user1,
          blockTime,
          point: 300,
          source: [{ type: 'buy_volume', point: 300 }],
        },
        {
          user: user2,
          blockTime,
          point: 400,
          source: [{ type: 'buy_volume', point: 400 }],
        },
        {
          user: user3,
          blockTime,
          point: 350,
          source: [{ type: 'buy_volume', point: 350 }],
        },
      ];
      await dbService.pointHistoryModel.create(pointHistoryData);

      const result = await service.getUserRanking(user2);

      expect(result).toEqual({
        ranking: 1,
        seasonPoint: 400,
        tradePoint: 400,
        refPoint: 0,
      });
    });
  });

  describe('getTopPoints', () => {
    it('should return top points for a specific season', async () => {
      // Create a season
      const seasonData = {
        seasonNumber: 1,
        startAt: new Date('2021-01-01'),
        endAt: new Date('2021-12-31'),
      };
      await dbService.seasonModel.create(seasonData);

      // Create point history for multiple users
      const pointHistoryData = [
        {
          user: user1,
          blockTime: new Date('2021-06-01').getTime(),
          point: 100,
          source: [{ type: 'buy_volume', point: 100 }],
        },
        {
          user: user2,
          blockTime: new Date('2021-06-01').getTime(),
          point: 200,
          source: [{ type: 'buy_volume', point: 200 }],
        },
        {
          user: user3,
          blockTime: new Date('2021-06-01').getTime(),
          point: 150,
          source: [{ type: 'buy_volume', point: 150 }],
        },
      ];
      await dbService.pointHistoryModel.create(pointHistoryData);

      const queryParam = new GetTopPointParams();
      queryParam.size = 10;
      queryParam.page = 1;
      queryParam.seasonNumber = 1;

      const result = await service.getTopPoints(queryParam);

      expect(result.data.items.length).toBe(3);
      expect(result.data.items[0].user).toBe(user2);
      expect(result.data.items[0].seasonPoint).toBe(200);
      expect(result.data.items[0].referralPoint).toBe(0);
      expect(result.data.items[0].tradingPoint).toBe(200);
    });

    it('should return top points for the current season if seasonNumber is not provided', async () => {
      // Create the current season
      const currentSeasonData = {
        seasonNumber: 2,
        startAt: new Date('2022-01-01'),
        endAt: undefined,
      };
      await dbService.seasonModel.create(currentSeasonData);

      // Create point history for multiple users
      const pointHistoryData = [
        {
          user: user1,
          blockTime: new Date('2022-06-01').getTime(),
          point: 300,
          source: [{ type: 'buy_volume', point: 300 }],
        },
        {
          user: user2,
          blockTime: new Date('2022-06-01').getTime(),
          point: 400,
          source: [{ type: 'buy_volume', point: 400 }],
        },
        {
          user: user3,
          blockTime: new Date('2022-06-01').getTime(),
          point: 350,
          source: [{ type: 'buy_volume', point: 350 }],
        },
      ];
      await dbService.pointHistoryModel.create(pointHistoryData);

      const queryParam = new GetTopPointParams();
      queryParam.size = 10;
      queryParam.page = 1;

      const result = await service.getTopPoints(queryParam);

      expect(result.data.items.length).toBe(3);
      expect(result.data.items[0].user).toBe(user2);
      expect(result.data.items[0].seasonPoint).toBe(400);
      expect(result.data.items[0].referralPoint).toBe(0);
      expect(result.data.items[0].tradingPoint).toBe(400);
    });
  });

  describe('pointCalculate', () => {
    it('should calculate points for a buy user', async () => {
      // Create a season
      const seasonData = {
        seasonNumber: 1,
        startAt: new Date('2021-01-01'),
        endAt: new Date('2021-12-31'),
        pointTradeVolumeRatio: 10,
        membershipPlusVolumeRatio: 0.1,
        refTradePointRatio: 0.05,
        membershipShareFeeRatio: 0.05,
        sponsorTradePointRatio: 0.1,
      };
      const seasonEntity = await dbService.seasonModel.create(seasonData);

      const h = {
        to: user1,
        from: user2,
        price: 100,
        txHash: 'hash123',
        block: 123,
        blockTime: new Date('2021-12-30'),
        chain: 'chain123',
        fee: 10,
        isMembership: true,
      };

      await service.pointCalculate(h);

      // Verify the point history for the buy user
      const pointHistory = await dbService.pointHistoryModel.findOne({
        user: user1,
      });
      if (!pointHistory) throw new Error('Point history not found');

      expect(pointHistory).toBeDefined();
      expect(pointHistory.user).toBe(user1);
      expect(pointHistory.volume).toBe(h.price);
      expect(pointHistory.txHash).toBe(h.txHash);
      expect(pointHistory.block).toBe(h.block);
      expect(pointHistory.chain).toBe(h.chain);
      expect(pointHistory.fee).toBe(h.fee);
      expect(pointHistory.point).toBe(1100); // calculated point value
      expect(pointHistory.blockTime).toBe(h.blockTime.getTime());
      expect(pointHistory.season?._id.toString()).toBe(
        seasonEntity._id.toString(),
      );
      expect(pointHistory.source).toEqual([
        { type: 'buy_volume', point: 1000 },
        { type: 'membership', point: 100 },
        // { type: 'apply_referral', point: 5 },
      ]);
    });

    it('should calculate points for a sell user', async () => {
      // Create a season
      const seasonData = {
        seasonNumber: 1,
        startAt: new Date('2021-01-01'),
        endAt: new Date('2021-12-31'),
        pointTradeVolumeRatio: 10,
        membershipPlusVolumeRatio: 0.1,
        refTradePointRatio: 0.05,
        membershipShareFeeRatio: 0.05,
        sponsorTradePointRatio: 0.1,
      };
      const seasonEntity = await dbService.seasonModel.create(seasonData);

      const h = {
        to: user1,
        from: user2,
        price: 100,
        txHash: 'hash123',
        block: 123,
        blockTime: new Date('2021-12-30'),
        chain: 'chain123',
        fee: 10,
        isMembership: false,
      };

      await service.pointCalculate(h, true);

      // Verify the point history for the sell user
      const pointHistory = await dbService.pointHistoryModel.findOne({
        user: user2,
      });
      if (!pointHistory) throw new Error('Point history not found');

      expect(pointHistory).toBeDefined();
      expect(pointHistory.user).toBe(user2);
      expect(pointHistory.volume).toBe(h.price);
      expect(pointHistory.txHash).toBe(h.txHash);
      expect(pointHistory.block).toBe(h.block);
      expect(pointHistory.chain).toBe(h.chain);
      expect(pointHistory.fee).toBe(h.fee);
      expect(pointHistory.point).toBe(1000); // calculated point value
      expect(pointHistory.blockTime).toBe(h.blockTime.getTime());
      expect(pointHistory.season?._id.toString()).toBe(
        seasonEntity._id.toString(),
      );
      expect(pointHistory.source).toEqual([
        { type: 'sell_volume', point: 1000 },
      ]);
    });

    it('should calculate points for a sponsor', async () => {
      // Create a season
      const seasonData = {
        seasonNumber: 1,
        startAt: new Date('2021-01-01'),
        endAt: new Date('2021-12-31'),
        pointTradeVolumeRatio: 10,
        membershipPlusVolumeRatio: 0.1,
        refTradePointRatio: 0.05,
        membershipShareFeeRatio: 0.05,
        sponsorTradePointRatio: 0.1,
      };
      const seasonEntity = await dbService.seasonModel.create(seasonData);

      // Create referral info for the buy user
      await dbService.referralInfoModel.create({
        userId: user1,
        referredBy: 'refCode123',
      });

      // Create referral info for the sponsor
      await dbService.referralInfoModel.create({
        userId: user2,
        referralCode: 'refCode123',
      });

      const h = {
        to: user1,
        from: user2,
        price: 100,
        txHash: 'hash123',
        block: 123,
        blockTime: new Date('2021-12-30'),
        chain: 'chain123',
        fee: 10,
        isMembership: false,
      };

      await service.pointCalculate(h);

      // Verify the point history for the sponsor
      const pointHistory = await dbService.pointHistoryModel.findOne({
        user: user2,
      });
      if (!pointHistory) throw new Error('Point history not found');

      expect(pointHistory).toBeDefined();
      expect(pointHistory.user).toBe(user2);
      expect(pointHistory.volume).toBe(h.price);
      expect(pointHistory.txHash).toBe(h.txHash);
      expect(pointHistory.block).toBe(h.block);
      expect(pointHistory.chain).toBe(h.chain);
      expect(pointHistory.fee).toBe(h.fee);
      expect(pointHistory.point).toBe(100); // calculated point value
      expect(pointHistory.blockTime).toBe(h.blockTime.getTime());
      expect(pointHistory.season?._id.toString()).toBe(
        seasonEntity._id.toString(),
      );
      expect(pointHistory.source).toEqual([{ type: 'referral', point: 100 }]);
    });
  });
});
