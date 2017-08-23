
# @tradle/validate-resource

validate your Tradle objects

## Usage

```js
const baseModels = require('@tradle/models')
const validateResource = require('@tradle/validate-resource')
const myModels = require('./my-models-array')
const models = baseModels.concat(myModels)
// assuming MyTopModel is in myModels
const resource = {
  _t: 'com.example.MyTopModel',
  waist: '32',
  bust: '36',
  height: '100px'
}

try {
  validateResource({ models, resource })
} catch (err) {
  console.log('uhh, i totally made this mistake on purpose:', err)
}
```

## Todo

differentiate between user errors (e.g. required property is missing) and developer errors (e.g. expected String, got Number)
