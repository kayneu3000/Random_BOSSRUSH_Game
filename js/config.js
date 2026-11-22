export const MAP = { w: 2300, h: 1650 };

export const ADMIN_UNLOCK_CODE = 'GH0163XYZ';

export const classes = {
 archer:{name:'BOGENSCHÜTZE',hp:100,damage:25,cool:2,range:510,speed:245,icon:'🏹'},
 tank:{name:'TANK',hp:350,damage:65,cool:2.5,range:105,speed:145,icon:'🔨'},
 sword:{name:'SCHWERTKÄMPFER',hp:200,damage:30,cool:1,range:100,speed:235,icon:'⚔'},
 assassin:{name:'ASSASSIN',hp:200,damage:10,cool:.2,range:47,speed:345,icon:'🗡'},
 healer:{name:'HEALER',hp:100,damage:0,cool:0,range:0,speed:235,icon:'💚'},
 ember:{name:'EMBER',hp:200,damage:5,cool:0,range:800,speed:235,icon:'🐲🔥'},
 gunner:{name:'GUNNER',hp:200,damage:40,cool:0,range:900,speed:235,icon:'🔫'}
};

export const SLIME_HP=[1600,680,330,150,65];
export const SLIME_R=[76,53,39,27,17];
export const SLIME_SPEED=[1050,900,760,650,560];
export const SLIME_DASH=[1.25,1.15,1.05,.95,.85];
export const SLIME_DMG=[32,26,21,17,13];

export const DRAGON_HP=750;
export const GUNBALL_HP=1000;
export const TOWER_HP=75;

export const gunballWeak=['snake','boomerang','growth','mirror','teleport'];
export const gunballMedium=['giant','splitter','planet','chain','time','rain'];
export const gunballStrong=['fusion','magnet','blackhole','core'];

export const BULLET_STATS={
 snake:{speed:250,r:11,damage:10,life:7},
 boomerang:{speed:310,r:13,damage:13,life:6},
 growth:{speed:280,r:8,damage:15,life:7},
 mirror:{speed:330,r:10,damage:12,life:6},
 teleport:{speed:300,r:13,damage:16,life:6},
 giant:{speed:170,r:30,damage:28,life:8},
 splitter:{speed:240,r:18,damage:20,life:4.2},
 planet:{speed:230,r:20,damage:22,life:7},
 chain:{speed:260,r:13,damage:18,life:7},
 time:{speed:300,r:15,damage:22,life:7},
 rain:{speed:0,r:27,damage:25,life:3},
 fusion:{speed:210,r:21,damage:32,life:8},
 magnet:{speed:180,r:24,damage:30,life:8},
 blackhole:{speed:100,r:32,damage:35,life:6},
 core:{speed:90,r:13,damage:40,life:7}
};
