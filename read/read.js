
// Чтение
$(function() {
    var
        // Имя того места где будем хранить данные
        name = "test",

        // сколько данных будем прогружать за один тест
        dataCount = 100, // – это чуть меньши пяти мегабайт

        // Сюда будем класть тестовые данные
        tempArr = [],
        fakeData = {},

        // Зарезолвим объект после того как тест для indexedDB будет готов к запуску
        indexedDBReady = jQuery.Deferred(),

        // Будет зарезолвен когда Web SQL Database будет готова для тестов
        webSQLReady = jQuery.Deferred(),

        // Зарезолвим объект после того как тест для Filesystem API будет готов к запуску
        fsapiReady = jQuery.Deferred(),

        // Зарезолвим объект после того как получим данные в кэше
        cacheReady = jQuery.Deferred(),

        // Создаем бенчмарк
        suite = new Benchmark.Suite(),

        // Кладем сюда ноды для отображение результатов на странице
        nodes = {
            etalon: $( "#etalon td" ),
            idb: $( "#idb td" ),
            websql: $( "#websql td" ),
            fsapi: $( "#fsapi td" ),
            ls: $( "#ls td" ),
            cache: $( "#cache td" ),
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
        for ( var i = 0; i < dataCount; i++ ) {
            tempArr.push( Faker.Helpers.createCard() );
        }

        fakeData = {
            id: new Date().getTime(),

            // Сириализуем джейсон в текст,
            // что бы не включать в тесты сериализацию в какой либо другой формат данных
            data: JSON.stringify( tempArr )
        };

        // Контекст для эталонного теста
        !function() {
            var testArray = [ fakeData.data ];

            suite.add({
                name: "Etalon",

                onComplete: function() {
                    show( "etalon", {
                        hz: this.hz,
                        moe: this.stats.moe
                    });
                    // console.log( "Etalon test completed" );
                },

                onStart: function() {
                    // console.log( "Etalon test started" );
                },

                fn: function() {
                    var test = testArray[ 0 ];
                }
            });
        }();



        if ( window.indexedDB ) {

            // Контекст для теста indexedDB
            !function() {
                var
                    // Здесь будет лежать наша база после ее инициализации
                    db,

                    // Здесь функция которая будет использоваться для получения всех данных
                    get,

                    // Сколько раз мы выполнили тесты
                    index = 0,

                    // Версия базы
                    version = 100500;

                function setup() {
                    var last, store;

                    // Создание объекта в котором будет много данных
                    db.createObjectStore( "fakeData", {
                        keyPath: "id"
                    }).createIndex( "id", "id", {
                        unique: true
                    });
                }

                function write() {
                    store = db.transaction([ "fakeData" ], IDBTransaction.READ_WRITE ).objectStore( "fakeData" );

                    // Заполняем объект данными
                    store.put( fakeData ).onsuccess = function() {
                        get = store.getAll ? mozGet : webkitGet;

                        // Тест для indexedDB готов
                        indexedDBReady.resolve();
                    }

                }

                function mozGet( deferred ) {
                    var store = db.transaction([ "fakeData" ], IDBTransaction.READ_WRITE ).objectStore( "fakeData" );

                    store.getAll().onsuccess = function() {
                        var test = this.result.value;

                        // Пробег выполнен
                        deferred.resolve()
                    };
                }

                function webkitGet( deferred ) {
                    var store = db.transaction([ "fakeData" ], IDBTransaction.READ_WRITE ).objectStore( "fakeData" );

                    // Получаем все что есть в базе
                    store.openCursor( IDBKeyRange.lowerBound( 0 ) ).onsuccess = function() {
                        var test = this.result.value;

                        // Пробег выполнен
                        deferred.resolve();
                    };
                }


                // Уничтожаем базу, если она была
                indexedDB.deleteDatabase( name ).onsuccess = function () {

                    // Открываем соеденение с базой
                    var request = indexedDB.open( name, version );

                    // onupgradeneeded это новый эвент, он есть только в Фаервоксе.
                    // Хром использует устаревший (через setVersion) способ инициализации базы
                    if ( request.onupgradeneeded === null ) {
                        request.onupgradeneeded = function () {
                            db = this.result;
                            setup();
                        }

                        request.onsuccess = write;

                    } else {
                        request.onsuccess = function() {
                            (db = this.result).setVersion( version ).onsuccess = function() {
                                setup();
                                write();
                            };
                        }
                    }
                }

                // Создаем тест для indexedDB
                indexedDBReady.done(function() {
                    suite.add({
                        name: "indexedDB",

                        // Апи асинхронное, поэтому нам нужны ассинхронные тесты
                        defer: true,

                        setup: function() {
                            // console.log( ++index );
                        },

                        onStart: function() {
                            // console.log( "indexedDB API test start" );
                        },

                        onComplete: function() {
                            show( "idb", {
                                hz: this.hz,
                                moe: this.stats.moe
                            });

                            // console.log( "indexedDB API test complete" );
                        },

                        fn: get
                    });
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

                    // Создаем таблицу
                    db.transaction(function( trans ) {
                        trans.executeSql( "CREATE TABLE test(id INTEGER PRIMARY KEY ASC, data TEXT)", [] );
                    });

                    // Заполняем таблицу фейковыми данными
                    db.transaction(function( trans ) {
                        trans.executeSql( "INSERT INTO test(data) VALUES (?)", [ fakeData.data ], function() {
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
                                trans.executeSql( "SELECT * FROM test", [], function( trans, result ) {
                                    var test = result.rows.item( 0 );

                                    // Резолвим тест
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
                    // рутовая директория
                    root,

                    // Сколько раз мы выполнили тесты
                    index = 0;

                requestFileSystem( 0, 0, function( fs ) {
                    root = fs.root;

                    // Очищаем директорию, если она до этого существовала
                    root.getDirectory( name, {
                        create: true
                    }, function( entry ) {

                        // Сама операция удаления
                        entry.removeRecursively(function() {

                            // А теперь создаем пустую директорию
                            root.getDirectory( name, {
                                create: true,
                                exclusive: true
                            }, function( dir ) {

                                // Записываем данные
                                dir.getFile( "fakeData", {
                                    create: true,
                                    exclusive: true
                                }, function( entry ) {
                                    entry.createWriter(function( writer ) {
                                        bb = new Blob();

                                        writer.onwriteend = function() {

                                            // Тест для Filesystem API готов
                                            fsapiReady.resolve();
                                        }

                                        bb.append( fakeData.data );
                                        writer.write( bb.getBlob( "text/plain" ) );
                                    });
                                });
                            });
                        });
                    });
                });

                suite.add({
                    name: "Filesystem API",

                    // Апи асинхронное, поэтому нам нужны ассинхронные тесты
                    defer: true,

                    setup: function() {
                        // console.log( ++index );
                    },

                    teardown: function() {
                        index++;
                    },

                    onStart: function() {
                        // console.log( "Filesystem API start test" );
                    },

                    onComplete: function() {
                        show( "fsapi", {
                            hz: this.hz,
                            moe: this.stats.moe
                        });

                        // console.log( "Filesystem API test complete" );
                    },

                    fn: function( deferred ) {
                        root.getDirectory( name, {}, function( dir ) {
                            dir.getFile( "fakeData", {}, function( entry ) {
                                entry.file(function( file ) {
                                    var reader = new FileReader();

                                    reader.onload = function() {
                                        var test = this.result;

                                        // Резолвим тест
                                        deferred.resolve();
                                    };

                                    reader.readAsText( file );
                                });
                            });
                        });
                    }
                });
            }();

        } else {
            fsapiReady.resolve();
            none( "fsapi" );
        }

        // Контекст для кэша
        !function() {
            $.get( "data" ).done(function() {
                cacheReady.resolve();
            });

             var
                // Сколько раз мы выполнили тесты
                index = 0;

                suite.add({
                    name: "XHR cache",

                    defer: true,

                    setup: function() {
                        // console.log( ++index );
                    },

                    onStart: function() {
                        // console.log( "XHR cache start test" );
                    },

                    onComplete: function() {
                        show( "cache", {
                            hz: this.hz,
                            moe: this.stats.moe
                        });
                        // console.log( "XHR cache test complete" );
                    },

                    // Запришиваем XHR напрямую, что бы не вовлекать в тест время обработки и фильтровки методами jQuery
                    fn: function( deferred ) {
                        var xhr = window.XMLHttpRequest ?
                                    new window.XMLHttpRequest() : window.ActiveXObject( "Microsoft.XMLHTTP" );

                        xhr.open( "GET", "data", true );
                        xhr.send( null );
                        xhr.onreadystatechange = function() {
                            var test;

                            if ( xhr.readyState == 4 ) {
                                test = xhr.responseText;

                                // Резолвим тест
                                deferred.resolve();
                            }
                        }
                    }
                });
        }();

         if ( window.localStorage ) {

            // Очищаем localStorage
            localStorage.clear();

            // И заполняем его тестовыми данными
            localStorage[ "fakeData" ] = fakeData.data;

            // Контекст для теста localStorage
            !function() {
                suite.add({
                    name: "localStorage",

                    setup: function() {
                        // console.log( index );
                    },

                    onStart: function() {
                        // console.log( "localStorage API start test" );
                    },

                    onComplete: function() {
                        show( "ls", {
                            hz: this.hz,
                            moe: this.stats.moe
                        });
                        // console.log( "localStorage API test complete" );
                    },

                    fn: function() {
                        var test = localStorage[ "fakeData" ];
                    }
                });
            }();
        } else {
            none( "lc" );
        }

        $.when( indexedDBReady, fsapiReady, cacheReady ).done(function() {

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