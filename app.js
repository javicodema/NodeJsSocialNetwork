var express = require('express');
var mongo = require('mongodb');
var swig = require('swig');
var app = express();
var expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));
// routerUsuarioSession
var routerUsuarioSession = express.Router();
routerUsuarioSession.use(function(req, res, next) {
    console.log("routerUsuarioSession");
    if ( req.session.usuario ) {
        // dejamos correr la petición
        next();
    } else {
        console.log("va a : "+req.session.destino)
        res.redirect("/identificarse");
    }
});
//Aplicar routerUsuarioSession
app.use("/user",routerUsuarioSession);
var crypto = require('crypto');
app.use(express.static('public'));
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app,mongo);

// Rutas/controladores por lógica
require("./routes/users.js")(app, swig,gestorBD);

// Variables
app.set('port', 8080);
app.set('db','mongodb://admin:sdi@ds241489.mlab.com:41489/socialnetwork');
app.set('clave','abcdefg');
app.set('crypto',crypto);

app.get('/', function (req, res) {
    res.redirect('/identificarse');
})


app.use( function (err, req, res, next ) {
    console.log("Error producido: " + err); //we log the error in our db
    if (! res.headersSent) {
        res.status(400);
        res.send("Recurso no disponible");
    }
});

app.listen(app.get('port'), function() {
    console.log("Servidor activo");
});

module.exports = app;