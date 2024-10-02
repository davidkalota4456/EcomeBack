const express = require('express');
const cors = require('cors');
require('dotenv').config();
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
require('./cron/discountScheduler');

const sequelize = require('./config/sequelize');
const userRegister = require('./routes/Register');
const userLogin = require('./routes/Login');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/Cart');
const imagesRouter = require('./routes/Images');
const discountsRouter = require('./routes/discounts');
const cartItemRouter = require('./routes/CartItem');
const totalRevenueRouter = require('./routes/totalRevenue');
const AdminRouter = require('./routes/Admin');
const Session = require('./models/Session');
const messagesRouter = require('./routes/ClientsMsg');

const app = express();
const PORT = process.env.PORT;



// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN, // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Allow cookies and other credentials
}));

app.use(express.json());

const sessionStore = new SequelizeStore({
    db: sequelize,
    model: Session,
});

app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: false, 
    store: sessionStore,
    cookie: {
        secure: process.env.SESSION_COOKIE_SECURE, 
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

app.use('/Register', userRegister)
app.use('/Login', userLogin)
app.use('/products', productRoutes);
app.use('/Cart', cartRoutes);
app.use('/Images', imagesRouter);
app.use('/discounts', discountsRouter);
app.use('/CartItem', cartItemRouter);
app.use('/totalRevenue', totalRevenueRouter);
app.use('/Admin', AdminRouter);
app.use('/ClientsMsg', messagesRouter);




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
