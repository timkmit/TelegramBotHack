const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = '6333023640:AAFfQ8H1uYOrP-q7maIgfiFzulSTnkTQ08s'; // Замените на ваш токен
const bot = new TelegramBot(token, { polling: true });

const userState = {};

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
    bot.sendMessage(chatId, 'Введите вашу почту:');
    userState[chatId].stage = 'email';
  } else if (userState[chatId] && userState[chatId].stage === 'email') {
    userState[chatId].email = messageText;
    bot.sendMessage(chatId, 'Введите ваш пароль:');
    userState[chatId].stage = 'password';
  } else if (userState[chatId] && userState[chatId].stage === 'password') {
    if (!userState[chatId].password) {
      userState[chatId].password = messageText;
      bot.sendMessage(chatId, 'Повторите пароль для подтверждения:');
    } else if (messageText === userState[chatId].password) {
      const userData = userState[chatId];
      bot.sendMessage(chatId, `Вы ввели следующие данные:\nИмя: ${userData.first_name}\nФамилия: ${userData.last_name}\nПочта: ${userData.email}\nПароль: ${userData.password}`);
      
      // Выполните POST-запрос для регистрации пользователя
      registerUser(userData, chatId);

      // Отправляем сообщение с новым меню кнопок
      sendMenu(chatId);
      bot.sendMessage(chatId, `ID пользователя: ${userId}\nВы ввели следующие данные:\nИмя: ${userData.first_name}\nФамилия: ${userData.last_name}\nПочта: ${userData.email}\nПароль: ${userData.password}`);

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
    const chatId = msg.chat.id;
    const userId = msg.from.id; // Добавьте эту строку, чтобы получить userId
    bot.sendMessage(chatId, 'Вы выбрали "Мое пространство"');
    sendSpacesByUserId(chatId, userId);
});

bot.onText(/Создать пространство/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Вы выбрали "Создать пространство"');
});

bot.onText(/Удалить пространство/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Вы выбрали "Удалить пространство"');
});

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
  

