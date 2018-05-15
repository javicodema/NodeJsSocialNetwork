module.exports = function (app, gestorBD) {
    app.get("/api/usuario/amigo", function (req, res) {
        var criterio = {"email":res.usuario};
        gestorBD.obtenerAmistades(criterio, function (usuarios){
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
    app.put("/api/mensaje/:id", function(req, res) {
        var id = req.params.id;
        var criterio = {
            _id:gestorBD.mongo.ObjectID(id)
        }
        var mensaje = {
            receptor : res.usuario
        }

        gestorBD.isReceptor(criterio, mensaje, function(receptor){
            if(receptor==null || receptor.length <= 0 ){
                res.status(500);
                res.json({
                    error : "no es el receptor"
                })
            } else {
                gestorBD.leerMensaje(criterio, function(id){
                    if (id == null) {
                        res.status(500);
                        res.json({
                            error : "se ha producido un error"
                        })
                    } else {
                        res.status(201);
                        res.json({
                            mensaje : "Mensaje actualizado"
                        })
                    }
                });
            }

        });

    });

    app.get("/api/mensaje", function (req, res) {
        var criterio = {
            "usuario1":res.usuario,
            "usuario2":req.query.usuario
        };
        gestorBD.obtenerMensajes(criterio, function (mensajes){
            if (mensajes == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                res.status(200);
                res.send(JSON.stringify(mensajes));
            }
        });
    });
    app.post("/api/mensaje", function(req, res) {
        var mensaje = {
            emisor : res.usuario, //email
            destino : req.body.destino, //email
            texto : req.body.texto,
            leido : false
        }

        gestorBD.esAmigo(mensaje, function(amigo){
            if(amigo==null || amigo.length <= 0 ){
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                })
            } else {
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