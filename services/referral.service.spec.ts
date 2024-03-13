import { MongoMemoryServer } from 'mongodb-memory-server-core';
import mongoose, { Connection } from 'mongoose';
import { DatabaseService } from './database.service';
import { ReferralService } from './referral.service';

describe('referral service', () => {
  let service: ReferralService;
  let dbService: DatabaseService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    dbService = new DatabaseService(uri);
    mongoConnection = dbService.connection;
    service = new ReferralService(dbService);
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection?.deleteMany({});
    }
  });

  it('get ref code should return ref code', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const result = await service.getReferralInfoByUserId(userId);
    const newUser = await service.getReferralInfoByUserId(userId);

    expect(result?.referralCode).toBeDefined();
    expect(newUser?.referralCode).toBeDefined();
    expect(result?.referralCode).toEqual(newUser?.referralCode);

    return;
  });

  it('add ref by should return user with ref by', async () => {
    const user1 = new mongoose.Types.ObjectId().toHexString();
    const user2 = new mongoose.Types.ObjectId().toHexString();
    const refCode = await service.getReferralInfoByUserId(user2);
    const result = await service.addRefBy(user1, refCode.referralCode);
    expect(result.referredBy?.toString()).toEqual(refCode.referralCode);

    await expect(service.addRefBy(user1, 'x')).rejects.toThrow(
      'user has refBy',
    );
  });

  it('add ref by leaf user should throw exception', async () => {
    const users: string[] = [
      new mongoose.Types.ObjectId().toHexString(),
      new mongoose.Types.ObjectId().toHexString(),
      new mongoose.Types.ObjectId().toHexString(),
    ];
    const ref1 = await service.getReferralInfoByUserId(users[0]);
    const ref2 = await service.getReferralInfoByUserId(users[1]);
    const ref3 = await service.getReferralInfoByUserId(users[2]);

    await expect(
      service.addRefBy(ref1.userId, ref1.referralCode),
    ).rejects.toThrow('user cannot ref by himself');

    await service.addRefBy(ref2.userId, ref1.referralCode);
    await expect(
      service.addRefBy(ref1.userId, ref2.referralCode),
    ).rejects.toThrow('user cannot ref by himself');
    await service.addRefBy(ref3.userId, ref2.referralCode);
    await expect(
      service.addRefBy(ref1.userId, ref3.referralCode),
    ).rejects.toThrow('user cannot ref by himself');
  });
});
