const { models } = require('@tradle/models')
const Profile = models['tradle.Profile']
const ModelsPack = models['tradle.ModelsPack']
const Possessions = require('@tradle/custom-models')['tradle.Posessions']

module.exports = [
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _author: 'someauthor',
      _time: 123,
      firstName: 'ted'
    }
  },
  {
    model: Profile,
    resource: {
      _t: Profile.id,
      _s: 'somesig',
      _author: 'someauthor',
      _time: 123,
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
      _author: 'someauthor',
      _time: 123,
      firstName: 'ted',
      lastMessageTime: Date.now(),
      myDocuments: [{
        _t: 'tradle.PhotoID',
        _link: '0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        _permalink: '0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        _displayName: 'my passport'
      }],
      isEmployee: true,
      myProducts: [{
        _t: 'tradle.MyLifeInsurance',
        _permalink: '0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        _link: '0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        _displayName: 'my current account'
      }],
      myForms: [{
        _t: 'tradle.AboutYou',
        _permalink: '0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        _link: '0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        _displayName: 'about me'
      }, {
        _t: 'tradle.PersonalInfo',
        _permalink: '0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        _link: '0162834c8d8005614cd494ddbd1a635942ed50005dda54de50d036045b1c7ae5',
        _displayName: 'more about me'
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
      _time: 123,
      _s: 'somesig',
      _author: 'someauthor',
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
  },
  {
    model: Possessions,
    resource: {
      _t: Possessions.id,
      downPayment: {
        currency: '$',
        value: 100
      }
    }
  },
  {
    model: Possessions,
    resource: {
      _t: Possessions.id
    },
    partial: true
  },
  {
    model: models['tradle.APIBasedVerificationMethod'],
    resource: {
      "_t": "tradle.APIBasedVerificationMethod",
      "api": {
        "_t": "tradle.API",
        "name": "onfido"
      },
      "reference": [
        {
          "queryId": "report:954f62ef-3180-4711-929b-e74fa2397d5b"
        }
      ],
      "aspect": "authenticity",
      "rawData": {
        "created_at": "2018-01-12T03:17:45Z",
        "href": "/v2/checks/af009895-106b-4e47-a3d1-036156090dba/reports/954f62ef-3180-4711-929b-e74fa2397d5b",
        "id": "954f62ef-3180-4711-929b-e74fa2397d5b",
        "name": "document",
        "properties": {
          "last_name": "Soni145b",
          "issuing_country": "GBR",
          "first_name": "Moog",
          "document_type": "passport",
          "document_numbers": [
            {
              "value": "9999999999",
              "type": "passport"
            }
          ],
          "date_of_expiry": "1900-01-01",
          "date_of_birth": "1900-01-01"
        },
        "result": "clear",
        "status": "complete",
        "sub_result": "clear",
        "variant": "standard",
        "breakdown": {
          "data_comparison": {
            "result": "clear",
            "breakdown": {
              "date_of_birth": {
                "result": "clear",
                "properties": {}
              },
              "date_of_expiry": {
                "result": "clear",
                "properties": {}
              },
              "document_numbers": {
                "result": "clear",
                "properties": {}
              },
              "document_type": {
                "result": "clear",
                "properties": {}
              },
              "first_name": {
                "result": "clear",
                "properties": {}
              },
              "gender": {
                "result": "clear",
                "properties": {}
              },
              "issuing_country": {
                "result": "clear",
                "properties": {}
              },
              "last_name": {
                "result": "clear",
                "properties": {}
              }
            }
          },
          "data_consistency": {
            "result": "clear",
            "breakdown": {
              "date_of_birth": {
                "result": "clear",
                "properties": {}
              },
              "date_of_expiry": {
                "result": "clear",
                "properties": {}
              },
              "document_numbers": {
                "result": "clear",
                "properties": {}
              },
              "document_type": {
                "result": "clear",
                "properties": {}
              },
              "first_name": {
                "result": "clear",
                "properties": {}
              },
              "gender": {
                "result": "clear",
                "properties": {}
              },
              "issuing_country": {
                "result": "clear",
                "properties": {}
              },
              "last_name": {
                "result": "clear",
                "properties": {}
              },
              "nationality": {
                "result": "clear",
                "properties": {}
              }
            }
          },
          "data_validation": {
            "result": "clear",
            "breakdown": {
              "date_of_birth": {
                "result": "clear",
                "properties": {}
              },
              "document_expiration": {
                "result": "clear",
                "properties": {}
              },
              "document_numbers": {
                "result": "clear",
                "properties": {}
              },
              "expiry_date": {
                "result": "clear",
                "properties": {}
              },
              "gender": {
                "result": "clear",
                "properties": {}
              },
              "mrz": {
                "result": "clear",
                "properties": {}
              }
            }
          },
          "visual_authenticity": {
            "result": "clear",
            "breakdown": {
              "face_detection": {
                "result": "clear",
                "properties": {}
              },
              "other": {
                "result": "clear",
                "properties": {}
              }
            }
          },
          "image_integrity": {
            "result": "clear",
            "breakdown": {
              "image_quality": {
                "result": "clear",
                "properties": {}
              },
              "supported_document": {
                "result": "clear",
                "properties": {}
              }
            }
          },
          "police_record": {
            "result": "clear"
          }
        }
      }
    }
  }
]
