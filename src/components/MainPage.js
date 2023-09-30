const TelegramBot = require('node-telegram-bot-api');

const token = '6333023640:AAFfQ8H1uYOrP-q7maIgfiFzulSTnkTQ08s'; // Замените на ваш токен
const bot = new TelegramBot(token, { polling: true });

const userState = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['Зарегистироваться в TeamFlame'],
      ],
      resize_keyboard: true,
    },
  };

  bot.sendMessage(chatId, 'Для начала работы, выберите "Зарегистироваться в TeamFlame":', options);
});

bot.onText(/Ввести данные/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Введите ваше имя:');
  userState[chatId] = { stage: 'name' };
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (userState[chatId] && userState[chatId].stage === 'name') {
    userState[chatId].name = messageText;
    bot.sendMessage(chatId, 'Введите вашу фамилию:');
    userState[chatId].stage = 'surname';
  } else if (userState[chatId] && userState[chatId].stage === 'surname') {
    userState[chatId].surname = messageText;
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
      bot.sendMessage(chatId, `Вы ввели следующие данные:\nИмя: ${userData.name}\nФамилия: ${userData.surname}\nПочта: ${userData.email}\nПароль: ${userData.password}`);
      delete userState[chatId]; // Сбрасываем состояние пользователя
    } else {
      bot.sendMessage(chatId, 'Пароли не совпадают. Попробуйте снова. Введите ваш пароль:');
      userState[chatId].password = ''; // Сбрасываем пароль
    }
  }
});
