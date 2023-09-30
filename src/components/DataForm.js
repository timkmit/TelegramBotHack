import React, { Component } from 'react';
import axios from 'axios';

class DataForm extends Component {
  constructor() {
    super();
    this.state = {
      name: '',
      surname: '',
      email: '',
      password: '',
      confirmPassword: '',
      message: '',
    };
  }

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  handleSubmit = (e) => {
    e.preventDefault();

    const { name, surname, email, password, confirmPassword } = this.state;

    // Проверка на совпадение паролей
    if (password !== confirmPassword) {
      this.setState({
        message: 'Пароли не совпадают',
      });
      return;
    }

    // Создайте объект с данными для отправки на бекенд
    const userData = {
      name,
      surname,
      email,
      password,
    };

    // Замените 'https://your-backend-url.com/api/saveUserData' на фактический URL вашего бекенда
    axios
      .post('https://your-backend-url.com/api/saveUserData', userData)
      .then((response) => {
        // Обработка успешной отправки данных
        this.setState({
          message: 'Данные успешно отправлены на бекенд',
        });
      })
      .catch((error) => {
        // Обработка ошибки отправки данных
        this.setState({
          message: 'Ошибка при отправке данных на бекенд',
        });
      });
  };

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <div>
            <label>Имя:</label>
            <input type="text" name="name" onChange={this.handleChange} />
          </div>
          <div>
            <label>Фамилия:</label>
            <input type="text" name="surname" onChange={this.handleChange} />
          </div>
          <div>
            <label>Почта:</label>
            <input type="email" name="email" onChange={this.handleChange} />
          </div>
          <div>
            <label>Пароль:</label>
            <input type="password" name="password" onChange={this.handleChange} />
          </div>
          <div>
            <label>Подтверждение пароля:</label>
            <input type="password" name="confirmPassword" onChange={this.handleChange} />
          </div>
          <button type="submit">Отправить данные</button>
        </form>
        {this.state.message && <p>{this.state.message}</p>}
      </div>
    );
  }
}

export default DataForm;
