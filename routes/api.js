module.exports = function (app, gestorBD) {
    app.get("/api/usuario/amigo", function (req, res) {
        //OBTENERAMIGOS
       // var criterio = {usuario: req.session.usuario};
        var criterio = {}
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                res.status(200);
                res.send(JSON.stringify(usuarios));
            }
        });
    });
    app.post("/api/usuario/mensaje", function(req, res) {
        var mensaje = {
            emisor : req.body.emisor,
            destino : req.body.destino,
            texto : req.body.texto,
            leido : false
        }
        // ¿Validar nombre, genero, precio?

        gestorBD.insertarMensaje(mensaje, function(id){
            if (id == null) {
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                })
            } else {
                res.status(201);
                res.json({
                    mensaje : "Mensaje enviado",
                    _id : id
                })
            }
        });

    });


    app.post("/api/autenticar/", function (req, res) {
        var seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');

        var criterio = {
            email: req.body.email,
            password: seguro
        }
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                res.status(401); // Unauthorized
                res.json({
                    autenticado: false
                })
            } else {
                var token = app.get('jwt').sign(
                    {usuario: criterio.email, tiempo: Date.now() / 1000},
                    "secreto");
                res.status(200);
                res.json({
                    autenticado: true,
                    token: token
                });
            }

        });
    });

}