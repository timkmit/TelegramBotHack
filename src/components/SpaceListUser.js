import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SpaceList = () => {
  const [spaces, setSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);

  useEffect(() => {
    // Здесь вы можете сделать запрос на сервер, чтобы получить список пространств
    axios.get('http://26.177.173.160:8888/auth/space/spacesbyuserid')
      .then((response) => {
        setSpaces(response.data.data);
      })
      .catch((error) => {
        console.error('Ошибка при получении списка пространств:', error);
      });
  }, []);

  const handleSpaceClick = (space) => {
    setSelectedSpace(space);
    // Здесь вы можете отправить выбранное пространство боту
    sendSpaceInfoToBot(space);
  };

  const sendSpaceInfoToBot = (space) => {
    // Отправить информацию о выбранном пространстве боту
    // Используйте библиотеку для общения с ботом (например, node-telegram-bot-api)
    // и отправьте сообщение с информацией о пространстве, например:
    // bot.sendMessage(chatId, `Информация о пространстве: ${space.name}`);
    // Здесь chatId - это идентификатор чата с пользователем
  };

  return (
    <div>
      <h1>Список пространств</h1>
      <ul>
        {spaces.map((space) => (
          <li key={space.id}>
            <button onClick={() => handleSpaceClick(space)}>
              {space.name}
            </button>
          </li>
        ))}
      </ul>
      {selectedSpace && (
        <div>
          <h2>Выбранное пространство: {selectedSpace.name}</h2>
          {/* Здесь вы можете отображать дополнительную информацию о выбранном пространстве */}
        </div>
      )}
    </div>
  );
};

export default SpaceList;
