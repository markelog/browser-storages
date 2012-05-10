~function() {
    var request, db,
        tempArr = [],
        fakeData = [];

    function error( e ) {
        console.log( "Error", e );
    }

    request = indexedDB.open( "test", 15 );

    // populate lots of fake data before we start work with storage

    for ( var i = 0; i < 100; i++ ) {
        for ( var ii = 0; ii < 10; ii++ ) {
            tempArr.push( Faker.Helpers.createCard() );
        }

        fakeData.push({
            id: new Date().getTime(),
            data: tempArr
        });
        tempArr = [];
    }

    request.onerror = error;

    request.onupgradeneeded = function() {
        console.log(1)
    }

    request.onsuccess = function() {
        db = this.result;

        var cursor;

        // Previous deprecated interface
        if ( !this.result.version ) {
            console.log("version")
            this.result.setVersion( 15 ).onsuccess = function() {
                db.createObjectStore( "test", {
                    keyPath: "id"
                });

                clear(  );
            }
        } else {
            clear(  );
        }
    }

    function destroy() {
        indexedDB.deleteDatabase( "test" ).onsuccess = function() {
            console.log(1)
        }
    }

    function clear( fn ) {
        var store = db.transaction([ "test" ], IDBTransactionSync.READ_WRITE ).objectStore( "test" );

        console.log()
    }

    function populate() {
        var store = db.transaction([ "test" ], IDBTransaction.READ_WRITE ).objectStore( "test" );

        for ( var i = 0; i < 100; i++ ) {
            store.put( fakeData[ i ] ).onsuccess = function() {
                get();
            }
        }
    }

    function get() {
        var store = db.transaction([ "test" ], IDBTransaction.READ_WRITE ).objectStore( "test" ),
            cursor = store.openCursor( IDBKeyRange.lowerBound( 0 ) ),
            i = 0;

        store.count().onsuccess = function() {
            //console.log(this, arguments)
        }

        cursor.onsuccess = function() {
            if ( ++i < 2 ) {
                console.log(this.result.value)
            }

            if ( this.result ) {
                this.result.continue();
            }
        }
    }
}();