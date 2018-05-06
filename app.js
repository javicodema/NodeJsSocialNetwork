var express = require('express');
var mongo = require('mongodb');
var swig = require('swig');
var app = express();
var jwt = require('jsonwebtoken');
app.set('jwt',jwt);
var crypto = require('crypto');
app.use(express.static('public'));
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app,mongo);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
    // Debemos especificar todas las headers que se aceptan. Content-Type , token
    next();
});


var expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

// routerUsuarioToken
var routerUsuarioToken = express.Router();
routerUsuarioToken.use(function(req, res, next) {
    // obtener el token, puede ser un parámetro GET , POST o HEADER
    var token = req.body.token || req.query.token || req.headers['token'];
    if (token != null) {
        // verificar el token
        jwt.verify(token, 'secreto', function(err, infoToken) {
            if (err || (Date.now()/1000 - infoToken.tiempo) > 240 ){
                res.status(403); // Forbidden
                res.json({
                    acceso : false,
                    error: 'Token invalido o caducado'
                });
                // También podríamos comprobar que intoToken.usuario existe
                return;

            } else {
                // dejamos correr la petición
                res.usuario = infoToken.usuario;
                next();
            }
        });

    } else {
        res.status(403); // Forbidden
        res.json({
            acceso : false,
            mensaje: 'No hay Token'
        });
    }
});
// Aplicar routerUsuarioToken
app.use('/api/usuario', routerUsuarioToken);
app.use('/api/mensaje', routerUsuarioToken);

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


// Rutas/controladores por lógica
require("./routes/users.js")(app, swig,gestorBD);
require("./routes/api.js")(app, gestorBD);
// Variables
app.set('port', 8080);
app.set('db','mongodb://admin:sdi@ds151259.mlab.com:51259/nodejssocialnetwork');
app.set('clave','abcdefg');
app.set('crypto',crypto);

app.get('/', function (req, res) {
    res.redirect('/identificarse');
})
app.get('/secreto/admin/db/borrar', function(req, res){
    gestorBD.eliminarTodo(function(canciones){
        if ( canciones == null ){
            res.redirect("/identificarse?mensaje=Error al borrar&tipoMensaje=alert-danger ")
        } else {
            res.redirect("/identificarse?mensaje=-Todas las colecciones borradas&tipoMensaje=alert-success ")
        }
    });
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