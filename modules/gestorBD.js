module.exports = {
    mongo: null,
    app: null,
    init: function (app, mongo) {
        this.mongo = mongo;
        this.app = app;
    },
    obtenerUsuariosPg: function (criterio, pg, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('usuarios');
                collection.count(function (err, count) {
                    collection.find(criterio).skip((pg - 1) * 5)
                        .toArray(function (err, usuarios) {
                            if (err) {
                                funcionCallback(null);
                            } else {
                                funcionCallback(usuarios, count);
                            }
                            db.close();
                        });
                });
            }
        });
    },
    obtenerPeticionesPg: function (criterio, pg, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('peticiones');
                collection.find(criterio).count(function (err, count) {
                    collection.find(criterio).skip((pg - 1) * 5).limit(5)
                        .toArray(function (err, usuarios) {
                            if (err) {
                                funcionCallback(null);
                            } else {
                                funcionCallback(usuarios, count);
                            }
                            db.close();
                        });
                });
            }
        });
    },
    obtenerAmistadesPg: function (user, pg, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('amistades');
                collection.count({$or: [{"emisor": user.email}, {"receptor": user.email}]}, function (err, count) {
                    collection.find({$or: [{"emisor": user.email}, {"receptor": user.email}]}).skip((pg - 1) * 5).limit(5)
                        .toArray(function (err, amigos) {
                            if (err) {
                                funcionCallback(null);
                            } else {
                                funcionCallback(amigos, count);
                            }
                            db.close();
                        });
                });
            }
        });
    },
    obtenerAmistades: function (user, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('usuarios');
                collection.find({"amistades": user.email}, {"_id": 1})
                    .toArray(function (err, amigos) {
                        if (err) {
                            funcionCallback(null);
                        } else {
                            funcionCallback(amigos);
                        }
                        db.close();
                    });
            }
        });
    },
    insertarPeticion: function (peticion, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('usuarios');
                collection.update({"_id": peticion.receptor._id}, {
                    $push: {"peticionesrecibidas": peticion.emisor}, function (err, result) {
                        if (err) {
                            funcionCallback(null);
                        }
                    }
                });
                var emails = {
                    emisor: peticion.emisor,
                    receptor: peticion.receptor.email
                }
                var collection = db.collection('peticiones');
                collection.insert(emails, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result.ops[0]._id);
                    }
                    db.close();
                });
            }
        });
    },
    insertarAmistad: function (amistad, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('usuarios');
                collection.update({"email": amistad.receptor}, {
                    $push: {"amistades": amistad.emisor}, function (err, result) {
                        if (err) {
                            funcionCallback(null);
                        }
                    }
                });
                collection.update({"email": amistad.emisor}, {
                    $push: {"amistades": amistad.receptor}, function (err, result) {
                        if (err) {
                            funcionCallback(null);
                        }
                    }
                });
                collection.update({"email": amistad.receptor}, {
                    $pull: {"peticionesrecibidas": amistad.emisor}, function (err, result) {
                        if (err) {
                            funcionCallback(null);
                        }
                    }
                });
                collection.update({"email": amistad.emisor}, {
                    $pull: {"peticionesrecibidas": amistad.receptor}, function (err, result) {
                        if (err) {
                            funcionCallback(null);
                        }
                    }
                });
                collection = db.collection('amistades');
                collection.insert(amistad, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    }
                });
                collection = db.collection('peticiones');
                var criterio = {
                    "emisor": amistad.emisor,
                    "receptor": amistad.receptor
                }
                collection.remove(criterio, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    }
                });
                criterio = {
                    "receptor": amistad.emisor,
                    "emisor": amistad.receptor
                }
                collection.remove(criterio, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result.result.n);
                    }
                    db.close();
                });
            }
        });
    },
    obtenerUsuarios: function (criterio, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('usuarios');
                collection.find(criterio).toArray(function (err, usuarios) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(usuarios);
                    }
                    db.close();
                });
            }
        });
    }, insertarUsuario: function (usuario, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('usuarios');
                collection.insert(usuario, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result.ops[0]._id);
                    }
                    db.close();
                });
            }
        });
    }, obtenerPeticiones: function (criterio, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('peticiones');
                collection.find(criterio).toArray(function (err, peticiones) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(peticiones);
                    }
                    db.close();
                });
            }
        });
    }, insertarMensaje: function (mensaje, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('mensajes');
                collection.insert(mensaje, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result.ops[0]._id);
                    }
                    db.close();
                });
            }
        });
    },
    esAmigo: function (mensaje, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('usuarios');
                collection.find({"amistades": mensaje.destino, "email": mensaje.emisor}, {"_id": 1})
                    .toArray(function (err, amigo) {
                        if (err) {
                            funcionCallback(null);
                        } else {
                            funcionCallback(amigo);
                        }
                        db.close();
                    });
            }
        });
    }, obtenerMensajes: function (criterio, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('mensajes');
                collection.find({$or:
                        [{$and :[{"emisor": criterio.usuario2},{"destino":criterio.usuario1}]},
                        {$and :[{"destino": criterio.usuario2},{"emisor": criterio.usuario1}]}]})
                    .toArray(function (err, amigos) {
                        if (err) {
                            funcionCallback(null);
                        } else {
                            funcionCallback(amigos);
                        }
                        db.close();
                    });
            }
        });
    },leerMensaje : function(criterio, funcionCallback) {
        var leido = {
            leido : true
        }
        this.mongo.MongoClient.connect(this.app.get('db'), function(err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('mensajes');
                collection.update(criterio, {$set: leido}, function(err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result);
                    }
                    db.close();
                });
            }
        });
    },isReceptor: function (criterio, mensaje, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('mensajes');
                collection.find({"_id": criterio._id, "destino": mensaje.receptor}, {"_id": 1})
                    .toArray(function (err, amigo) {
                        if (err) {
                            funcionCallback(null);
                        } else {
                            funcionCallback(amigo);
                        }
                        db.close();
                    });
            }
        });
    },
    eliminarTodo: function(funcionCallback){
        this.mongo.MongoClient.connect(this.app.get('db'), function(err, db){
            if(err){
                funcionCallback(null);
            }else{
                var collection=db.collection('usuarios');
                collection.deleteMany(function(err,res){
                    if(err){
                        funcionCallback(null);
                    }
                })
                collection=db.collection('peticiones');
                collection.deleteMany(function(err,res){
                    if(err){
                        funcionCallback(null);
                    }
                })
                collection=db.collection('mensajes');
                collection.deleteMany(function(err,res){
                    if(err){
                        funcionCallback(null);
                    }
                })
                collection=db.collection('amistades');
                collection.deleteMany(function(err,res){
                    if(err){
                        funcionCallback(null);
                    }
                    else{
                        funcionCallback(res);
                    }
                    db.close();
                })
            }
        })
    }

};