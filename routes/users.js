module.exports = function (app, swig, gestorBD) {
    app.get("/registrarse", function (req, res) {
        var respuesta = swig.renderFile('views/signup.html', {
            userActual: null
        });
        res.send(respuesta);
    });

    app.post('/usuario', function (req, res) {
        if (req.body.password == req.body.passwordConfirm) {
            var seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
                .update(req.body.password).digest('hex');
            var criterioEm = {
                email : req.body.email,
            }
            gestorBD.obtenerUsuarios(criterioEm, function(usuarios) {
                if (!usuarios == null || usuarios.length > 0) {
                    res.redirect("/registrarse?mensaje=Este email ya existe en la base de datos&tipoMensaje=alert-danger ")
                }else{
                    var usuario = {
                        email: req.body.email,
                        nombre: req.body.name,
                        password: seguro,
                    }
                    gestorBD.insertarUsuario(usuario, function (id) {
                        if (id == null) {
                            res.redirect("/registrarse?mensaje=Error al registrar usuario")
                        } else {
                            res.redirect("/identificarse?mensaje=Nuevo usuario registrado");
                        }

                    });
                }
            });
        }
        else {
            res.redirect("/registrarse?mensaje=Debes introducir la misma password&tipoMensaje=alert-danger ")
        }
    })
    app.get("/identificarse", function (req, res) {
        var respuesta = swig.renderFile('views/login.html', {
            userActual:null
        });
        res.send(respuesta);
    });
    app.get("/user/agregar/:id", function (req, res) {
        var receptorId = gestorBD.mongo.ObjectID(req.params.id);
        gestorBD.obtenerUsuarios(receptorId, function(usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                res.redirect("/user/list" +
                    "?mensaje=No es posible agregar a este usuario"+
                    "&tipoMensaje=alert-danger ");
            } else {
                var peticion = {
                    emisor : req.session.usuario,
                    receptor : usuarios[0]
                }
                gestorBD.insertarPeticion(peticion, function(id){
                    if (id == null) {
                        res.redirect("/user/list" +
                            "?mensaje=Error al insertar la petición"+
                            "&tipoMensaje=alert-danger ");
                    } else {
                        res.redirect("/user/list?mensaje=Usuario agregado correctamente&tipoMensaje=alert-success");
                    }
                });
            }
        });
    });
    app.get("/user/aceptar/:id", function (req, res) {
        var id = gestorBD.mongo.ObjectID(req.params.id);
        gestorBD.obtenerPeticiones(id, function(peticiones) {
            if (peticiones == null || peticiones.length == 0) {
                res.redirect("/user/requests" +
                    "?mensaje=No es posible agregar a este usuario"+
                    "&tipoMensaje=alert-danger ");
            } else {
                var amistad = {
                    receptor : req.session.usuario,
                    emisor : peticiones[0].emisor
                }
                gestorBD.insertarAmistad(amistad, function(id){
                    if (id == null) {
                        res.redirect("/user/requests" +
                            "?mensaje=Error al formalizar la amistad"+
                            "&tipoMensaje=alert-danger ");
                    } else {
                        res.redirect("/user/requests?mensaje=Usuario agregado correctamente&tipoMensaje=alert-success");
                    }
                });
            }
        });
    });
    app.post("/identificarse", function (req, res) {
        var seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');

        var criterio = {
            email: req.body.email,
            password: seguro
        }

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                req.session.usuario = null;
                res.redirect("/identificarse" +
                    "?mensaje=Email o password incorrecto" +
                    "&tipoMensaje=alert-danger ");
            } else {
                req.session.usuario = usuarios[0].email;
                res.redirect("/user/list");
            }
        });
    });

    app.get('/desconectarse', function (req, res) {
        req.session.usuario = null;
        res.redirect("/identificarse?mensaje=Desconexión realizada correctamente");
    })

    app.get('/user/list', function (req, res){
        var criterio = {};
        if (req.query.busqueda != null) {
            criterio = {$and: [{$or : [{"nombre": {$regex: ".*" + req.query.busqueda + ".*"}},{"email":{$regex: ".*" + req.query.busqueda + ".*"}}]},{"email": {$ne : req.session.usuario}}]};
        }
        else{
            criterio = {"email": {$ne : req.session.usuario}};
        }
        var pg = parseInt(req.query.pg); // Es String !!!
        if (req.query.pg == null) { // Puede no venir el param
            pg = 1;
        }
        gestorBD.obtenerUsuariosPg(criterio, pg, function (usuarios, total) {
            if (usuarios == null) {
                res.send("Error al listar ");
            } else {
                total = usuarios.length;
                var pgUltima = total / 5;
                if (total % 5 > 0) { // Sobran decimales
                    pgUltima = pgUltima + 1;
                }
                var respuesta = swig.renderFile('views/user/list.html',
                    {
                        userActual:req.session.usuario,
                        usuarios: usuarios.slice(0,5),
                        pgActual: pg,
                        pgUltima: pgUltima
                    });
                res.send(respuesta);
            }
        });
    })
    app.get('/user/requests', function (req, res){
        var criterio={
            "receptor":req.session.usuario
        }
        var pg = parseInt(req.query.pg); // Es String !!!
        if (req.query.pg == null) { // Puede no venir el param
            pg = 1;
        }
        gestorBD.obtenerPeticionesPg(criterio, pg, function (peticiones, total) {
            if (peticiones == null) {
                res.send("Error al listar ");
            } else {
                var pgUltima = total / 5;
                if (total % 5 > 0) { // Sobran decimales
                    pgUltima = pgUltima + 1;
                }
                var respuesta = swig.renderFile('views/user/requests.html',
                    {
                        userActual:req.session.usuario,
                        peticiones: peticiones,
                        pgActual: pg,
                        pgUltima: pgUltima
                    });
                res.send(respuesta);
            }
        });
    })
    app.get('/user/friends', function (req, res){
        var user={
            "email":req.session.usuario
        }
        var pg = parseInt(req.query.pg); // Es String !!!
        if (req.query.pg == null) { // Puede no venir el param
            pg = 1;
        }
        gestorBD.obtenerAmistadesPg(user, pg, function (amistades, total) {
            if (amistades == null) {
                res.send("Error al listar ");
            } else {
                var pgUltima = total / 5;
                if (total % 5 > 0) { // Sobran decimales
                    pgUltima = pgUltima + 1;
                }
                var respuesta = swig.renderFile('views/user/friends.html',
                    {
                        amistades: amistades,
                        pgActual: pg,
                        pgUltima: pgUltima,
                        userActual: req.session.usuario
                    });
                res.send(respuesta);
            }
        });
    })



};