const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '6333023640:AAFfQ8H1uYOrP-q7maIgfiFzulSTnkTQ08s';
const bot = new TelegramBot(token, { polling: true });

const userState = {};

let SPACES = []
let BOARDS = []
let COLUMNS = []
let TASKS = []
let COMMENTS = []


bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['Ввести данные'],
      ],
      resize_keyboard: true,
    },
  };

  bot.sendMessage(chatId, 'Для начала, выберите "Ввести данные":', options);
});

bot.onText(/Ввести данные/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Введите ваше имя:');
  userState[chatId] = { stage: 'name' };
});

bot.on('message', (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const messageText = msg.text;
  

  if (userState[chatId] && userState[chatId].stage === 'name') {
    userState[chatId].first_name = messageText; // Изменили имя
    bot.sendMessage(chatId, 'Введите вашу фамилию:');
    userState[chatId].stage = 'surname';
  } else if (userState[chatId] && userState[chatId].stage === 'surname') {
    userState[chatId].last_name = messageText; // Изменили фамилию
    bot.sendMessage(chatId, 'Введите вашу почту (через @xxx.xx):');
    userState[chatId].stage = 'email';
  } else if (userState[chatId] && userState[chatId].stage === 'email') {
    userState[chatId].email = messageText;
    bot.sendMessage(chatId, 'Введите ваш пароль (не менее 6 символов):');
    userState[chatId].stage = 'password';
  } else if (userState[chatId] && userState[chatId].stage === 'password') {
    if (!userState[chatId].password) {
      userState[chatId].password = messageText;
      bot.sendMessage(chatId, 'Повторите пароль для подтверждения:');
    } else if (messageText === userState[chatId].password) {
      const userData = userState[chatId];
      bot.sendMessage(chatId, `Вы ввели следующие данные:\nИмя: ${userData.first_name}\nФамилия: ${userData.last_name}\nПочта: ${userData.email}\nПароль: *******`);
      
      // Выполните POST-запрос для регистрации пользователя
      registerUser(userData, chatId);

      // Отправляем сообщение с новым меню кнопок
      sendMenu(chatId);

      delete userState[chatId]; // Сбрасываем состояние пользователя
    } else {
      bot.sendMessage(chatId, 'Пароли не совпадают. Попробуйте снова. Введите ваш пароль:');
      userState[chatId].password = ''; // Сбрасываем пароль
    }
  }
});

// Функция для отправки меню с кнопками
function sendMenu(chatId) {
    
  const menuOptions = {
    reply_markup: {
      keyboard: [
        ['Мое пространство'],
        ['Создать пространство'],
        ['Удалить пространство'],
      ],
      resize_keyboard: true,
    },
  };

  bot.sendMessage(chatId, 'Выберите действие:', menuOptions);
}

// Обработка нажатия на кнопки меню
bot.onText(/Мое пространство/, (msg) => {
    console.log("======", msg, "=======")
    const chatId = msg.chat.id;
    const userId = msg.from.id; 
  
    // Выполните POST-запрос для получения списка пространств пользователя
    axios
      .post('http://26.177.173.160:8888/space/spacesbyuserid', ({ telegram_id: userId }).toString())
      .then((response) => {
        console.log('Данные, полученные с сервера:', response.data);
        SPACES = response.data.data;
  
        if (SPACES.length > 0) {
          // Если есть пространства, создайте меню кнопок с именами пространств
          const keyboard = SPACES.map((space) => [space.name]);
          const menuOptions = {
            reply_markup: {
              keyboard,
              resize_keyboard: true,
            },
          };
          bot.sendMessage(chatId, 'Выберите пространство:', menuOptions);
        } else {
          // Если у пользователя нет пространств, отправьте соответствующее сообщение
          bot.sendMessage(chatId, 'У вас нет пространств.');
        }
      })
      .catch((error) => {
        // Обработка ошибки запроса пространств
        console.error('Ошибка при получении списка пространств пользователя:', error);
        bot.sendMessage(chatId, 'Произошла ошибка при получении списка пространств.');
      });
  });

  bot.onText(/Создать пространство/, (msg) => {
    const chatId = msg.chat.id;
    userState[chatId] = { stage: 'create_space_name' }; // Устанавливаем состояние на 'create_space_name'
    
    bot.sendMessage(chatId, 'Введите название пространства:');
  });
  
  // Обработка ввода пользователем названия пространства
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const messageText = msg.text;
  
    if (userState[chatId] && userState[chatId].stage === 'create_space_name') {
      const spaceName = messageText;
  
      // Отправляем POST-запрос для создания пространства
      axios
        .post('http://26.177.173.160:8888/space/create', {telegram_id: userId,
          space_name: spaceName,
        })
        .then((response) => {
          bot.sendMessage(chatId, `Пространство "${spaceName}" успешно создано.`);
          sendMenu(chatId);
        })
        .catch((error) => {
          console.error('Ошибка при создании пространства:', error);
          bot.sendMessage(chatId, 'Произошла ошибка при создании пространства.');
        });
  
      delete userState[chatId]; // Удаляем состояние пользователя
    }
  });
  
  
  

  bot.onText(/Удалить пространство/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
  

          const keyboard = SPACES.map((space) => [space.name]);
          const menuOptions = {
            reply_markup: {
              keyboard,
              resize_keyboard: true,
            },
          };
          bot.sendMessage(chatId, 'Выберите пространство для удаления:', menuOptions);
          userState[chatId] = { stage: 'delete_space' }; // Устанавливаем состояние на 'delete_space'
  });
  
  // Обработка выбора пользователем пространства для удаления
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
  
    if (userState[chatId] && userState[chatId].stage === 'delete_space') {
      const spaceIdToDelete = SPACES.find((space) => space.name == msg.text).id; // Используем space_id для удаления
  
      // Отправляем DELETE-запрос на сервер для удаления выбранного пространства
      axios
        .delete('http://26.177.173.160:8888/space/delete', {
          data: {
            telegram_id: userId,
            space_id: spaceIdToDelete, // Заменяем на space_id
          },
        })
        .then((response) => {
          // Обработка успешного удаления пространства
          console.log('Пространство успешно удалено:', response.data);
          bot.sendMessage(chatId, `Пространство с ID "${spaceIdToDelete}" успешно удалено.`);
          sendMenu(chatId);
        })
        .catch((error) => {
          // Обработка ошибки удаления пространства
          console.error('Ошибка при удалении пространства:', error);
          bot.sendMessage(chatId, `Произошла ошибка при удалении пространства с ID "${spaceIdToDelete}".`);
        });
  
      delete userState[chatId]; // Удаляем состояние пользователя
    }
  });
  
  // Обработка выбора пользователем пространства для удаления
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const messageText = msg.text;
  
    if (userState[chatId] && userState[chatId].stage === 'delete_space') {
      const spaceNameToDelete = messageText;
  
      // Отправляем DELETE-запрос на сервер для удаления выбранного пространства
      axios
        .delete('http://26.177.173.160:8888/space/delete', {
          data: {
            telegram_id: userId,
            space_id: spaceNameToDelete,
          },
        })
        .then((response) => {
          // Обработка успешного удаления пространства
          console.log('Пространство успешно удалено:', response.data);
          bot.sendMessage(chatId, `Пространство "${spaceNameToDelete}" успешно удалено.`);
          sendMenu(chatId);
        })
        .catch((error) => {
          // Обработка ошибки удаления пространства
          console.error('Ошибка при удалении пространства:', error);
          bot.sendMessage(chatId, `Произошла ошибка при удалении пространства "${spaceNameToDelete}".`);
        });
  
      delete userState[chatId]; // Удаляем состояние пользователя
    }
  });

bot.onText(/\/home/, (msg) => {
    const chatId = msg.chat.id;
    sendHomeMenu(chatId);
  });
  
  // Функция для отправки меню кнопок домашней страницы
  function sendHomeMenu(chatId) {
    const menuOptions = {
      reply_markup: {
        keyboard: [
          ['Мое пространство'],
          ['Создать пространство'],
          ['Удалить пространство'],
        ],
        resize_keyboard: true,
      },
    };
  
    bot.sendMessage(chatId, 'Домашняя страница. Выберите действие:', menuOptions);
  }

// Функция для выполнения POST-запроса на регистрацию пользователя
function registerUser(userData, chatId) {
  // URL сервера для регистрации
  const signupUrl = 'http://26.177.173.160:8888/auth/signup';
  

  axios
    .post(signupUrl, userData)
    .then((response) => {
      // Обработка успешной регистрации
      console.log('Пользователь успешно зарегистрирован:', response.data);
       bot.sendMessage(chatId, `${JSON.stringify(response.data.message)}`);
       
      
    })
    .catch((error) => {
      // Обработка ошибки регистрации
      console.error('Ошибка при регистрации пользователя:', error);
    });
}

// Функция для отправки запроса на получение пространств по ID пользователя
function sendSpacesByUserId(chatId, telegram_id) {
    const spacesUrl = `http://26.177.173.160:8888/space/spacesbyuserid`;
  
    axios
      .post(spacesUrl, ({telegram_id}).toString())
      .then((response) => {
        // Обработка успешного получения данных о пространствах
        console.log('Пространства пользователя:', response.data);
        bot.sendMessage(chatId, `Пространства пользователя: ${JSON.stringify(response.data)}`);
      })
      .catch((error) => {
        // Обработка ошибки получения данных о пространствах
        console.error('Ошибка при получении пространств пользователя:', error);
      });
  }
  
