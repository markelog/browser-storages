<h1>Сравнение скоростей чтения/записи временных хранилищ</h1>
<h2>Увертюра</h2>
<p>
Шесть нативных браузерных АПИ позволяют хранить «временные» данные на клиенте, некоторые из них считаются медленными, некоторые – асинхронными.
</p>
<p>
Хочется проверить на сколько, в действительности, производительна запись и чтение в них и из них, а также я немного затрону целесообразность использования и некоторые особенности.
</p>
<p>
Cookie и AppCache рассматриваться не будут, первую из-за ограниченных возможностей, вторую из-за невозможности работы через JavaScript.
</p>

<p>
Но перед этим следует описать АПИ Хрома позволяющее определять лимиты для большинства хранилищ и возможности самих хранилищ.
</p>

<h2>Quota Management API</h2>
<p>
Это АПИ управляет лимитами для большинства временных хранилищ – AppCache, IndexedDB, WebSQL, File System API все они используют Quota API для расчета файловой квоты, это АПИ не является частью стандарта и имплементировано только в Хроме. Квота высчитывается не для каждого хранилища,
как в других браузерах, а для всего приложения в целом.
</p>

<p>
Общий пулл размера квоты считается так –
<pre>
( свободное место на диске + место занимаемое всеми приложениями использующие временные хранилища ) / 2
</pre>
Каждое приложение работающее с любым хранилищем имеет возможность занять 20% от этого места.
</p>

<p>
Данные которые уже хранятся во временных хранилищах, могут быть удалены по усмотрению (например при превышении квоты) браузера, удаляется не часть данных, а все данные сразу.
</p>
<p>
Следовательно, браузер может работать одновременно только с пятью приложениями работающими с максимальным объемом временных хранилищ, следующий запрос на предоставление квоты, вызовет удаление, как минимум, всех данных самого неиспользуемого (из пяти) зарегистрированного приложения.
</p>

<dl>
<dt>Ссылки: </dt>
<dd>
<ul>
<li><a href="https://developers.google.com/chrome/whitepapers/storage">Managing HTML5 Offline Storage</a></li>
<li><a href="http://updates.html5rocks.com/2011/11/Quota-Management-API-Fast-Facts">Quota Management API : fast facts</a></li>
</ul>
</dd>
</dl>

<h2>Filesystem API</h2>
<dl>
<dt>Поддержка браузеров</dt>
<dd>Chrome 17+</dd>

<dt>Ограничение на объем</dt>
<dd>Считается через Quota API</dd>

<dt>Типы данных</dt>
<dd>
Blob (и File, но объект File наследуется от Blob'а, поэтому только Blob) прочитать эти данные можно ссылкой через протокол «filesystem» в любом виде, а так же через интерфейс «FileReader» в четырех качествах:
<ol>
<li>как бинарные данные,</li>
<li>как текст,</li>
<li>как arrayBuffer-объект,</li>
<li>в формате Data URL</li>
</ol>
<dd>

<dt>Асинхронность</dt>
<dd>Может быть синхронной и асинхронной</dd>

<dt>Ссылки</dt>
<dd><a href="http://www.w3.org/TR/file-system-api/">W3C Working Draft</a></dd>
<dd><a href="http://www.html5rocks.com/en/tutorials/file/filesystem/">Exploring the Filesystem API</a></dd>
<dd><a href="https://developer.mozilla.org/en/DOM/File_APIs/Filesystem/Basic_Concepts_About_the_Filesystem_API">Basic Concepts About the Filesystem API</a></dd>
<dd><a href="https://developer.mozilla.org/en/DOM/File_API/File_System_API">File System API</a></dd>
<dd><a href="https://developer.mozilla.org/en/DOM/FileReader#Method_overview">FileReader</a></dd>

<dt>Библиотеки</dt>
<dd><a href="https://github.com/zocky/cdjs/blob/master/cd.js">cdjs</a> (враппер, добавляет цепочечный интерфейс)</dd>
<dd><a href="https://github.com/ebidel/filer.js">filer.js</a> (для упрощения интерфейса)</dd>
<dd><a href="https://github.com/ebidel/idb.filesystem.js">idb.filesystem.js</a> (полифил для Firefox'а)</dd>
</dl>

<h2>IndexedDB API</h2>
<dl>
<dt>Поддержка браузеров</dt>
<dd>Firefox 4+</dd>
<dd>Chrome 11+</dd>
<dd>IE 10+</dd>

<dt>Ограничение на объем</dt>
<dd>Firefox (4–12) – 50MB</dd>
<dd>IE10 – 10MB </dd>
<dd>Chrome – считается через Quota API</dd>

<dt>Типы данных</dt>
<dd>Почти любые JavaScript-сущности, но не все, функции например, хранить нельзя</dd>

<dt>Асинхронность</dt>
<dd>Может быть синхронной и асинхронной</dd>

<dt>Особенности</dt>
<dd>Firefox всегда спрашивает разрешение на размещение данных.<br/>
При создании базы, мета-данные уже инициализируются в хранилище.
</dd>
<dd>Спека меняется очень часто, на данный момент ни одна из текущих имплементаций IndexedDB ей не удовлетворяет, зато нужные изменения уже есть в Firefox Aurora, Chrome Canary и IE10</dd>

<dt>Ссылки</dt>
<dd><a href="http://www.w3.org/TR/IndexedDB/">W3C Working Draft</a></dd>
<dd><a href="https://developer.mozilla.org/en/IndexedDB/Basic_Concepts_Behind_IndexedDB">Basic Concepts About IndexedDB</dd>
<dd><a href="https://developer.mozilla.org/en/IndexedDB/Using_IndexedDB">Using IndexedDB</a></dd>
<dd><a href="http://www.html5rocks.com/en/tutorials/indexeddb/todo/">A simple TODO list using HTML5 IndexedDB</a></dd>
<dd><a href="http://www.nyayapati.com/surya/2012/05/using-and-working-with-indexeddb/">Using and working with IndexedDB</a></dd>

<dt>Библиотеки</dt>
<dd><a href="https://github.com/jensarps/IDBWrapper">IDBWrapper</a> (для упрощения интерфейса)</dd>
<dd><a href="https://github.com/axemclion/jquery-indexeddb">jquery-indexeddb</a></dd>
<dd><a href="https://github.com/Sigura/inDB">inDB</a> (враппер, добавляет цепочечный интерфейс)</dd>
</dl>

<h2>Web SQL Database</h2>
<dl>
<dt>Поддержка браузеров</dt>
<dd>Chrome 6+</dd>
<dd>Safari 3.2+</dd>
<dd>Opera 10.5+</dd>

<dt>Ограничение на объем</dt>
<dd>Chrome – считается через Quota API</dd>
<dd>Opera, Safari – 5MB</dd>

<dt>Асинхронность</dt>
<dd>Может быть синхронной и асинхронной</dd>

<dt>Особенности</dt>
<dd>Только Read-write транзакции блокируют все базу.</dd>
<dd>Только в Опере можно удалять базу явно, похоже только Опера удаляет базу когда она становится пуста.</dd>
<dd>W3C-спецификация устарела, обновляться более не будет, вендоров браузеров более не просят ее имплементировать.</dd>

<dt>Ссылки</dt>
<dd><a href="http://www.w3.org/TR/webdatabase/">Web SQL Database</a></dd>
<dd><a href="http://www.html5rocks.com/en/tutorials/webdatabase/todo/">A simple todo list using html5 webdatabases</a></dd>
</dl>

<h2>Web Storage/DOM Storage</h2>
<dl>
<dt>Поддержка браузеров</dt>
<dd>IE8+</dd>
<dd>Firefox 2+</dd>
<dd>Chrome 6+</dd>
<dd>Safari 4+</dd>
<dd>Opera 10.5+</dd>

<dt>Ограничение на объем</dt>
<dd>IE – примерно 10MB</dd>
<dd>Для всех остальных объем варьируется от 2.5–5MB</dd>

<dt>Асинхронность</dt>
<dd>синхронна, но IE8 записывает данные в Web Storage асинхронно. <br/>
    Событий для Web Storage'а нет в IE8, в отличие от других браузеров
</dd>

<dt>Особенности</dt>
<dd>Внутри Хрома, данные хранилища хранятся в SQLite</dd>
<dd>Существует распространенное заблуждение – localStorage записывает и читает данные напрямую на жестким диск,
это не так, на сколько мне известно, ни одна имплементация localStorage'а не работает таким образом, запись и чтениние происходит в память,
это происходить или
<ol>
<li> При первом запросе к localStorage'у, </li>
<li> или при загрузки страницы, </li>
<li> или путем объединения первых двух способов. </li>
</ol>
</dd>

<dt>Ссылки, библиотеки</dt>
<dd>Вы и так их все знаете</dd>
</dl>

<h2>Целесообразность</h2>
<p>
Хоть некоторые из этих АПИ и похожи друг на друга, но предназначены совершенно для разных задач, в Web Storage не имеет смысла хранить изображения (если это не data: URL), для этого есть Filesystem, в Filesystem не имеет смысла хранить uid пользователя, для этого есть Web Storage или Cookie и т.д.
</p>
<p>
Поэтому нельзя, например, сравнивать скорость чтения JSON'а из Web Storage и IndexedDB, так как на скорость теста для Web Storage'а будет накладываться время сериализация JSON'а из строки, когда для IndexedDB такой операции проводится не будет.
</p>

<h2>Про тесты</h2>
<p>
Для того что бы сгладить предметную область этих разношерстных АПИ, я буду записывать и читать большое количество текста и сравнивать их со скоростью чтения и записи данных в обычный массив, это не совсем корректно (или супер не корректно) – эти действия будут считаться эталонными для более цельного отображения картины происходящего.
</p>
<p>
Тест на чтение включает в себя скорость возврата данных 304 XHR-запроса, он послужит для понимания логичности использования постоянных хранилищ в целом.
</p>

<dl>
<dt>Для тестов использовались</dt>
<dd><a href="http://twitter.github.com/bootstrap">bootstrap</a>,</dd>
<dd><a href="http://benchmarkjs.com">benchmarkjs</a> – для проведений самих тестов,</dd>
<dd><a href="https://github.com/marak/Faker.js">Faker.js</a> – для генерации тестовых данных,</dd>
<dd><a href="http://jquery.com">jQuery</a> – ну, куда без нее? Она использовалась для представлении данных на страницах тестов, а так же для оповещения о их готовности, хочется заметить – ее использование заключалось именно в этих двух вещах, в самих тестах она не использовалась, поэтому на производительность тестов никак не влияла.</dd>
</dl>

<p>
Как и какие данные я записываю/читаю можно посмотреть в этом репозитории. При тестирование записи, данные могут быть много раз перезаписаны, кроме тестов для Web SQL, для нее данные будут только добавляться.
</p>

<p>
В тестах на производительность, всегда возникают сомнения, наверное это в порядке вещей, но если тесты вам показались несправедливыми, пожалуйста аргументируете ваше мнение, путем указания на место в коде которое вас смущает.
</p>
<p>
Если же сама метрика тестирования вам кажется неверной, сообщите об этом <a href="https://github.com/bestiejs/benchmark.js/issues">здесь</a>, как она работает можно почитать <a href="http://calendar.perfplanet.com/2010/bulletproof-javascript-benchmarks/">здесь</a>,<br/>
benchmarkjs, не может корректно посчитать скорость для асинхронных интерфейсов, в действительности они быстрее чем показано ниже.</p>

<p>Считать будем количество операций в секунду – ops/sec, чем больше, тем лучше.</p>

<h2>Результаты тестов</h2>
<h3>Чтение</h3>
<table>
<tr>
<th>Браузер</th>
<th>Эталон</th>
<th>IndexedDB</th>
<th>Web SQL Database</th>
<th>Filesystem API</th>
<th>Web Storage</th>
<th>XHR Cache</th>
</tr>

<tr>
<td>Chrome 18</td>
<td>650 761 516.775</td>
<td>84.581</td>
<td>109.977</td>
<td>97.816</td>
<td>539.876</td>
<td>16.930</td>
</tr>

<tr>
<td>Firefox 12</td>
<td>119 020 589.175</td>
<td>84.193</td>
<td>–</td>
<td>–</td>
<td>879.423</td>
<td>1.344</td>
</tr>

<tr>
<td>Opera 11.5</td>
<td>43 025 733.486</td>
<td>–</td>
<td>36.741</td>
<td>–</td>
<td>1 159.823</td>
<td>9.714</td>
</tr>

<tr>
<td>Safari 5</td>
<td>40 928 935.241</td>
<td>–</td>
<td>133.380</td>
<td>–</td>
<td>4 232 616.940</td>
<td>53.405</td>
</tr>

<tr>
<td>IE9</td>
<td>5 762 459.478</td>
<td>–</td>
<td>–</td>
<td>–</td>
<td>3 355</td>
<td>20.446</td>
</tr>
</table>

<h3>Запись</h3>
<table>
<tr>
<th>Браузер</th>
<th>Эталон</th>
<th>IndexedDB</th>
<th>Web SQL Database</th>
<th>Filesystem API</th>
<th>Web Storage</th>
</tr>

<tr>
<td>Chrome 18</td>
<td>41 907 154.621</td>
<td>44.069</td>
<td>129.668</td>
<td>59.086</td>
<td>699.812</td>
</tr>

<tr>
<td>Firefox 12</td>
<td>31 499 963.174</td>
<td>127.516</td>
<td>–</td>
<td>–</td>
<td>1 558.388</td>
</tr>

<tr>
<td>Opera 11.5</td>
<td>18 154 985.007</td>
<td>–</td>
<td>41.087</td>
<td>–</td>
<td>387.542</td>
</tr>

<tr>
<td>Safari 5</td>
<td>9 401 432.812</td>
<td>–</td>
<td>54.682</td>
<td>–</td>
<td>3 191 444.952</td>
</tr>

<tr>
<td>IE9</td>
<td>971 154.603</td>
<td>–</td>
<td>–</td>
<td>–</td>
<td>376.790</td>
</tr>
</table>


<h3>Запись «большого» количества данных, за одну итерацию</h3>
<p>
    Интересно посмотреть как хранилища ведут себя под «большой» нагрузкой, когда за одну транзакцию/открытие файла, будет много запросов.
</p>

<table>
<tr>
<th>Браузер</th>
<th>Эталон</th>
<th>IndexedDB</th>
<th>Web SQL Database</th>
<th>Filesystem API</th>
<th>Web Storage</th>
</tr>

<tr>
<td>Chrome 18</td>
<td>4 854 573.020</td>
<td>11.579</td>
<td>62.354</td>
<td>18.251</td>
<td>204.102</td>
</tr>

<tr>
<td>Firefox 12</td>
<td>5 737 748.010</td>
<td>28.585</td>
<td>–</td>
<td>–</td>
<td>386.602</td>
</tr>

<tr>
<td>Opera 11.5</td>
<td>2 444 058.790</td>
<td>–</td>
<td>25.953</td>
<td>–</td>
<td>438.978</td>
</tr>

<tr>
<td>Safari 5</td>
<td>4 018 659.866</td>
<td>–</td>
<td>6.448</td>
<td>–</td>
<td>163 011.926</td>
</tr>

<tr>
<td>IE9</th>
<td colspan="5">Не имеет смысла</td>
</tr>
</table>

<h3>Выводы</h3>
<p>
Web Storage показывает намного меньшую производительность чем эталонный тест, но даже в самых худших случаях 400 операций в секунду должно быть достаточно для большинства приложений (ага, кому как), это не быстро, но и не медленно.
</p>
<p>
Что действительно радует, так это неожиданная производительность Сафари, всего на 60% медленнее эталонного теста, похоже эти ребята идут по правильному пути.
</p>

<p>
IndexedDB работает медленнее чем Web SQL, но по сравнению с SQLite, IndexedDB довольно молодой стандарт, браузеры только-только его имплементируют, после того как имплементации будут удовлетворять спеке (и когда сама спека станет стабильной), можно будет <a href="http://code.google.com/p/chromium/issues/detail?id=122831">ожидать</a> повышения производительности. Тогда как ожидать оптимизаций для Web SQL будет оптимистично.
</p>

<p>
Filesystem API уже показывает сравнительно неплохую производительность, предоставляя взамен очень классные возможности, но она пока, есть только в одном браузере...
</p>

<h4>Похожие статьи</h4>
<ol>
<li><a href="http://marakana.com/bookshelf/html5_tutorial/data_storage.html">Html5 Tutorial : Data Storage</a></li>
<li><a href="http://www.drdobbs.com/article/print?articleId=232900805&siteSectionName=jvm">Understanding Client-Side Storage in Web Apps</a></li>
<li><a href="http://www.html5rocks.com/en/tutorials/offline/storage/">Client-side storage</a></li>
<li><a href="http://calendar.perfplanet.com/2011/localstorage-read-performance/">localStorage Read Performance</a></li>
</ol>
