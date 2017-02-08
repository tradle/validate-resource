const models = require('@tradle/models')
const Profile = models['tradle.Profile']

module.exports = [
  {
    model: Profile,
    resource: {},
    error: /\._t/
  },
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig'
    },
    error: /required/
  },
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      firstName: 7
    },
    error: /firstName/
  },
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      firstName: 'ted',
      photos: 'notaphoto'
    },
    error: /photos/
  },
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      firstName: 'ted',
      photos: [{
        _t: 'tradle.Beef'
      }]
    },
    error: /tradle\.Photo/
  },
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      firstName: 'ted',
      lastMessageTime: false
    },
    error: /lastMessageTime/
  },
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      firstName: 'ted',
      myDocuments: [{
        id: 'boo'
      }]
    },
    error: /myDocuments/
  },
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      firstName: 'ted',
      country: 'USA'
    },
    error: /country/
  },
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      firstName: 'ted',
      useTouchId: 'three'
    },
    error: /useTouchId/
  }
]
