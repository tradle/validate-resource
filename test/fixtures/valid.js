const { models } = require('@tradle/models')
const Profile = models['tradle.Profile']
const ModelsPack = models['tradle.ModelsPack']

module.exports = [
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      firstName: 'ted'
    }
  },
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      firstName: 'ted',
      photos: [{
        _t: 'tradle.Photo',
        url: 'data:image...'
      }]
    }
  },
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      firstName: 'ted',
      lastMessageTime: Date.now(),
      myDocuments: [{
        id: 'tradle.PhotoID_0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5_0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        title: 'my passport'
      }],
      isEmployee: true,
      myProducts: [{
        id: 'tradle.MyLifeInsurance_0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5_0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        title: 'my current account'
      }],
      myForms: [{
        id: 'tradle.AboutYou_0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5_0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        title: 'about me'
      }, {
        id: 'tradle.PersonalInfo_0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5_0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        title: 'more about me'
      }],
      country: {
        id: 'tradle.Country_0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        title: 'Slovooglie'
      }
    }
  },
  {
    model: ModelsPack,
    resource: {
      _t: ModelsPack.id,
      _s: 'somesig',
      namespace: 'somenamespace',
      versionId: 'someversionid',
      models: [
        Profile
      ]
    }
  },
  {
    model: {
      id: 'Colors',
      properties: {
        colors: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    },
    resource: {
      _t: 'Colors',
      colors: [
        'blue',
        'green'
      ]
    }
  }
]
