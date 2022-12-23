const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const path = require("path");
//7 - 20


app.set("view engine" , "ejs");
app.use(express.static(path.join(__dirname, 'public')))

const { Todo } = require("./models");
app.get("/" ,async (request , response) =>{
  const allTodos = await Todo.getTodos();
  if(request.accepts("html")){ ///////////
  response.render('index' ,{
    allTodos
  });

  }else{
    response.json({
      allTodos
    }) 
  }
  // response.render('index');
});

app.get("/", function (request, response) {
  response.send("Hello World");
});


app.get("/todos", async function (request, response) {
  console.log("Processing list of all Todos ...");
  // // FILL IN YOUR CODE HERE
  try {
    const todos = await Todo.findAll();
    return response.send(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
  // console.log("Todo list", request.body);
  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  // Then, we have to respond with all Todos, like:
  // response.send(todos)
});
//
app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
//
app.post("/todos", async function (request, response) {
  console.log("Creating a todo", request.body);
  try {
    const todo = await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
    });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
  // try {
  //   const todo = await Todo.addTodo(request.body);
  //   return response.json(todo);
  // } catch (error) {
  //   console.log(error);
  //   return response.status(422).json(error);
  // }
});
//
app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
//testdeletedtodo

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  // FILL IN YOUR CODE HERE
  const DeletedListTodo = await Todo.findByPk(request.params.id);
  try {
    if (DeletedListTodo == null) {
      return response.send(false);
    } else {
      await Todo.destroy({
        where: {
          id: request.params.id,
        },
      });
      return response.send(true);
    }
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
  // First, we have to query our database to delete a Todo by ID.
  // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
  // response.send(true)
});

module.exports = app;
