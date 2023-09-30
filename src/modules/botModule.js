exports.start = function(chatId,bot){
    const options = {
      reply_markup: {
        keyboard: [
          ['Ввести данные'],
        ],
        resize_keyboard: true,
      },
    };
  
    bot.sendMessage(chatId, 'Для начала, выберите "Ввести данные":', options);
}
// exports.restart = function(chatId,bot){
//     bot.sendMessage(chatId, 'Бот будет перезапущен через 3 секунды.').then(() => {
//     // Остановите бота
//     bot.stopPolling();
//     // Через некоторое время (например, 5 секунд) запустите бота снова
//     setTimeout(() => {
//       bot.startPolling();
//     }, 3000); // Здесь 5000 миллисекунд (5 секунд) - это задержка перед повторным запуском
//   });
// }
// Функция для отправки меню с кнопками
exports.sendMenu = function (chatId,bot, showBackButton = false) {
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