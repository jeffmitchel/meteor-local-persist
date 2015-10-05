# Meteor Local Persist Package

Persistent client (browser) collections for Meteor, using localStorage.
Collections are reactive across browser tabs.

## Installation:
`meteor add jeffm:local-persist`

## Documentation:

### Constructor:

```
LocalPersist(collection, key, options);
```

- Collection: Meteor Collection to be persisted.
- Key: String value used as the access key for browser storage.
- Options: Object, optional.

**Options:**

- compress: Compress data? Boolean, defaults to false.
- migrate: Migrate data previously stored with pre-1.0, Amplify based, versions of this package? Boolean, defaults to false.
- maxDocuments: Maximum number of documents to track. Number, defaults to 0 (no limit).
- storageFull: Function called when maxDocuments is exceeded or browser local storage is full. Function is passed the collection being observed and the document that cause the execption. Default function does nothing. See example below.

### Methods:

```
  None.
```

### Dependancies:

- underscore
- ejson
- nunohvidal:lz-string

## Notes:

- A separate copy of the collection's data is kept in the browser's local storage. This is used to restore the Meteor collection when the page is reloaded or the vistor returns.

- The cross-tab reactvity implementation is naive and will resync all LocalPersist instances when a browser storage event is fired.

- It is safe to switch between compressed and uncompressed data. The compression status of each document is tracked and will be transitioned when the document is next saved to local storage.

- If local storage is not supported by the browser, no persistance will be provided. This should not be an issue, as all browsers currently supported by Meteor support local storage.


## Example:

Implement a simple shopping cart as a local collection.

```javascript
if (Meteor.isClient) {
    // create a local collection
    var shoppingCart = new Meteor.Collection(null);

    // create a local persistence observer
    var shoppingCartObserver = new LocalPersist(shoppingCart, 'Shopping-Cart',
      {                                     // options are optional!
        maxDocuments: 99,                   // maximum number of line items in cart
        storageFull: function (col, doc) {  // function to handle maximum being exceeded
          col.remove({ _id: doc._id });
          alert('Shopping cart is full.');
        }
      });

    // create a helper to fetch the data
    UI.registerHelper("shoppingCartItems", function () {
      return shoppingCart.find();
    });

    // that's it. just use the collection normally and the observer
    // will keep it sync'd to browser storage. the data will be stored
    // back into the collection when returning to the app (depending,
    // of course, on availability of localStorage in the browser).

    shoppingCart.insert({ item: 'DMB-01', desc: 'Discover Meteor Book', quantity: 1 });
  });
}
```

```html
<head>
  <title>Shopping Cart</title>
</head>

<body>
  {{> shoppingCart}}
</body>

<template name="shoppingCart">
  <table>
    <tr>
      <th>Item</th>
      <th>Description</th>
      <th>Quantity</th>
    </tr>
    {{#each shoppingCartItems}}
      <tr>
        <td>{{item}}</td>
        <td>{{desc}}</td>
        <td>{{quantity}}</td>
      </tr>
    {{/each}}
  </table>
</template>
```
