const _ = require('lodash')
const models = _.extend(
  {},
  require('@tradle/models').models,
  require('@tradle/custom-models')
)

const Profile = models['tradle.Profile']
const Possessions = require('@tradle/custom-models')['tradle.Posessions']

module.exports = [
  {
    models,
    resource: {},
    error: /"_t"/
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig'
    },
    error: /required/
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      firstName: 7
    },
    error: /required/
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _time: 123,
      _time: 123,
      firstName: 7
    },
    error: /firstName/
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _time: 123,
      _time: 123,
      firstName: 'ted',
      photos: 'notaphoto'
    },
    error: /photos/
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _time: 123,
      _time: 123,
      firstName: 'ted',
      photos: [{
        _t: 'tradle.Beef'
      }]
    },
    error: /tradle\.Beef/
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _time: 123,
      _time: 123,
      firstName: 'ted',
      photos: [{
        _t: 'tradle.PersonalInfo'
      }]
    },
    error: /tradle\.Photo/
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _time: 123,
      _time: 123,
      firstName: 'ted',
      lastMessageTime: false
    },
    error: /lastMessageTime/
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _time: 123,
      _time: 123,
      firstName: 'ted',
      myDocuments: [{
        id: 'boo'
      }]
    },
    error: /myDocuments/
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _time: 123,
      firstName: 'ted',
      myForms: [{
        id: 'tradle.Major_boo_hoo'
      }]
    },
    error: /myForms/
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _time: 123,
      firstName: 'ted',
      country: 'USA'
    },
    error: /country/
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _time: 123,
      firstName: 'ted',
      useTouchId: 'three'
    },
    error: /useTouchId/
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _time: 123,
      firstName: 'ted',
      photos: [{
        _t: 'tradle.Photo',
        width: undefined
      }]
    },
    error: {
      property: 'photos.0.width'
    }
  },
  {
    models,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _time: 123,
      firstName: ''
    },
    error: /empty.*firstName/i
  },
  {
    models,
    resource: {
      _t: Possessions.id,
      downPayment: {
        value: 100
      }
    },
    error: /required/
  }
]
