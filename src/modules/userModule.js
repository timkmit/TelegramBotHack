const botModule = require('./botModule')
const axios = require('axios');
function registerUser(bot,userData, chatId) {
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
  function handleMessage(msg, bot, userState) {
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
        bot.sendMessage(chatId, `ID пользователя: ${userId}\nВы ввели следующие данные:\nИмя: ${userData.first_name}\nФамилия: ${userData.last_name}\nПочта: ${userData.email}\nПароль: ${userData.password}`);
        
        // Выполните POST-запрос для регистрации пользователя
        registerUser(userData, chatId);
  
        // Отправляем сообщение с новым меню кнопок
        botModule.sendMenu(chatId);
        
        delete userState[chatId]; // Сбрасываем состояние пользователя
      } else {
        bot.sendMessage(chatId, 'Пароли не совпадают. Попробуйте снова. Введите ваш пароль:');
        userState[chatId].password = ''; // Сбрасываем пароль
      }
    }
  }
  
  module.exports = handleMessage;