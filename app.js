// eslint-disable-next-line
const express = require("express");
const csrf = require("tiny-csrf");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const { User } = require("./models");
const saltRounds = 10;
const flash = require("connect-flash");
const path = require("path");
app.set("views", path.join(__dirname, "views"));

app.use(flash());
app.use(bodyParser.json());
// const path = require("path");
app.use(express.urlencoded({ extended: false }));
//7 - 20
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch((error) => {
          return done(error);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.use(
  session({
    secret: "my-super-secret-key-21728172615261562",
    cookie: {
      maxAge: 24 * 60 * 60 * 100, //24hrs
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
const { Todo } = require("./models");
const { log } = require("console");
const { userInfo } = require("os");

// eslint-disable-next-line no-unused-vars
app.get("/", async (request, response) => {
  response.render("index", {
    title: "Todo application",
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggerInUser = request.user.id;
    const overdue = await Todo.overdue(loggerInUser);
    const dueToday = await Todo.dueToday(loggerInUser);
    const dueLater = await Todo.dueLater(loggerInUser);
    const completedtodos = await Todo.completedTodos(loggerInUser);
    if (request.accepts("html")) {
      response.render("todos", {
        title: "Todo application",
        overdue,
        dueToday,
        dueLater,
        completedtodos,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        overdue,
        dueToday,
        dueLater,
        completedtodos,
      });
    }
  }
);

// eslint-disable-next-line no-unused-vars
app.get("/signup", (request, response) => {
  response.locals.errors = request.flash("error");

  // response.render("signup", {
  //   title: "Sign up",
  //   csrfToken: request.csrfToken(),
  // });
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      console.log(err);
    });
    response.redirect("/");
  } catch (error) {
    console.log(error);
  }
});
app.get("/login", (request, response) => {
  response.locals.errors = request.flash("error");
  // response.render("login", { title: "Login", csrfToken: request.csrfToken() });
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }

    response.redirect("/");
  });
});
// app.post("/session" , passport.authenticate('local' , { failureRedirect: "/login"}) , (request , response) => {
//   console.log(request.user);
//     response.redirect("/todos")
// })
// eslint-disable-next-line no-unused-vars
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    response.redirect("/todos");
  }
);

app.get("/todos", async function (request, response) {
  console.log("Processing list of all Todos ...");
  // // FILL IN YOUR CODE HERE
  try {
    const todos = await Todo.findAll();
    return response.json(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
//
app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    console.log(response.json(todo));
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
//
app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Creating a todo", request.body);
    console.log(request.user);
    try {
      await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
//
app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    // const todo = await Todo.findByPk(request.params.id);
    try {
      const todo = await Todo.findByPk(request.params.id); //
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed
      ); //
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
//testdeletedtodo

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/login" }),
  async (request, response) => {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    // FILL IN YOUR CODE HERE
    let count = 0;

    try {
      count = await Todo.remove(request.params.id, request.user.id);
      response.json({ success: count != 0 });
      return;
    } catch (error) {
      console.log(error);
      response.status(422).json({ success: false });
      return;
    }
  }
);

module.exports = app;
