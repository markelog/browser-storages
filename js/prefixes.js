window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem,
window.Blob = window.BlobBuilder || window.WebKitBlobBuilder || window.Blob,

// IndexDB prefixes
window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB,
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
