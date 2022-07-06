/**
 * @module UniversidadModel
 */
const { object } = require('joi');
const pool = require('./connectDatabase');

const Universidad = function () {

}

/**
 * Obtiene la lista de universidades con sus datos mas relevantes.
 * @function  getAll
 * @param {callback} result Maneja el error y la respuesta, si esta es exitosa.
 * @returns {Object} Lista de datos de las universidades.
 */
Universidad.getAll = (result) => {
    let query = `
    SELECT 
        universidad.ID AS Universidad_ID, 
        universidad.Nombre, 
        universidad.Ruta_Escudo, 
        IF(universidad.Tipo=0,'Publica','Privada') AS Tipo, 
        COUNT(IF(nivel_educativo.Nombre='LICENCIATURA',1, NULL)) AS LICENCIATURA, 
        COUNT(IF(nivel_educativo.Nombre='MAESTR&IACUTE;A',1, NULL)) AS MAESTRIA, 
        COUNT(IF(nivel_educativo.Nombre='DOCTORADO',1, NULL)) AS DOCTORADO, 
        IF(COUNT(beca.Titulo) > 0, 1, 0) AS BECA, 
        GROUP_CONCAT(DISTINCT carrera.Nombre) Carreras,
        GROUP_CONCAT(DISTINCT carrera.Recurso) RecursoCarreras 
    FROM 
        universidad 
    INNER JOIN 
        carrera ON 
        universidad.ID = carrera.Universidad_ID 
    INNER JOIN 
        nivel_educativo ON 
        carrera.Nivel_Educativo_ID = nivel_educativo.ID 
    LEFT JOIN beca ON 
        universidad.ID = beca.Universidad_ID 
    GROUP BY universidad.ID 
    ORDER BY universidad.ID 
    ASC`;
    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, { message: "Ocurrio un error al obtener las universidades" });
            return;
        }
        /**
         * Separar las carreras y sus recursos de cada universidad por comas.
         * @function splitCarreras 
         * @param {Object} dataUniversidades Datos de las universidades.
         * @returns {Object} Datos de las universidades con sus carreras y recursos separados.
        */
        const dataUniversidades = res.map(dataUni => {
            return {
                ...dataUni,
                Carreras: dataUni.Carreras.split(','),
                //RecursoCarreras: dataUni.RecursoCarreras.split(',')
            }
        });

        /**
         * Arregla el duplicado de carreras y genera un json de las carreras y sus recursos
         * @function removeDuplicates
         * @param {array} array Arreglo de carreras
         * @returns {array} Arreglo de carreras sin duplicados
         * @example
         * removeDuplicates(['carrera1', 'carrera2', 'carrera1'])
         * // ['carrera1', 'carrera2']
         */
        for (let i = 0; i < dataUniversidades.length; i++) {
            dataUniversidades[i].LICENCIATURA = dataUniversidades[i].Carreras.length;
            /*dataUniversidades[i].Carrera = dataUniversidades[i].Carreras.map(carrera => {
                return {
                    Nombre: carrera,
                    Recurso: dataUniversidades[i].RecursoCarreras[i]
                }
            });*/
            //delete dataUniversidades[i].Carreras;
            delete dataUniversidades[i].RecursoCarreras;
        }

        result(null, dataUniversidades);
    });
};


Universidad.getType = (tipoUniversidad, result) => {
    let query = `SELECT universidad.ID AS Universidad_ID, universidad.Nombre, universidad.Ruta_Escudo, IF(universidad.Tipo=0,'Publica','Privada') AS Tipo, COUNT(IF(nivel_educativo.Nombre='LICENCIATURA',1, NULL)) AS LICENCIATURA, COUNT(IF(nivel_educativo.Nombre='MAESTR&IACUTE;A',1, NULL)) AS MAESTRIA, COUNT(IF(nivel_educativo.Nombre='DOCTORADO',1, NULL)) AS DOCTORADO,IF(COUNT(beca.Titulo) > 0, 1, 0) AS BECA,GROUP_CONCAT(DISTINCT carrera.Nombre) Carreras FROM universidad INNER JOIN carrera ON universidad.ID = carrera.Universidad_ID INNER JOIN nivel_educativo ON carrera.Nivel_Educativo_ID = nivel_educativo.ID LEFT JOIN beca ON universidad.ID = beca.Universidad_ID WHERE universidad.Tipo=${tipoUniversidad} GROUP BY universidad.ID ORDER BY universidad.ID ASC`;
    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result({ message: "Ocurrio un error al obtener los datos de la universidad" }, null);
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        result(null, res);
    })
}

/**
 * Se encarga de consultar los datos de una universidad especifica y responder tales datos.
 * @function getById
 * @param {string} id Id de la universidad, la cual se quiera obtener sus datos.
 * @param {callback} result Maneja los errores y responde, si todo va bien.
 */
Universidad.getById = (id, result) => {
    const urlYoutube = "https://www.youtube.com/watch?v=";

    let query = `
    SELECT
        universidad.ID,
        universidad.Nombre, 
        universidad.Ruta_Escudo, 
        IF(universidad.Tipo=0,'Publica','Privada') AS Tipo,
        GROUP_CONCAT(DISTINCT carrera.Nombre) Carreras,
        GROUP_CONCAT(DISTINCT carrera.Recurso) RecursoCarreras,
        GROUP_CONCAT(DISTINCT video.Titulo) Videos,
        GROUP_CONCAT(DISTINCT video.Recurso) RecursoVideos,
        GROUP_CONCAT(DISTINCT foto.Titulo) Fotos,
        GROUP_CONCAT(DISTINCT foto.Recurso) RecursoFotos
    FROM
        universidad
        INNER JOIN
        video
    ON 
        universidad.ID = video.Universidad_ID
    INNER JOIN carrera 
    ON 
        universidad.ID = carrera.Universidad_ID 
    INNER JOIN 
        nivel_educativo 
    ON 
        carrera.Nivel_Educativo_ID = nivel_educativo.ID
    INNER JOIN foto
        ON
    universidad.ID = foto.Universidad_ID
    WHERE
        universidad.ID =${id}`;

    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result({ message: "Ocurrio un error al obtener los datos de la universidad" }, null);
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        /**
         * Separar las carreras y sus recursos de cada universidad por comas, y agregar el link de youtube.
         * @function modifyDataUni
         * @param {Object} dataUniversidades Datos de las universidades.
         * @returns {Object} Datos de las universidades con sus carreras y recursos separados.
         */
        const data = res.map(dataUni => {
            return {
                Universidad_ID: id,
                ...dataUni,
                Recurso: urlYoutube + dataUni.Recurso,
                Carreras: dataUni.Carreras.split(','),
                RecursoCarreras: dataUni.RecursoCarreras.split(','),
                TituloVideo: dataUni.Videos.split(','),
                RecursoVideo: dataUni.RecursoVideos.split(','),
                TituloFoto: dataUni.Fotos.split(','),
                RecursoFoto: dataUni.RecursoFotos.split(',')
            }
        });

        /**
         * Genera un json con los titulos y recurso, de las carreras, fotos y videos de la universidad. 
         * @function generateJSON_Carreras
         * @param {Object} dataUni Datos de la universidad.
         * @returns {Object} Datos de la universidad y sus recursos. 
         */
        const dataUniversidad = data.map(dataUni => {
            return {
                ...dataUni,
                Carreras: dataUni.Carreras.map(carrera => {
                    return {
                        Nombre: carrera,
                        Recurso: dataUni.RecursoCarreras[dataUni.Carreras.indexOf(carrera)]
                    }
                }),
                Videos: dataUni.TituloVideo.map(video => {
                    return {
                        Titulo: video,
                        Recurso: urlYoutube + dataUni.RecursoVideo[dataUni.TituloVideo.indexOf(video)]
                    }
                }),
                Fotos: dataUni.TituloFoto.map(foto => {
                    return {
                        Titulo: foto,
                        Recurso: dataUni.RecursoFoto[dataUni.TituloFoto.indexOf(foto)]
                    }
                })
            }
        });

        //Elimina los datos de la universidad que no se necesitan
        delete dataUniversidad[0].RecursoCarreras;
        delete dataUniversidad[0].RecursoVideos;
        delete dataUniversidad[0].RecursoFotos;
        delete dataUniversidad[0].RecursoFoto;
        delete dataUniversidad[0].RecursoVideo;
        delete dataUniversidad[0].TituloFoto;
        delete dataUniversidad[0].TituloVideo;
        delete dataUniversidad[0].Recurso;

        result(null, dataUniversidad[0]);
    });
};

/**
 * Retorna una lista de universidades las cuales tengan una o mas carreras con respecto al area.
 * @function getByArea
 * @param {string} id Id del area.
 * @param {callback} result Maneja los errores y responde, si todo va bien.
 */
Universidad.getByArea = (id, result) => {
    let query = `SELECT DISTINCT universidad.ID AS Universidad_ID, universidad.Nombre AS Nombre, universidad.Ruta_Escudo, IF(universidad.Tipo=0,'Publica','Privada') AS Tipo, carrera.Nombre AS carrera FROM carrera INNER JOIN carrera_area ON carrera_area.Carrera_ID=carrera.ID INNER JOIN universidad ON carrera.Universidad_ID=universidad.ID WHERE carrera_area.Area_ID =${id}`;

    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result({ message: "Ocurrio un error al obtener los datos de las universidades" }, null);
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el area en la base de datos" }, null);
            return;
        }

        result(null, res);
    });
};

/**
 * @function getOfertaEducativa Se encarga de consultar a la base de datos, la oferta educativa de la universidad.
 * @param {string} id Id de la universidad la cual se requiera su oferta educatica.
 * @param {callback} result Maneja los errores posibles y responde los datos solicitados.
 */
Universidad.getOfertaEducativa = (id, result) => {
    let query = `SELECT carrera.Universidad_ID, carrera.ID, carrera.Nombre, carrera.Recurso FROM carrera WHERE carrera.Universidad_ID = ${id}`;

    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, { message: "Ocurrio un error al obtener la oferta educativa de la universidad" });
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        result(null, res);
    });
}

/**
 * Obtiene llos recursos multimedia Fotos y videos de la universidad requerida.
 * @function getMultimedia
 * @param {string} id Id de la universidad.
 * @param {callback} result  Responde los errores, si los hay y la respuesta.
 */
 Universidad.getMultimedia = (id, result) => {

    getFotos(id, (err, linksFotos) => {
        if (err) {
            //console.log("error: ", err);
            result({ message: "Ocurrio un error al obtener los links de las fotos" }, null);
            return;
        }
        getVideos(id, (err, linksVideos) => {
            if (err) {
                console.log("error: ", err);
                result({ message: "Ocurrio un error al obtener los links de las fotos" }, null);
                return;
            }
            const data = {
                linksFotos,
                linksVideos
            }

            result(null, data);
        });
    });

}

/**
 * la función retorna la dirección de la universidad solicitada, en un formato string
 * @function getDireccion 
 * @param {string} id Id de la universidad de la cual se quiere obtener la direción.
 * @param {callback} result Responde si hay un error en la consulta a la base de datos y responde la dirección de la universidad solicitada
 */
Universidad.getDireccion = (id, result) => {
    let query = `SELECT ubicacion.Universidad_ID, ubicacion.Num_Interior, ubicacion.Num_Exterior, ubicacion.Calle, ubicacion.Colonia, estado.Nombre AS estado, municipio.Nombre, ubicacion.Ciudad, ubicacion.Codigo_Postal FROM ubicacion INNER JOIN municipio ON ubicacion.Municipio_ID = municipio.ID INNER JOIN estado ON municipio.Estado_ID = estado.ID WHERE ubicacion.Universidad_ID = ${id}`;

    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, {
                message: "Ocurrio un error al obtener la dirección"
            });
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        const direccion = res[0].Num_Interior + " " + res[0].Num_Exterior + " " + res[0].Calle + " " + res[0].Colonia + " " + res[0].estado + " " + res[0].Nombre + " " + res[0].Ciudad + " " + res[0].Codigo_Postal;

        const Direccion = {
            Universidad_ID: res[0].Universidad_ID,
            direccion
        }

        result(null, Direccion);
    });
}

/**
 * Obtiene la url de google maps guardada en la base de datos.
 * @param {string} id Se utiliza para obtner la url de maps de la universidad solicitada.
 * @param {callback} result Se encarga de manerjar los errores y responder la url de maps de la universidad solicitada.
 */
Universidad.getUbicacion = (id, result) => {
    let query = `SELECT ubicacion.Universidad_ID, ubicacion.url_Maps FROM ubicacion WHERE ubicacion.Universidad_ID = ${id}`;
    pool.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, {
                message: "Ocurrio un error al obtener la ubicación"
            });
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        const data = res.map(dataUni => {
            return {
                Universidad_ID: dataUni.Universidad_ID,
                url_Maps: dataUni.url_Maps.substring(13, dataUni.url_Maps.length - 88)
            }
        })

        result(null, data[0]);
    })
}

/**
 * Se encarga de obtener los links de las fotos en la base de datos.
 * @function getFotos
 * @param {string} id Necesita el id la funcion para buscan en la base de datos todas las fotos de la universidad requerida.
 * @param {callback} result Se encarga de manejar los errores y responde los links de las fotos.
 */
getFotos = (id, result) => {
    let queryFoto = `SELECT foto.Universidad_ID, foto.Titulo, foto.Recurso FROM foto WHERE foto.Universidad_ID = ${id}`;

    pool.query(queryFoto, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result({ message: "Ocurrio un error en la base de datos" }, null);
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        result(null, res);
    });
}

/**
 * Se encarga de obtener los links de los videos en la base de datos.
 * @function getVideos
 * @param {string} id Necesita el id la funcion para buscan en la base de datos todas los videos de la universidad requerida.
 * @param {callback} result Se encarga de manejar los errores y responde los links de los videos.
 */
getVideos = (id, result) => {
    const urlYoutube = "https://www.youtube.com/watch?v=";

    let queryVideo = `SELECT video.Universidad_ID, video.ID, video.Titulo, video.Recurso FROM video WHERE video.Universidad_ID = ${id}`;
    pool.query(queryVideo, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result({ message: "Ocurrio un error en la base de datos" }, null);
            return;
        }

        if (Object.entries(res).length === 0) {
            result({ message: "No existe el id en la base de datos" }, null);
            return;
        }

        const data = res.map(dataUni => {
            return {
                ...dataUni,
                Recurso: urlYoutube + dataUni.Recurso
            }
        });

        result(null, data);
    });
}

module.exports = Universidad;