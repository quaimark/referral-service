### Referral service

This is a referral service that allows users to refer other users to a service.

### How to use?

Add repo to your nodejs package.json file

```sh
yarn add https://github.com/quaimark/referral-service.git#v0.2.0
```

```ts
import { createServices, Season } from '@quaimark/referral-service';

// default season
const defaultSeason: Season = {
  membershipPlusVolumeRatio: 0.1,
  membershipShareFeeRatio: 0.05,
  pointTradeVolumeRatio: 10,
  refTradePointRatio: 0.05,
  sponsorTradePointRatio: 0.1,
  seasonNumber: 1, // no effect
  startAt: new Date(0), // no effect
  endAt: null, // no effect
  name: 'default', // no effect
};
// initialize the referral module with the default season and mongodb uri
const referralModule = createServices(
  configuration().mongodb.uri,
  defaultSeason,
);
```
