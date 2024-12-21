var editor; // Объявление переменной editor на верхнем уровне
document.addEventListener("DOMContentLoaded", function() {

    var inputText = document.getElementById('mytextarea');
    editor = CodeMirror.fromTextArea(inputText, {
        mode: 'text/x-sql',
        lineNumbers: true,
        theme:'default',
        autofocus : true,
        autocapitalize : true
    });
    var parentWidth = document.getElementById('container').offsetWidth;
    editor.setSize("", 350)




    // Скрываем элемент textarea
    inputText.style.display = "none";

    // При загрузке DOM выполняем подписку на событие click
    document.getElementById("executeButton").addEventListener('click', function() {
        var textAboveCursor = getTextAboveCursorPosition(editor);
        sendDataToServer(textAboveCursor);
        console.log(textAboveCursor);
    });
    document.getElementById("saveButton").addEventListener('click', function() {
        saveContentToFile(editor);
    });

    document.getElementById("clearButton").addEventListener('click', function() {
        clearEditor(editor);
    });

    document.getElementById("fontsizeplus").addEventListener('click', function() {
    increaseFontSize();
    });

    document.getElementById("fontsizeminus").addEventListener('click', function() {
    decreaseFontSize();
    });


    document.getElementById('deleteButton').addEventListener('click', function() {
    // Получаем имя подсвеченного файла
    var highlightedButton = document.querySelector('.sqlFiles.highlighted');
    console.log('DELETING')
    console.log(highlightedButton)
    if (highlightedButton) {
        var fileName = highlightedButton.textContent;
        // Вызываем функцию удаления файла
        deleteFile(fileName,editor);
    }
    });

    // Добавляем обработчик события keydown
    document.addEventListener('keydown', function(event) {
        // Проверяем нажатие Command + Enter
        if (event.metaKey && event.key === 'Enter') {
            event.preventDefault(); // Предотвращаем действие по умолчанию (вставку новой строки)
            var textAboveCursor = getTextAboveCursorPosition(editor);
            sendDataToServer(textAboveCursor);
        }
    });

    fetch('/saved_files')
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Ошибка при получении файлов.');
        }
    })
    .then(data => {
        // Перебираем файлы и вызываем placeFileNamesOnBar для каждого из них
        data.result.forEach(fileName => {
            placeFileNamesOnBar(fileName);
        });
    })
    .catch(error => {
        console.error('Произошла ошибка:', error);
    });

});

function sendDataToServer(data) {
    const container = document.getElementById('resultContainer');
    const animation = ` 
                <lottie-player id="loading-animation"
                               src="https://lottie.host/8b8f293b-8e57-4916-b636-d4fdeb568271/F0hChViYKH.json"
                               background="##FFFFFF"
                               speed="2"
                               loop
                               autoplay
                               direction="1"
                               mode="normal"
                               style="width: 500px;calc(100% - 50px); display: block; margin: auto;margin-top: 100px;filter:hue-rotate(20deg) saturate(200%);">
                </lottie-player>`

    if (data !== undefined && data !== null)
    {
        container.innerHTML=animation;
        fetch('http://127.0.0.1:8000/api/v1/sql_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: data })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(responseData => {
            try {
                const objectsArray = responseData.result.split('\n').filter(Boolean);
                const parsedResults = objectsArray.map(objStr => JSON.parse(objStr.trim()));
                console.log(parsedResults)
                buildTableFromJSON(parsedResults);
            } catch (error) {
                displayDataInContainer(responseData);
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        })
        .finally(() => {
            // Скрываем анимацию
            // animation.style.display = 'none';
        });
    } else {
        console.error('Data is undefined or null');
    }
}




function buildTableFromJSON(jsonData) {
    const container = document.getElementById('resultContainer');
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse'; // Установка свойства border-collapse для объединения границ ячеек
    table.style.width = '100%'; // Задаем таблице ширину 100%
    table.style.maxWidth = '100%'; // Задаем максимальную ширину таблицы, чтобы она не выходила за пределы контейнера
    table.style.height = '20%'
    table.style.overflow = 'auto'; // Добавляем полосы прокрутки при необходимости

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Получаем ключи первого объекта для создания заголовков
    const keys = Object.keys(jsonData[0]);

    // Создаем заголовки таблицы
    const headerRow = document.createElement('tr');
    keys.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        th.style.border = '1px solid black'; // Добавляем границы к заголовкам
        th.style.padding = '8px';
        th.style.backgroundColor = '#ffffdd';
        th.style.textAlign = 'left';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Создаем строки таблицы
    jsonData.forEach(obj => {
        const row = document.createElement('tr');
        keys.forEach(key => {
            const td = document.createElement('td');
            // Проверяем, является ли значение объектом, и преобразуем его в строку JSON
            td.textContent = typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : obj[key];
            td.style.border = '1px solid black'; // Добавляем границы к ячейкам
            td.style.backgroundColor='#FFFFFF'
            td.style.padding = '8px';
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Очищаем контейнер и добавляем таблицу
    container.innerHTML = '';
    container.appendChild(table);
}



function displayDataInContainer(data) {
     const resultContainer = document.getElementById('resultContainer');
     resultContainer.style.fontSize="16px";
     resultContainer.innerText = data.result;
     if (data.result === "NO DATA!") {
            resultContainer.innerHTML =`
        <lottie-player
            src="https://lottie.host/ffa4d90c-fd16-40db-848b-4e8198196815/z576vMjKU5.json" 
            background="#FFFFFF"
            speed="2"
            autoplay
            direction="1"
            mode="normal">
        </lottie-player> 
        <div class="no-data">NO DATA IN TABLE!</div>`;
    } else {
        resultContainer.innerText = data.result;
    }
}

function getTextAboveCursorPosition(editor) {
    if (editor && editor.getValue().trim() !== '') {
        var text = editor.getValue();
        var cursorPos = editor.getCursor(); // Получаем позицию курсора
        var lineStart = cursorPos.line; // Номер строки, где находится курсор
        var result = "";

        // Пока не дошли до начала текста
        while (lineStart >= 0) {
            var lineText = editor.getLine(lineStart); // Получаем текст текущей строки
            // Если текущая строка содержит SQL-запрос, добавляем его к результату
            if (lineText.trim() !== '') {
                result = lineText + '\n' + result;
            } else {
                // Если строка пустая, значит это конец предыдущего запроса, завершаем цикл
                break;
            }
            lineStart--; // Переходим к предыдущей строке
        }

        return result.trim(); // Удаляем возможные лишние пробелы и возвращаем результат
    } else {
        return "";
    }
}


function getCursorPosition(editor) {
    return editor.getCursor().ch;
}

// Функция размещения имени файла на панели
function placeFileNamesOnBar(fileName) {
    var scriptsBar = document.getElementById('scriptsBar');
    var button = document.createElement('button');
    button.textContent = fileName;
    button.classList.add('sqlFiles');
    button.addEventListener('click', function() {
        // Очищаем подсветку у всех кнопок
        var buttons = document.querySelectorAll('.sqlFiles');
        buttons.forEach(btn => {
            btn.classList.remove('highlighted'); // Убираем класс highlighted у всех кнопок
            btn.style.backgroundColor = '#626262'; // Убираем подсветку
            btn.style.borderColor='#626262';
        });

        // Подсвечиваем текущую кнопку желтым цветом
        button.classList.add('highlighted'); // Добавляем класс highlighted к текущей кнопке
        button.style.backgroundColor = '#0400ff';
        button.style.borderColor='#0400ff'

        // Вызываем функцию отображения содержимого файла в редакторе
        displayOnEditor(fileName, editor);
    });

    scriptsBar.appendChild(button);
}





async function setFileName(callback) {
    // Создаем текстовое поле ввода
    var inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = 'Введите имя файла';

    // Обработчик нажатия Enter
    function handleEnter(event) {
        if (event.key === 'Enter') {
            var fileName = inputField.value;
            if (fileName) {
                // Удаляем текстовое поле ввода
                inputField.parentNode.removeChild(inputField);
                // Вызываем функцию обратного вызова с именем файла в качестве аргумента
                callback(fileName);
                // Удаляем обработчик события
                inputField.removeEventListener('keypress', handleEnter);
            }
        }
    }

    inputField.addEventListener('keypress', handleEnter);

    // Вставляем текстовое поле ввода в #bottomBar
    var bottomBar = document.getElementById('bottomBar');
    bottomBar.appendChild(inputField);

    // Ждем, пока пользователь введет имя файла
    await new Promise(resolve => {
        inputField.addEventListener('keypress', handleEnter);
    });
}

// Пример использования функции setFileName
async function saveContentToFile(editor) {
    // Ждем, пока пользователь введет имя файла
    await setFileName(async function(fileName) {
        var text = editor.getValue();
        // Отправляем содержимое на сервер по адресу /save_file/{file_name}
        try {
            const response = await fetch(`/save_file/${fileName}`, {
                method: 'POST',
                body: JSON.stringify({ content: text }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                console.log('Содержимое успешно сохранено в файл.');
                placeFileNamesOnBar(fileName);
            } else {
                console.error('Ошибка при сохранении содержимого в файл.');
            }
        } catch (error) {
            console.error('Произошла ошибка:', error);
        }
    });
}





function deleteFile(fileName,editor) {
    // Отправляем запрос на сервер для удаления файла
    fetch(`/save_file/${fileName}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            // Удаляем кнопку из DOM
            var button = document.querySelector('.highlighted'); // Находим подсвеченную кнопку
            if (button) {
                button.parentNode.removeChild(button);
                clearEditor(editor)
                console.log(`Файл ${fileName} удален успешно.`);
            }
        } else {
            console.error(`Ошибка при удалении файла ${fileName}.`);
        }
    })
    .catch(error => {
        console.error('Произошла ошибка:', error);
    });
}




function displayOnEditor(fileName,editor) {
    // Очищаем содержимое редактора
    // Вставляем содержимое файла в редактор
    fetch(`/save_file/${fileName}`)
    .then(response => response.text())
    .then(text => {
        editor.setValue(text);
    })
    .catch(error => {
        console.error('Произошла ошибка:', error);
    });
}


function clearEditor(editor) {
    editor.setValue(''); // Очищаем содержимое редактора
}

function changeFontSize(delta) {
    const codemirrorElements = document.getElementsByClassName("CodeMirror");
    const textarea = document.getElementById("mytextarea")
    for (let i = 0; i < codemirrorElements.length; i++) {
        // Получаем текущий размер шрифта
        let currentFontSize = parseInt(codemirrorElements[i].style.fontSize) || 13;
        let currentFontSize2 = 13;
        // Изменяем размер шрифта на заданный дельта (delta)
        let newFontSize = currentFontSize + delta;
        let newFontSize2 = currentFontSize + delta;
        // Применяем новый размер шрифта к элементу
        codemirrorElements[i].style.fontSize = newFontSize + "px";
        textarea.style.fontSize = newFontSize2 + "px";
    }
}

function increaseFontSize() {
    changeFontSize(1); // Увеличиваем размер шрифта на 1 пиксель
}

function decreaseFontSize() {
    changeFontSize(-1); // Уменьшаем размер шрифта на 1 пиксель
}