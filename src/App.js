import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [response, setResponse] = useState('');
  
  const fetchBotData = async () => {
    try {
      const token = '6333023640:AAFfQ8H1uYOrP-q7maIgfiFzulSTnkTQ08s'; // Замените на ваш token API бота
      const chatId = 'YOUR_CHAT_ID'; // Замените на ID вашего чата с ботом
      const command = '/start'; // Замените на нужную команду

      // Отправляем запрос к серверу Telegram API
      const result = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: command,
      });

      // Обрабатываем ответ от Telegram API
      if (result.data && result.data.ok) {
        setResponse('Команда отправлена боту');
      } else {
        setResponse('Произошла ошибка при отправке команды');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <button onClick={fetchBotData}>Получить данные</button>
      <div>
        <h2>Ответ от бота:</h2>
        <p>{response}</p>
      </div>
    </div>
  );
}

export default App;
