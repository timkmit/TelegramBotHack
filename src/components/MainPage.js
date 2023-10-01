const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios")

const token = "6333023640:AAFfQ8H1uYOrP-q7maIgfiFzulSTnkTQ08s"; 
const bot = new TelegramBot(token, { polling: true });

let STATE = {}

bot.onText(/\/start/, (msg) => {
    const chat_id = msg.chat.id

    if(!STATE[chat_id]) STATE[chat_id] = { stage: null, access_token: null, refresh_token: null }

    if(STATE[chat_id].access_token === null || STATE[chat_id].access_token === null) {
        STATE[chat_id] = { stage: "auth", access_token: null, refresh_token: null }

        bot.sendMessage(chat_id, "Войти или зарегистрироваться", { reply_markup: { keyboard: [["Войти", "Зарегистрироваться"]] }, resize_keyboard: true })
    }
    else {
        STATE[chat_id].stage = "main"

        bot.sendMessage(chat_id, "Добро пожаловать", { reply_markup: { keyboard: [["Мои пространства"]] }, resize_keyboard: true })
    }
})

bot.onText(/Войти/, (msg) => {
    const chat_id = msg.chat.id

    if(STATE[chat_id] && STATE[chat_id].stage === "auth") {
        STATE[chat_id].stage = "auth_signin_email"

        bot.sendMessage(chat_id, "Email")
    }
})

bot.onText(/Зарегистрироваться/, (msg) => {
    const chat_id = msg.chat.id

    if(STATE[chat_id] && STATE[chat_id].stage === "auth") {
        STATE[chat_id].stage = "auth_signup_first_name"

        bot.sendMessage(chat_id, "Имя")
    }
})

bot.on("message", (msg) => {
    const chat_id = msg.chat.id
    const user_id = msg.from.id

    if(STATE[chat_id] && STATE[chat_id].stage === "auth_signin_email") {
        STATE[chat_id].email = msg.text

        STATE[chat_id].stage = "auth_signin_password"

        bot.sendMessage(chat_id, "Пароль")
    }
    else if(STATE[chat_id] && STATE[chat_id].stage === "auth_signin_password") {
        STATE[chat_id].password = msg.text

        STATE[chat_id].stage = "auth_signin_final"

        bot.sendMessage(chat_id, "Авторизация")

        authorization(chat_id, user_id, STATE[chat_id].email, STATE[chat_id].password)
    }
    else if(STATE[chat_id] && STATE[chat_id].stage === "auth_signup_first_name") {
        STATE[chat_id].first_name = msg.text

        STATE[chat_id].stage = "auth_signup_last_name"

        bot.sendMessage(chat_id, "Фамилия")
    }
    else if(STATE[chat_id] && STATE[chat_id].stage === "auth_signup_last_name") {
        STATE[chat_id].last_name = msg.text

        STATE[chat_id].stage = "auth_signup_email"

        bot.sendMessage(chat_id, "Email")
    }
    else if(STATE[chat_id] && STATE[chat_id].stage === "auth_signup_email") {
        STATE[chat_id].email = msg.text

        STATE[chat_id].stage = "auth_signup_password"

        bot.sendMessage(chat_id, "Пароль")
    }
    else if(STATE[chat_id] && STATE[chat_id].stage === "auth_signup_password") {
        STATE[chat_id].password = msg.text

        STATE[chat_id].stage = "auth_signup_final"

        bot.sendMessage(chat_id, "Регистрация")

        registration(chat_id, user_id, STATE[chat_id].first_name, STATE[chat_id].last_name, STATE[chat_id].email, STATE[chat_id].password)
    }
    else if(STATE[chat_id] && STATE[chat_id].stage === "main_spaces") {
        STATE[chat_id].space = msg.text

        STATE[chat_id].stage = "main_spaces_option"

        bot.sendMessage(chat_id, `Вы выбрали ${STATE[chat_id].space}`, { reply_markup: { keyboard: [["Проекты", "Удалить пространство"]] }, resize_keyboard: true })
    }
})

bot.on("polling_error", (error) => {
    console.error("Ошибка:", error)
})

bot.onText(/Проекты/, (msg) => {
    const chat_id = msg.chat.id

    if(STATE[chat_id] && STATE[chat_id].stage === "main_spaces_option") projects(chat_id)
})

function projects(chat_id) {
    console.log(STATE[chat_id].spaces, STATE[chat_id].space )
    axios.post("http://26.177.173.160:8888/project/projectsbyspace", {
        access_token: STATE[chat_id].access_token,
        space_id: STATE[chat_id].spaces.find((space) => space.name == STATE[chat_id].space).id
    })
    .then((response) => {
        console.log(response)

        STATE[chat_id].projects = response.data.data

        bot.sendMessage(chat_id, `Ваши проекты:\n${STATE[chat_id].projects.map((project) => project.name).join("\n")}`)
    })
    .catch((error) => {
        console.log(error.response)

        bot.sendMessage(chat_id, "Произошла ошибка при получении проектов")
    })
}

function authorization(chat_id, user_id, email, password) {
    axios.post("http://26.177.173.160:8888/auth/signin", {
        telegram_id: String(user_id),
        //email: email,
        //password: password,
        email: "test228@mail.ru",
        password: "123456"
    })
    .then((response) => {
        console.log(response)

        STATE[chat_id].access_token = response.data.data.access_token
        STATE[chat_id].refresh_token = response.data.data.refresh_token

        bot.sendMessage(chat_id, "Авторизация прошла успешно")
    })
    .catch((error) => {
        console.log(error.response)

        bot.sendMessage(chat_id, "Произошла ошибка при авторизации")
    })
}

function registration(chat_id, user_id, first_name, last_name, email, password) {
    console.log(chat_id)
    axios.post("http://26.177.173.160:8888/auth/signup", {
        telegram_id: String(user_id),
        first_name: first_name,
        last_name: last_name,
        email: email,
        password: password
    })
    .then((response) => {
        console.log(response)

        STATE[chat_id].access_token = response.data.data.access_token
        STATE[chat_id].refresh_token = response.data.data.refresh_token

        bot.sendMessage(chat_id, "Регистрация прошла успешно")
    })
    .catch((error) => {
        console.log(error.response)
        
        bot.sendMessage(chat_id, "Произошла ошибка при регистрации")
    })
}

function spaces(chat_id) {
    axios.post("http://26.177.173.160:8888/space/spacesbyuserid", {
        access_token: STATE[chat_id].access_token
    })
    .then((response) => {
        console.log(response)

        STATE[chat_id].spaces = response.data.data

        bot.sendMessage(chat_id, `Ваши пространства:\n${STATE[chat_id].spaces.map((space, i) => `${i+1} - ${space.name}`).join("\n")}`)

        STATE[chat_id].stage = "main_spaces"

        bot.sendMessage(chat_id, "Выберите пространство", { reply_markup: { keyboard: [STATE[chat_id].spaces.map((space) => space.name)] }, resize_keyboard: true })
    })
    .catch((error) => {
        console.log(error.response)

        bot.sendMessage(chat_id, "Произошла ошибка при получении пространств")
    })
}

bot.onText(/Мои пространства/, (msg) => {
    const chat_id = msg.chat.id

    if(STATE[chat_id] && STATE[chat_id].stage === "main") spaces(chat_id)
})


















// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   const options = {
//     reply_markup: {
//       keyboard: [
//         ['Ввести данные'],
//       ],
//       resize_keyboard: true,
//     },
//   };

//   bot.sendMessage(chatId, 'Для начала, выберите "Ввести данные":', options);
// });

// bot.onText(/Ввести данные/, (msg) => {
//   const chatId = msg.chat.id;

//   bot.sendMessage(chatId, 'Введите ваше имя:');
//   userState[chatId] = { stage: 'name' };
// });

// bot.on('message', (msg) => {
//   const userId = msg.from.id;
//   const chatId = msg.chat.id;
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'name') {
//     userState[chatId].first_name = messageText;
//     bot.sendMessage(chatId, 'Введите вашу фамилию:');
//     userState[chatId].stage = 'surname';
//   } else if (userState[chatId] && userState[chatId].stage === 'surname') {
//     userState[chatId].last_name = messageText;
//     bot.sendMessage(chatId, 'Введите вашу почту (через @xxx.xx):');
//     userState[chatId].stage = 'email';
//   } else if (userState[chatId] && userState[chatId].stage === 'email') {
//     userState[chatId].email = messageText;
//     bot.sendMessage(chatId, 'Введите ваш пароль (не менее 6 символов):');
//     userState[chatId].stage = 'password';
//   } else if (userState[chatId] && userState[chatId].stage === 'password') {
//     if (!userState[chatId].password) {
//       userState[chatId].password = messageText;
//       bot.sendMessage(chatId, 'Повторите пароль для подтверждения:');
//     } else if (messageText === userState[chatId].password) {
//       const userData = userState[chatId];
//       bot.sendMessage(chatId, `Вы ввели следующие данные:\nИмя: ${userData.first_name}\nФамилия: ${userData.last_name}\nПочта: ${userData.email}\nПароль: *******`);

//       registerUser(userData, userId.toString());

//       sendMenu(chatId);

//       delete userState[chatId];
//     } else {
//       bot.sendMessage(chatId, 'Пароли не совпадают. Попробуйте снова. Введите ваш пароль:');
//       userState[chatId].password = '';
//     }
//   }
// });

// function sendMenu(chatId) {
//   const menuOptions = {
//     reply_markup: {
//       keyboard: [
//         ['Мое пространство'],
//         ['Создать пространство'],
//         ['Удалить пространство'],
//       ],
//       resize_keyboard: true,
//     },
//   };

//   bot.sendMessage(chatId, 'Выберите действие:', menuOptions);
// }

// bot.onText(/\/home/, (msg) => {
//     const chatId = msg.chat.id;
//     sendMenu(chatId); // Вызываем функцию sendMenu для отправки начального меню
//   });

// bot.onText(/Мое пространство/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();

//   axios
//     .post('http://26.177.173.160:8888/space/spacesbyuserid', { access_token: ACCESS_TOKEN })
//     .then((response) => {
//       SPACES = response.data.data;

//       if (SPACES.length > 0) {
//         const keyboard = SPACES.map((space) => [space.name]);
//         const menuOptions = {
//           reply_markup: {
//             keyboard,
//             resize_keyboard: true,
//           },
//         };
//         bot.sendMessage(chatId, 'Выберите пространство:', menuOptions);
//         userState[chatId] = { stage: 'choose_space' };
//       } else {
//         bot.sendMessage(chatId, 'У вас нет пространств.');
//         sendMenu(chatId);
//       }
//     })
//     .catch((error) => {
//       console.error('Ошибка при получении списка пространств пользователя:', error);
//       bot.sendMessage(chatId, 'Произошла ошибка при получении списка пространств.');
//     });
// });

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'choose_space') {
//     const selectedSpace = SPACES.find((space) => space.name === messageText);

//     if (selectedSpace) {
//       axios
//         .post('http://26.177.173.160:8888/project/projectsbyspace', {
//             access_token: ACCESS_TOKEN,
//           space_id: selectedSpace.id,
//         })
//         .then((response) => {
//           PROJECTS = response.data.data;

//           if (PROJECTS.length > 0) {
//             const keyboard = PROJECTS.map((project) => [project.name]);
//             const menuOptions = {
//               reply_markup: {
//                 keyboard,
//                 resize_keyboard: true,
//               },
//             };
//             bot.sendMessage(chatId, 'Проекты в выбранном пространстве:', menuOptions);
//             userState[chatId] = { stage: 'choose_project' };
//           } else {
//             bot.sendMessage(chatId, 'В выбранном пространстве нет проектов.');
//           }
//         })
//         .catch((error) => {
//           console.error('Ошибка при получении проектов пространства:', error);
//           bot.sendMessage(chatId, 'Произошла ошибка при получении проектов пространства.');
//         });
//     } else {
//       bot.sendMessage(chatId, 'Пространство с выбранным именем не найдено.');
//     }

//     delete userState[chatId];
//   }
// });

// bot.onText(/Создать пространство/, (msg) => {
//   const chatId = msg.chat.id;
//   userState[chatId] = { stage: 'create_space_name' };

//   bot.sendMessage(chatId, 'Введите название пространства:');
// });

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'create_space_name') {
//     const spaceName = messageText;

//     axios
//       .post('http://26.177.173.160:8888/space/create', {
//         access_token: ACCESS_TOKEN,
//         space_name: spaceName,
//       })
//       .then((response) => {
//         bot.sendMessage(chatId, `Пространство "${spaceName}" успешно создано.`);
//         sendMenu(chatId);
//       })
//       .catch((error) => {
//         console.error('Ошибка при создании пространства:', error);
//         bot.sendMessage(chatId, 'Произошла ошибка при создании пространства.');
//       });

//     delete userState[chatId];
//   }
// });

// bot.onText(/Удалить пространство/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();

//   const keyboard = SPACES.map((space) => [space.name]);
//   const menuOptions = {
//     reply_markup: {
//       keyboard,
//       resize_keyboard: true,
//     },
//   };
//   bot.sendMessage(chatId, 'Выберите пространство для удаления:', menuOptions);
//   userState[chatId] = { stage: 'delete_space' };
// });

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'delete_space') {
//     const spaceIdToDelete = SPACES.find((space) => space.name === messageText)?.id;

//     if (spaceIdToDelete) {
//       axios
//         .delete('http://26.177.173.160:8888/space/delete', {
//           data: {
//             access_token: ACCESS_TOKEN,
//             space_id: spaceIdToDelete,
//           },
//         })
//         .then((response) => {
//           console.log('Пространство успешно удалено:', response.data);
//           bot.sendMessage(chatId, `Пространство с ID "${spaceIdToDelete}" успешно удалено.`);
//           sendMenu(chatId);
//         })
//         .catch((error) => {
//           console.error('Ошибка при удалении пространства:', error);
//           bot.sendMessage(chatId, `Произошла ошибка при удалении пространства с ID "${spaceIdToDelete}".`);
//         });
//     } else {
//       bot.sendMessage(chatId, 'Пространство с выбранным именем не найдено.');
//       sendMenu(chatId);
//     }

//     delete userState[chatId];
//   }
// });

// bot.onText(/Управление проектами/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();

//   if (PROJECTS.length > 0) {
//     const keyboard = PROJECTS.map((project) => [project.name]);
//     const menuOptions = {
//       reply_markup: {
//         keyboard,
//         resize_keyboard: true,
//       },
//     };
//     bot.sendMessage(chatId, 'Выберите проект:', menuOptions);
//     userState[chatId] = { stage: 'choose_project' };
//   } else {
//     bot.sendMessage(chatId, 'У вас нет проектов в выбранном пространстве.');
//   }
// });

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'choose_project') {
//     const selectedProject = PROJECTS.find((project) => project.name === messageText);

//     if (selectedProject) {
//       axios
//         .post('http://26.177.173.160:8888/board/boardsbyproject', {
//             access_token: ACCESS_TOKEN,
//             project_id: selectedProject.id,
//           })
//         .then((response) => {
//           BOARDS = response.data.data;

//           if (BOARDS.length > 0) {
//             const keyboard = BOARDS.map((board) => [board.name]);
//             const menuOptions = {
//               reply_markup: {
//                 keyboard,
//                 resize_keyboard: true,
//               },
//             };
//             bot.sendMessage(chatId, 'Доски в выбранном проекте:', menuOptions);
//             userState[chatId] = { stage: 'choose_board' };
//           } else {
//             bot.sendMessage(chatId, 'В выбранном проекте нет досок.');
//           }
//         })
//         .catch((error) => {
//           console.error('Ошибка при получении досок проекта:', error);
//           bot.sendMessage(chatId, 'Произошла ошибка при получении досок проекта.');
//         });
//     } else {
//       bot.sendMessage(chatId, 'Проект с выбранным именем не найден.');
//     }

//     delete userState[chatId];
//   }
// });

// bot.onText(/Создать проект/, (msg) => {
//   const chatId = msg.chat.id;
//   userState[chatId] = { stage: 'create_project_name' };

//   bot.sendMessage(chatId, 'Введите название проекта:');
// });

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'create_project_name') {
//     const projectName = messageText;

//     const selectedSpace = SPACES.find((space) => space.name === messageText);
//     if (selectedSpace) {
//       bot.sendMessage(chatId, 'Проект с таким именем уже существует в выбранном пространстве.');
//       delete userState[chatId];
//       return;
//     }

//     axios
//       .post('http://26.177.173.160:8888/project/create', {
//         access_token: ACCESS_TOKEN,
//         space_id: selectedSpace.id,
//         project_name: projectName,
//       })
//       .then((response) => {
//         bot.sendMessage(chatId, `Проект "${projectName}" успешно создан.`);
//         sendMenu(chatId);
//       })
//       .catch((error) => {
//         console.error('Ошибка при создании проекта:', error);
//         bot.sendMessage(chatId, 'Произошла ошибка при создании проекта.');
//       });

//     delete userState[chatId];
//   }
// });

// bot.onText(/Удалить проект/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();

//   const keyboard = PROJECTS.map((project) => [project.name]);
//   const menuOptions = {
//     reply_markup: {
//       keyboard,
//       resize_keyboard: true,
//     },
//   };
//   bot.sendMessage(chatId, 'Выберите проект для удаления:', menuOptions);
//   userState[chatId] = { stage: 'delete_project' };
// });

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'delete_project') {
//     const projectIdToDelete = PROJECTS.find((project) => project.name === messageText)?.id;

//     if (projectIdToDelete) {
//       axios
//         .delete('http://26.177.173.160:8888/project/delete', {
//           data: {
//             access_token: ACCESS_TOKEN,
//             project_id: projectIdToDelete,
//           },
//         })
//         .then((response) => {
//           console.log('Проект успешно удален:', response.data);
//           bot.sendMessage(chatId, `Проект с ID "${projectIdToDelete}" успешно удален.`);
//           sendMenu(chatId);
//         })
//         .catch((error) => {
//           console.error('Ошибка при удалении проекта:', error);
//           bot.sendMessage(chatId, `Произошла ошибка при удалении проекта с ID "${projectIdToDelete}".`);
//         });
//     } else {
//       bot.sendMessage(chatId, 'Проект с выбранным именем не найден.');
//       sendMenu(chatId);
//     }

//     delete userState[chatId];
//   }
// });

// bot.onText(/Управление досками/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();

//   if (BOARDS.length > 0) {
//     const keyboard = BOARDS.map((board) => [board.name]);
//     const menuOptions = {
//       reply_markup: {
//         keyboard,
//         resize_keyboard: true,
//       },
//     };
//     bot.sendMessage(chatId, 'Выберите доску:', menuOptions);
//     userState[chatId] = { stage: 'choose_board' };
//   } else {
//     bot.sendMessage(chatId, 'У вас нет досок в выбранном проекте.');
//   }
// });

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'choose_board') {
//     const selectedBoard = BOARDS.find((board) => board.name === messageText);

//     if (selectedBoard) {
//       axios
//         .post('http://26.177.173.160:8888/column/getbyboard', {
//             access_token: ACCESS_TOKEN,
//             board_id: selectedBoard.id,
//           })
//         .then((response) => {
//           COLUMNS = response.data.data;

//           if (COLUMNS.length > 0) {
//             const keyboard = COLUMNS.map((column) => [column.name]);
//             const menuOptions = {
//               reply_markup: {
//                 keyboard,
//                 resize_keyboard: true,
//               },
//             };
//             bot.sendMessage(chatId, 'Колонки в выбранной доске:', menuOptions);
//             userState[chatId] = { stage: 'choose_column' };
//           } else {
//             bot.sendMessage(chatId, 'В выбранной доске нет колонок.');
//           }
//         })
//         .catch((error) => {
//           console.error('Ошибка при получении колонок доски:', error);
//           bot.sendMessage(chatId, 'Произошла ошибка при получении колонок доски.');
//         });
//     } else {
//       bot.sendMessage(chatId, 'Доска с выбранным именем не найдена.');
//     }

//     delete userState[chatId];
//   }
// });

// bot.onText(/Создать доску/, (msg) => {
//   const chatId = msg.chat.id;
//   userState[chatId] = { stage: 'create_board_name' };

//   bot.sendMessage(chatId, 'Введите название доски:');
// });

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'create_board_name') {
//     const boardName = messageText;

//     axios
//       .post('http://26.177.173.160:8888/board/create', {
//         access_token: ACCESS_TOKEN,
//         project_id: selectedProject.id,
//         board_name: boardName,
//       })
//       .then((response) => {
//         bot.sendMessage(chatId, `Доска "${boardName}" успешно создана.`);
//         sendMenu(chatId);
//       })
//       .catch((error) => {
//         console.error('Ошибка при создании доски:', error);
//         bot.sendMessage(chatId, 'Произошла ошибка при создании доски.');
//       });

//     delete userState[chatId];
//   }
// });

// bot.onText(/Удалить доску/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();

//   const keyboard = BOARDS.map((board) => [board.name]);
//   const menuOptions = {
//     reply_markup: {
//       keyboard,
//       resize_keyboard: true,
//     },
//   };
//   bot.sendMessage(chatId, 'Выберите доску для удаления:', menuOptions);
//   userState[chatId] = { stage: 'delete_board' };
// });

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'delete_board') {
//     const boardIdToDelete = BOARDS.find((board) => board.name === messageText)?.id;

//     if (boardIdToDelete) {
//       axios
//         .delete('http://26.177.173.160:8888/board/delete', {
//           data: {
//             access_token: ACCESS_TOKEN,
//             board_id: boardIdToDelete,
//           },
//         })
//         .then((response) => {
//           console.log('Доска успешно удалена:', response.data);
//           bot.sendMessage(chatId, `Доска с ID "${boardIdToDelete}" успешно удалена.`);
//           sendMenu(chatId);
//         })
//         .catch((error) => {
//           console.error('Ошибка при удалении доски:', error);
//           bot.sendMessage(chatId, `Произошла ошибка при удалении доски с ID "${boardIdToDelete}".`);
//         });
//     } else {
//       bot.sendMessage(chatId, 'Доска с выбранным именем не найдена.');
//       sendMenu(chatId);
//     }

//     delete userState[chatId];
//   }
// });

// bot.onText(/Управление задачами/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();

//   if (COLUMNS.length > 0) {
//     const keyboard = COLUMNS.map((column) => [column.name]);
//     const menuOptions = {
//       reply_markup: {
//         keyboard,
//         resize_keyboard: true,
//       },
//     };
//     bot.sendMessage(chatId, 'Выберите колонку:', menuOptions);
//     userState[chatId] = { stage: 'choose_column' };
//   } else {
//     bot.sendMessage(chatId, 'В выбранной доске нет колонок.');
//   }
// });

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'choose_column') {
//     const selectedColumn = COLUMNS.find((column) => column.name === messageText);

//     if (selectedColumn) {
//       axios
//         .post('http://26.177.173.160:8888/task/getbycolumn', {
//             access_token: ACCESS_TOKEN,
//             column_id: selectedColumn.id,
//           })
//         .then((response) => {
//           TASKS = response.data.data;

//           if (TASKS.length > 0) {
//             const keyboard = TASKS.map((task) => [task.name]);
//             const menuOptions = {
//               reply_markup: {
//                 keyboard,
//                 resize_keyboard: true,
//               },
//             };
//             bot.sendMessage(chatId, 'Задачи в выбранной колонке:', menuOptions);
//             userState[chatId] = { stage: 'choose_task' };
//           } else {
//             bot.sendMessage(chatId, 'В выбранной колонке нет задач.');
//           }
//         })
//         .catch((error) => {
//           console.error('Ошибка при получении задач колонки:', error);
//           bot.sendMessage(chatId, 'Произошла ошибка при получении задач колонки.');
//         });
//     } else {
//       bot.sendMessage(chatId, 'Колонка с выбранным именем не найдена.');
//     }

//     delete userState[chatId];
//   }
// });

// bot.onText(/Создать задачу/, (msg) => {
//   const chatId = msg.chat.id;
//   userState[chatId] = { stage: 'create_task_name' };

//   bot.sendMessage(chatId, 'Введите название задачи:');
// });

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'create_task_name') {
//     const taskName = messageText;

//     axios
//       .post('http://26.177.173.160:8888/task/create', {
//         access_token: ACCESS_TOKEN,
//         column_id: selectedColumn.id,
//         task_name: taskName,
//       })
//       .then((response) => {
//         bot.sendMessage(chatId, `Задача "${taskName}" успешно создана.`);
//         sendMenu(chatId);
//       })
//       .catch((error) => {
//         console.error('Ошибка при создании задачи:', error);
//         bot.sendMessage(chatId, 'Произошла ошибка при создании задачи.');
//       });

//     delete userState[chatId];
//   }
// });

// bot.onText(/Удалить задачу/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();

//   const keyboard = TASKS.map((task) => [task.name]);
//   const menuOptions = {
//     reply_markup: {
//       keyboard,
//       resize_keyboard: true,
//     },
//   };
//   bot.sendMessage(chatId, 'Выберите задачу для удаления:', menuOptions);
//   userState[chatId] = { stage: 'delete_task' };
// });

// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id.toString();
//   const messageText = msg.text;

//   if (userState[chatId] && userState[chatId].stage === 'delete_task') {
//     const taskIdToDelete = TASKS.find((task) => task.name === messageText)?.id;

//     if (taskIdToDelete) {
//       axios
//         .delete('http://26.177.173.160:8888/task/delete', {
//           data: {
//             access_token: ACCESS_TOKEN,
//             task_id: taskIdToDelete,
//           },
//         })
//         .then((response) => {
//           console.log('Задача успешно удалена:', response.data);
//           bot.sendMessage(chatId, `Задача с ID "${taskIdToDelete}" успешно удалена.`);
//           sendMenu(chatId);
//         })
//         .catch((error) => {
//           console.error('Ошибка при удалении задачи:', error);
//           bot.sendMessage(chatId, `Произошла ошибка при удалении задачи с ID "${taskIdToDelete}".`);
//         });
//     } else {
//       bot.sendMessage(chatId, 'Задача с выбранным именем не найдена.');
//       sendMenu(chatId);
//     }

//     delete userState[chatId];
//   }
// });

// bot.onText(/Список задач/, (msg) => {
//   const chatId = msg.chat.id;

//   if (TASKS.length > 0) {
//     const taskList = TASKS.map((task) => task.name).join('\n');
//     bot.sendMessage(chatId, `Список задач:\n${taskList}`);
//   } else {
//     bot.sendMessage(chatId, 'У вас нет задач в выбранной колонке.');
//   }
// });

// bot.onText(/Назад/, (msg) => {
//   const chatId = msg.chat.id;
//   sendMenu(chatId);
// });



// bot.onText(/Список проектов/, (msg) => {
//   const chatId = msg.chat.id;

//   if (PROJECTS.length > 0) {
//     const projectList = PROJECTS.map((project) => project.name).join('\n');
//     bot.sendMessage(chatId, `Список проектов:\n${projectList}`);
//   } else {
//     bot.sendMessage(chatId, 'У вас нет проектов в выбранном пространстве.');
//   }
// });

// bot.onText(/Список досок/, (msg) => {
//   const chatId = msg.chat.id;

//   if (BOARDS.length > 0) {
//     const boardList = BOARDS.map((board) => board.name).join('\n');
//     bot.sendMessage(chatId, `Список досок:\n${boardList}`);
//   } else {
//     bot.sendMessage(chatId, 'У вас нет досок в выбранном проекте.');
//   }
// });

// bot.onText(/Список задач/, (msg) => {
//   const chatId = msg.chat.id;

//   if (TASKS.length > 0) {
//     const taskList = TASKS.map((task) => task.name).join('\n');
//     bot.sendMessage(chatId, `Список задач:\n${taskList}`);
//   } else {
//     bot.sendMessage(chatId, 'У вас нет задач в выбранной колонке.');
//   }
// });

// bot.onText(/Назад/, (msg) => {
//   const chatId = msg.chat.id;
//   sendMenu(chatId);
// });



// bot.onText(/Назад/, (msg) => {
//   const chatId = msg.chat.id;
//   sendMenu(chatId);
// });

// bot.onText(/help/, (msg) => {
//   const chatId = msg.chat.id;
//   bot.sendMessage(
//     chatId,
//     `Доступные команды:
// - Создать пространство
// - Удалить пространство
// - Управление проектами
// - Список проектов
// - Управление досками
// - Список досок
// - Управление задачами
// - Список задач
// - Назад (для возврата в главное меню)
// - Помощь (для отображения списка команд)`,
//     { parse_mode: 'Markdown' }
//   );
// });

// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   bot.sendMessage(
//     chatId,
//     'Привет! Для начала работы выберите команду из меню или воспользуйтесь командой /help, чтобы увидеть список доступных команд.'
//   );
// });

// bot.on('polling_error', (error) => {
//   console.error('Ошибка при работе с Telegram Bot API:', error);
// });

