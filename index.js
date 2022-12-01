const express = require('express');
const { Server: HttpServer } = require('http');
const { Server: SocketServer } = require('socket.io');
const { engine } = require('express-handlebars');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const MongoContainer = require('./models/containers/Mongodb.container');
const SQLClient = require('./db/clients/sql.clients');
const dbConfig = require('./db/db.config');
const envConfig = require('./config');
const initialProducts = require('./db/assets/initialProducts');
const passport = require('./middlewares/passport');
const routes = require('./routers/app.routers');

const { createMessagesTable, createProductsTable } = require('./db/utils/createTables');

const app = express();
const httpServer = new HttpServer(app);
const io = new SocketServer(httpServer);
const PORT = 8080 || process.env.PORT;
const productsDB = new SQLClient(dbConfig.sqlite, 'products');
const messagesDB = new SQLClient(dbConfig.sqlite, 'messages');

app.engine('.hbs', engine({ extname: 'hbs' }));
app.set('view engine', '.hbs');
app.set('views', './views');

(async () => {
  try {
    await createProductsTable(dbConfig.sqlite);
    await createMessagesTable(dbConfig.sqlite);
    const products = await productsDB.getAll();
    if (products.length === 0) {
      await productsDB.save(initialProducts);
    }
  } catch (error) {
    console.log(error);
  }
})();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use(
  session({
    name: 'user-session',
    secret: envConfig.SESSION_SECRET,
    cookie: {
      maxAge: 1000 * 60,
    },
    rolling: true,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: `mongodb+srv://maurocig:${envConfig.DB_PASSWORD}@coderxx.fm0gxl1.mongodb.net/?retryWrites=true&w=majority`,
      dbName: 'sessions',
      ttl: 60,
    }),
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Socket events
io.on('connection', async (socket) => {
  console.log('nuevo cliente conectado');
  console.log(socket.id);

  const messages = await messagesDB.getAll();
  socket.emit('messages', messages);

  const products = await productsDB.getAll();
  socket.emit('products', products);

  socket.on('new-message', async (data) => {
    await messagesDB.save(data);
    const updatedMessages = await messagesDB.getAll();
    io.emit('messages', updatedMessages);
  });

  socket.on('new-product', async (data) => {
    await productsDB.save(data);
    const updatedProducts = await productsDB.getAll();
    io.emit('products', updatedProducts);
  });
});

// Routes

app.use('/', routes);

// Listen
httpServer.listen(PORT, () => {
  MongoContainer.connect().then(() => {
    console.log('Connected to DB!');
    console.log('Server running on port', PORT);
  });
});
