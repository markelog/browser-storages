// Запись, записываем «много» данных за один тест
$(function() {
    var
        // Сюда будем класть тестовые данные
        fakeData,

        // Имя того места где будем хранить данные
        name = "test",

        // сколько данных будем прогружать за один тест
        dataCount = 100,

        tempArr = [],

        // Зарезолвим объект после того как тест для indexedDB будет готов к запуску
        indexedDBReady = jQuery.Deferred(),

        // Будет зарезолвен когда Web SQL Database будет готова для тестов
        webSQLReady = jQuery.Deferred(),

        // Зарезолвим объект после того как тест для Filesystem API будет готов к запуску
        fsapiReady = jQuery.Deferred(),

        // Создаем бенчмарк
        suite = new Benchmark.Suite();

        // Кладем сюда ноды для отображение результатов на странице
        nodes = {
            etalon: $( "#etalon td" ),
            idb: $( "#idb td" ),
            websql: $( "#websql td" ),
            fsapi: $( "#fsapi td" ),
            ls: $( "#ls td" )
        };

        // Нужна для отрисовки данных на странице
        function show( name, stats ) {
            nodes[ name ].each( function() {
                $( this ).text( stats[ this.className ] );
            });
        }

        // Покажи пустоту
        function none( name ) {
            show( name, {
                hz: "–",
                moe: "–"
            });
        }

        // Создаем тестовые данные
        for ( var ii = 0; ii < dataCount; ii++ ) {
            tempArr.push( Faker.Helpers.createCard() );
        }

        fakeData = {
            id: new Date().getTime(),

            // Сириализуем джейсон в текст,
            // что бы не включать в тесты сериализацию в какой либо другой формат данных
            data: JSON.stringify( tempArr )
        };

        // Контекст для эталоного теста
        !function() {
            var testArray = [];

            suite.add({
                name: "Etalon",

                teardown: function() {
                    testArray = [];
                },

                onComplete: function() {
                    show( "etalon", {
                        hz: this.hz,
                        moe: this.stats.moe
                    });
                    // console.log( "Etalon test completed" );
                },

                onStart: function() {
                    console.log( "Etalon test started" );
                },

                fn: function( deferred ) {
                    testArray[ 0 ] = fakeData.data;
                }
            });
        }();

        if ( indexedDB ) {

            // Контекст для теста indexedDB
            !function() {

                var
                    // здесь будет лежать наша база после ее инициализации

                    // Сколько раз мы выполнили тесты
                    index = 0,

                    // Версия базы
                    version = 1;

                function setup() {
                    db.createObjectStore( name, {
                        keyPath: "id"
                    }).createIndex( "id", "id", {
                        unique: true
                    });
                }

                // Уничтожаем базу, если она была
                indexedDB.deleteDatabase( name ).onsuccess = function () {

                    // Открываем соеденение с базой
                    var request = indexedDB.open( name, version );

                    // onupgradeneeded это новый эвент он есть только в Фаервоксе.
                    // Хром использует устаревший (через setVersion) способ инициализации базы
                    if ( request.onupgradeneeded === null ) {
                        request.onupgradeneeded = function () {
                            db = this.result;
                            setup();
                        }

                        request.onsuccess = function() {
                            db = this.result;

                            // indexedDB к тесту готов
                            indexedDBReady.resolve();
                        }

                    } else {
                        request.onsuccess = function() {
                            (db = this.result).setVersion( version ).onsuccess = setup;

                            // indexedDB к тесту готов
                            indexedDBReady.resolve();
                        }
                    }

                }

                // Создаем тест для indexedDB
                suite.add({
                    name: "indexedDB",

                    // Апи асинхронное, поэтому нам нужны ассинхронные тесты
                    defer: true,

                    setup: function() {
                        // console.log( index );
                    },

                    teardown: function() {
                        index++;
                    },

                    onStart: function() {
                        // console.log( "indexedDB API test start" );
                    },

                    onComplete: function() {
                        show( "idb", {
                            hz: this.hz,
                            moe: this.stats.moe
                        });
                        // console.log( "indexedDB API test completed" );
                    },

                    fn: function( deferred ) {
                        var store = db.transaction([ name ], IDBTransaction.READ_WRITE ).objectStore( name );

                        store.put( fakeData ).onsuccess = function() {

                            // Резолвим тест
                            deferred.resolve();
                        }
                    }
                });
            }();

        } else {
            indexedDBReady.resolve();
            none( "idb" );
        }

        if ( window.openDatabase ) {

            // Контекст для теста Web SQL Database
            !function () {
                var
                    index = 0,

                    // База для теста
                    db = openDatabase( name, "1", "Test database", 0 );

                // Уничтожаем таблицу, если она была создана до этого
                db.transaction(function( trans ) {
                    trans.executeSql( "DROP TABLE IF EXISTS test" , [] );
                });

                db.transaction(function( trans ) {
                    trans.executeSql( "CREATE TABLE test(id INTEGER PRIMARY KEY ASC, data TEXT)", [], function() {
                        webSQLReady.resolve();
                    });
                });

                suite.add({
                    name: "Web SQL Database",

                    defer: true,

                    setup: function() {
                        // console.log( index );
                    },

                    teardown: function() {
                        index++;
                    },

                    onComplete: function() {
                        show( "websql", {
                            hz: this.hz,
                            moe: this.stats.moe
                        });
                        // console.log( "Web SQL Database API test completed" );
                    },

                    onStart: function() {
                        // console.log( "Web SQL Database API test started" );
                    },

                    fn: function( deferred ) {
                        db.transaction(function( trans ) {
                            trans.executeSql( "INSERT INTO test(data) VALUES (?)", [ fakeData.data ], function() {
                                deferred.resolve();
                            });
                        });
                    }
                });
            }();

        } else {
            webSQLReady.resolve();
            none( "websql" );
        }

        if ( window.requestFileSystem ) {

            // Контекст для теста Filesystem API
            !function() {
                var
                    // Папка в которой будут лежать все директории и файлы для теста
                    dir,

                    // Сколько раз мы выполнили тесты
                    index = 0;

                requestFileSystem( 0, 0, function( fs ) {

                    // Очищаем директорию, если она до этого существовала
                    fs.root.getDirectory( name, {
                        create: true
                    }, function( prev ) {

                        // Сама операция удаления
                        prev.removeRecursively(function() {

                            // После удаления директории создаем ее заново и наполняем пустыми папками
                            fs.root.getDirectory( name, {
                                create: true
                            }, function() {
                                dir = arguments[ 0 ];

                                // Тест для Filesystem API готов
                                fsapiReady.resolve();
                            });
                        });
                    });
                });

                suite.add({
                    name: "Filesystem API",

                    defer: true,

                    setup: function() {
                        // console.log( index );
                    },

                    teardown: function() {
                        index++;
                    },

                    onComplete: function() {
                        show( "fsapi", {
                            hz: this.hz,
                            moe: this.stats.moe
                        });

                        // console.log( "Filesystem API test completed" );
                    },

                    onStart: function() {
                        // console.log( "Filesystem API test started" );
                    },

                    fn: function( deferred ) {
                        dir.getFile( name, {
                            create: true
                        }, function( entry ) {
                            entry.createWriter(function( writer ) {
                                var bb = new Blob();

                                writer.onwriteend = function() {

                                    // Резолвим тест
                                    deferred.resolve();
                                }

                                bb.append( fakeData.data );
                                writer.write( bb.getBlob( "text/plain" ) );
                            });
                        });
                    }
                });
            }();

        } else {
            fsapiReady.resolve();
            none( "fsapi" );
        }

        if ( window.localStorage ) {

            // Контекст для теста localStorage
            localStorage.clear();

            suite.add({
                name: "localStorage",

                onStart: function() {
                    // console.log( "localStorage API test started" );
                },

                onComplete: function() {
                    show( "ls", {
                        hz: this.hz,
                        moe: this.stats.moe
                    });

                    // console.log( "localStorage API test completed" );
                },

                fn: function() {
                    localStorage[ name ] = fakeData.data;
                }
            });
        } else {
            none( "lc" );
        }

        $.when( indexedDBReady, webSQLReady, fsapiReady ).done(function() {

            // Запускаем тесты
            suite.run({
                async: true
            });
        });

        suite.on( "start", function() {
            // console.log( "Tests started" );
        })

        .on( "complete", function() {
            // console.log( "Tests ended" );
        });
});