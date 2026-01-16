const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const artikelRouter = require('./routes/artikel');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Konfigurasi session
app.use(session({
    secret: 'secret-key-anda', // ganti dengan secret yang kuat
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // gunakan true jika pakai HTTPS
}));

// Dummy akun
const dummyUser = {
    username: 'admin',
    password: 'password123'
};

// Middleware proteksi dashboard
function authMiddleware(req, res, next) {
    if (req.session && req.session.loggedIn) {
        return next();
    }
    res.redirect('/index.html');
}

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === dummyUser.username && password === dummyUser.password) {
        req.session.loggedIn = true;
        req.session.username = username;
        return res.redirect('/dashboard');
    }
    res.redirect('/failed.html');
});

// Dashboard route (proteksi)
app.get('/dashboard', authMiddleware, (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/index.html');
    });
});

app.use('/api/artikel', artikelRouter);

app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});
