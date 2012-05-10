// Запись, записываем «много» данных за один тест
$(function() {
    var
        // Имя того места где будем хранить данные
        name = "test",

        // сколько данных будем прогружать за один тест
        dataCount = 20,

        // Сюда будем класть тестовые данные
        tempArr = [],
        fakeData = [],

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
        };

        // Покажи пустоту
        function none( name ) {
            show( name, {
                hz: "–",
                moe: "–"
            });
        };

        // Создаем тестовые данные
        for ( var i = 0; i < dataCount; i++ ) {
            for ( var ii = 0; ii < 10; ii++ ) {
                tempArr.push( Faker.Helpers.createCard() );
            }

            fakeData.push({
                id: new Date().getTime(),

                // Сириализуем джейсон в текст,
                // что бы не включать в тесты сериализацию в какой либо другой формат данных
                data: JSON.stringify( tempArr )
            });

            tempArr = [];
        }

        // Контекст для эталонного теста
        !function() {
            var testArray = [];

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
                    for ( var i = 0; i < dataCount; i++ ) {
                        testArray[ i ] = fakeData[ i ].data;
                    }
                }
            });
        }();

        if ( indexedDB ) {

            // Контекст для теста indexedDB
            !function() {

                var
                    // здесь будет лежать наша база после ее инициализации
                    db,

                    // Сколько раз мы выполнили тесты
                    index = 1,

                    // Версия базы
                    version = 100500;

                function setup() {

                    // Создаем объекты для записи каждого теста,
                    // создадим намного больше что бы была возможность прогона каждого теста
                    for ( var i = 0; i < 100; i++ ) {
                        db.createObjectStore( i, {
                            keyPath: "id"
                        }).createIndex( "id", "id", {
                            unique: true
                        });
                    }
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
                        var last,
                            store = db.transaction([ index ], IDBTransaction.READ_WRITE ).objectStore( index );

                        for ( var i = 0; i < dataCount; i++ ) {
                            last = store.put( fakeData[ i ] );
                        }

                        // Все данные записилась, запись хоть и ассинхронна,
                        // но предполагаем что эти действия записаны в стек, поэтому ждем выполнения последней записи
                        last.onsuccess = function() {
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
                    db = openDatabase( "test", "1", "Test database", 0 );

                // Уничтожаем таблицы, если она была создана до этого
                db.transaction(function( trans ) {
                    for ( var i = 0; i < 100; i++ ) {
                        trans.executeSql( "DROP TABLE IF EXISTS test" + i , [] );
                    }
                });

                // И создаем таблицы заново
                db.transaction(function( trans ) {
                    for ( var i = 0; i < 99; i++ ) {
                        trans.executeSql( "CREATE TABLE test" + i + "(id INTEGER PRIMARY KEY ASC, data TEXT)", [] );
                    }

                    trans.executeSql( "CREATE TABLE test" + i + "(id INTEGER PRIMARY KEY ASC, data TEXT)", [], function() {
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
                            for ( var i = 0; i < dataCount - 1; i++ ) {
                                trans.executeSql( "INSERT INTO test" + index + "(data) VALUES (?)", [ fakeData[ i ].data ] );
                            }

                            trans.executeSql( "INSERT INTO test" + index + "(data) VALUES (?)", [ fakeData[ i ].data ], function() {
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
                    root = fs.root;

                    // Очищаем директорию, если она до этого существовала
                    fs.root.getDirectory( name, {
                        create: true
                    }, function( parent ) {

                        // Сама операция удаления
                        parent.removeRecursively(function() {

                            // После удаления директории создаем ее заново и наполняем пустыми папками
                            fs.root.getDirectory( name, {
                                create: true
                            }, function() {
                                dir = arguments[ 0 ];

                                // Создаем папки для записи каждого теста,
                                // создадим намного больше что бы была возможность прогона каждого теста
                                for ( var i = 0; i < 100; i++ ) {

                                    // А теперь создаем пустую директорию
                                    dir.getDirectory( i, {
                                        create: true
                                    }, function() {

                                        // Тест для Filesystem API готов
                                        fsapiReady.resolve();
                                    });
                                }
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
                        dir.getDirectory( index, {}, function( subfolder ) {
                            for ( var i = 0; i < dataCount - 1; i++ ) {
                                subfolder.getFile( i, {
                                    create: true
                                }, function( entry ) {
                                    entry.createWriter(function( writer ) {
                                        var bb = new Blob();

                                        bb.append( fakeData[ entry.name ].data );
                                        writer.write( bb.getBlob( "text/plain" ) );
                                    });
                                });
                            }

                            // Последний файл, в нем будем резолвить тест
                            subfolder.getFile( i, {
                                create: true
                            }, function( entry ) {
                                entry.createWriter(function( writer ) {
                                    var bb = new Blob();

                                    writer.onwriteend = function() {

                                        // Резолвим тест
                                        deferred.resolve();
                                    }

                                    bb.append( fakeData[ entry.name ].data );
                                    writer.write( bb.getBlob( "text/plain" ) );
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

        if ( window.localStorage ) {

            localStorage.clear();

            // Контекст для теста localStorage
            !function() {
                var
                    // Сколько раз мы выполнили тесты
                    index = 0;

                suite.add({
                    name: "localStorage",

                    setup: function() {
                        // console.log( ++index );
                    },

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
                        for ( var i = 0; i < dataCount; i++ ) {
                            localStorage[ i ] = fakeData[ i ].data;
                        }
                    }
                })
            }();
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