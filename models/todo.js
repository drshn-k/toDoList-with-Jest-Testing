"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // Todo.belongsTo(models.User, {
      //   foreignKey: "userId",
      // });
      // define association here
    }

    static getTodos() {
      return this.findAll();
    }
    static addTodo({ title, dueDate }) {
      return this.create({ title: title, dueDate: dueDate, completed: false });
    }

    setCompletionStatus(fort) {
      return this.update({ completed: fort });
    }

    static async dueLater() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
          completed: false,
        },
      });
    }
    static async dueToday() {
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date(),
          },
          completed: false,
        },
      });
    }

    static async overdue() {
      return await Todo.findAll({
        where: {
          completed: false,
          dueDate: {
            [Op.lt]: new Date(),
          },
        },
      });
    }

    static async remove(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    static async completed(id) {
      return await Todo.findAll({
        where: {
          completed: true,

          id,
        },
      });
    }
    static async completedTodos() {
      return await Todo.findAll({
        where: {
          completed: true,
        },
        order: [["id", "ASC"]],
      });
    }
    markAsCompleted() {
      return this.update({ completed: true });
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
