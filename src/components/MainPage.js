const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const userSpaces = {};
const token = '6333023640:AAFfQ8H1uYOrP-q7maIgfiFzulSTnkTQ08s'; // Замените на свой токен
const userCurrentState = {};

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
    userState[chatId].first_name = messageText;
    bot.sendMessage(chatId, 'Введите вашу фамилию:');
    userState[chatId].stage = 'surname';
  } else if (userState[chatId] && userState[chatId].stage === 'surname') {
    userState[chatId].last_name = messageText;
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
function sendMenu(chatId, showBackButton = false) {
  let keyboard = [
    ['Мое пространство'],
    ['Создать пространство'],
    ['Удалить пространство'],
  ];

  if (showBackButton) {
    keyboard.push(['Назад']);
  }

  const menuOptions = {
    reply_markup: {
      keyboard,
      resize_keyboard: true,
    },
  };

  bot.sendMessage(chatId, 'Выберите действие:', menuOptions);
}

// Обработка нажатия на кнопку "Мое пространство"
bot.onText(/Мое пространство/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Получение списка пространств
    const spacesResponse = await axios.post('http://26.177.173.160:8888/space/spacesbyuserid', ({ telegram_id: userId }).toString());
    const spaces = spacesResponse.data.data;

    // Сохраняем список пространств для данного пользователя
    userSpaces[userId] = spaces;

    // Сохраняем текущее состояние пользователя
    userCurrentState[userId] = 'spaces';

    // Отправляем сообщение с кнопками для пространств и кнопкой "Назад"
    sendSpacesMenu(chatId, spaces, true);
  } catch (error) {
    console.error('Ошибка при получении списка пространств:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при получении списка пространств.');
  }
});

bot.onText(/Создать пространство/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Вы выбрали "Создать пространство"');
});

bot.onText(/Удалить пространство/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Вы выбрали "Удалить пространство"');
});

// Обработка нажатия на кнопки пространств
bot.onText(/(.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const selectedSpaceName = match[1];

  if (userCurrentState[userId] === 'spaces') {
    if (userSpaces[userId]) {
      const selectedSpace = userSpaces[userId].find((space) => space.name === selectedSpaceName);

      if (selectedSpace) {
        sendSpaceInformation(chatId, selectedSpace);
      } else {
        bot.sendMessage(chatId, 'Выбранное пространство не найдено.');
      }
    } else {
      bot.sendMessage(chatId, 'У вас нет доступных пространств.');
    }
  }
});

// Обработка нажатия на кнопку "Назад"
bot.onText(/Назад/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userCurrentState[userId] === 'spaces') {
    sendMenu(chatId, true);
    userCurrentState[userId] = 'menu';
  }
});

// Функция для выполнения POST-запроса на регистрацию пользователя
function registerUser(userData, chatId) {
  const signupUrl = 'http://26.177.173.160:8888/auth/signup';

  axios
    .post(signupUrl, userData)
    .then((response) => {
      console.log('Пользователь успешно зарегистрирован:', response.data);
      bot.sendMessage(chatId, `${JSON.stringify(response.data.message)}`);
    })
    .catch((error) => {
      console.error('Ошибка при регистрации пользователя:', error);
    });
}
function sendSpaceInformation(chatId, space) {
    const spaceInfo = `Название пространства: ${space.name}\nОписание: ${space.description}`;
    bot.sendMessage(chatId, spaceInfo);
  
    sendMenu(chatId, true);
  }

function sendSpacesMenu(chatId, spaces) {
  const keyboard = spaces.map((space) => [space.name]);

  const menuOptions = {
    reply_markup: {
      keyboard,
      resize_keyboard: true,
    },
  };

  bot.sendMessage(chatId, 'Выберите пространство:', menuOptions);
}


